
"""
SWEPilot orchestrator:

GitHub issue webhook
    -> clone repository
    -> run mini-SWE-agent locally
    -> display agent logs
    -> run independent pytest gate
    -> create SWEPilot branch
    -> commit and push changes
    -> open pull request

Run:
    uvicorn run_agent:app --host 0.0.0.0 --port 8000 --reload
"""

import logging
import os
import subprocess
import sys
import tempfile
import base64
import shutil
from pathlib import Path
from urllib.parse import quote

from dotenv import load_dotenv
from azure.identity import (
    DefaultAzureCredential,
    get_bearer_token_provider,
)
from fastapi import FastAPI, Request
from github import Github

from minisweagent.agents.default import DefaultAgent
from minisweagent.environments.local import LocalEnvironment
from minisweagent.models.litellm_model import LitellmModel


# ---------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------

# ---------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------

LOG_LEVEL = os.getenv("SWEPILOT_LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
    force=True,
)

# Suppress verbose SDK and HTTP logs.
for noisy_logger in (
    "LiteLLM",
    "litellm",
    "openai",
    "httpx",
    "httpcore",
    "uvicorn.access",
):
    logging.getLogger(noisy_logger).setLevel(logging.WARNING)

logging.getLogger("minisweagent").setLevel(logging.INFO)

logger = logging.getLogger("SWEPilot")


def log(message: str, level: int = logging.INFO) -> None:
    """Write a concise application log entry."""
    logger.log(level, message)


# ---------------------------------------------------------------------
# Application and configuration
# ---------------------------------------------------------------------

app = FastAPI()

load_dotenv(
    Path(__file__).with_name(".env"),
    override=True,
)

GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
REPO_NAME = os.environ["REPO_NAME"]

FOUNDRY_ENDPOINT = os.environ[
    "AZURE_FOUNDRY_ENDPOINT"
].rstrip("/")

FOUNDRY_DEPLOYMENT = os.environ[
    "AZURE_FOUNDRY_DEPLOYMENT"
]

FOUNDRY_API_VERSION = os.getenv(
    "AZURE_FOUNDRY_API_VERSION",
    "2025-04-01-preview",
)

# Change this if your repository uses a different test file.
def issue_test_filename(issue_number: int) -> str:
    return f"test_issue_{issue_number}_generated.py"

gh = Github(GITHUB_TOKEN)


# ---------------------------------------------------------------------
# Mini-SWE-agent
# ---------------------------------------------------------------------

SYSTEM_TEMPLATE = """
You are an autonomous software engineering agent.

You work directly inside a local Windows repository.

Rules:
- Inspect the repository before making changes.
- Implement the requested GitHub issue.
- Use terminal commands to inspect, edit, and test files.
- Make actual implementation changes when required.
- Write a focused test for the current issue.
- Run the relevant tests after editing.
- Do not commit changes.
- Do not push changes.
- Do not create pull requests.
- Do not claim completion without checking git diff.

Windows command rules:
- The terminal uses Windows CMD.
- Use `dir` instead of `ls`.
- Do not use Unix commands, heredocs, shell redirection for multiline source,
  PowerShell here-strings, `copy con`, `set /p`, or interactive editors.
- Never use interactive commands.
- Do not write Python or HTML source using multiline `echo` commands.
- For creating or replacing a file, use one non-interactive Python command with
  `pathlib.Path.write_text(...)`, or another reliable non-interactive method.
- Ensure all generated Python files contain valid, executable Python syntax.
- After creating a Python file, run:
  `python -m py_compile <filename>`
"""

INSTANCE_TEMPLATE = """
Solve the following GitHub issue.

<issue>
{{task}}
</issue>

Requirements:
1. Inspect the existing files first.
2. Create or update the issue-specific test requested in the task.
3. Implement the actual change in the repository.
4. Run:
   `python -m py_compile test_issue_{{issue_number}}_generated.py`
   when the issue-specific test is a Python file.
5. Run the issue-specific test.
6. Inspect git diff and verify that both the test and implementation changed.
7. Do not commit, push, or create a pull request.

Important Windows restrictions:
- Do not use `copy con`.
- Do not use `echo` to construct source files.
- Do not use heredocs or PowerShell here-strings.
- Do not use interactive commands.
- Create files using a single non-interactive Python command, for example:
  `python -c "from pathlib import Path; Path('file.py').write_text('...')"`
- If quoting becomes difficult, use a base64-encoded file payload and decode it
  with Python.
- Do not stop after modifying only the implementation; the issue-specific test
  must also exist and pass.

When the task is complete, run:

echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT
"""

class OrchestratorAgent(DefaultAgent):
    """
    Local mini-SWE-agent with detailed console logs.

    The completion command is intercepted and converted into the exit
    message expected by DefaultAgent.run().
    """

    COMPLETION_MARKER = (
        "COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT"
    )

    def step(self) -> list[dict]:
        """
        Log the beginning and end of every mini-SWE-agent step.
        """

        step_number = self.n_calls + 1

        log("")
        log("=" * 90)
        log(
            f"[mini-SWE-agent] STARTING STEP "
            f"{step_number}"
        )
        log("=" * 90)

        try:
            result = super().step()

            log(
                f"[mini-SWE-agent] FINISHED STEP "
                f"{step_number}"
            )

            return result

        except Exception as exc:
            log(
                f"[mini-SWE-agent] ERROR IN STEP "
                f"{step_number}: {exc}"
            )
            raise

    def execute_actions(self, message: dict) -> list[dict]:
        """
        Execute model-generated commands while logging each command
        and its output.
        """

        actions = message.get("extra", {}).get(
            "actions",
            [],
        )

        if not actions:
            log(
                "[mini-SWE-agent] The model returned no actions."
            )

        outputs = []

        for action_number, action in enumerate(
            actions,
            start=1,
        ):
            command = action.get("command", "")

            log("")
            log("-" * 90)
            log(
                f"[mini-SWE-agent] ACTION "
                f"{action_number}"
            )
            log("[mini-SWE-agent] COMMAND:")
            log(f"$ {command}")
            log("-" * 90)

            # The completion command must not actually be executed.
            if self.COMPLETION_MARKER in command:
                log(
                    "[mini-SWE-agent] Completion marker detected."
                )
                log(
                    "[mini-SWE-agent] Stopping agent execution."
                )

                return self.add_messages(
                    {
                        "role": "exit",
                        "content": (
                            "The agent marked the task as completed."
                        ),
                        "extra": {
                            "exit_status": "Submitted",
                            "submission": "",
                        },
                    }
                )

            try:
                output = self.env.execute(action)
                outputs.append(output)

                log("[mini-SWE-agent] COMMAND OUTPUT:")

                if output:
                    log(str(output))
                else:
                    log("[no output]")

            except Exception as exc:
                log(
                    "[mini-SWE-agent] COMMAND FAILED:"
                )
                log(str(exc))
                raise

        observation_messages = (
            self.model.format_observation_messages(
                message,
                outputs,
                self.get_template_vars(),
            )
        )

        log(
            "[mini-SWE-agent] Command results returned "
            "to the model."
        )

        return self.add_messages(*observation_messages)


# ---------------------------------------------------------------------
# Azure AI Foundry model
# ---------------------------------------------------------------------

def create_model() -> LitellmModel:
    """Create the LiteLLM model connected to Azure AI Foundry."""

    log("[SWEPilot] Creating Azure AI Foundry model...")

    api_key = os.getenv("AZURE_FOUNDRY_API_KEY")

    if not api_key:
        log(
            "[SWEPilot] No API key found. "
            "Using DefaultAzureCredential."
        )

        token_provider = get_bearer_token_provider(
            DefaultAzureCredential(),
            "https://ai.azure.com/.default",
        )

        api_key = token_provider()

    api_base = FOUNDRY_ENDPOINT

    if not FOUNDRY_ENDPOINT.endswith("/openai/v1"):
        separator = (
            "&"
            if "?" in FOUNDRY_ENDPOINT
            else "?"
        )

        api_base = (
            f"{FOUNDRY_ENDPOINT}"
            f"{separator}api-version="
            f"{quote(FOUNDRY_API_VERSION)}"
        )

    return LitellmModel(
        model_name=f"openai/{FOUNDRY_DEPLOYMENT}",
        model_kwargs={
            "api_base": api_base,
            "api_key": api_key,
        },
    )


# ---------------------------------------------------------------------

def git_auth_environment() -> dict[str, str]:
    """Return a process environment with GitHub HTTPS authentication."""

    basic_credentials = base64.b64encode(
        f"x-access-token:{GITHUB_TOKEN}".encode()
    ).decode()
    git_environment = os.environ.copy()
    git_environment.update(
        {
            "GIT_CONFIG_COUNT": "1",
            "GIT_CONFIG_KEY_0": "http.extraHeader",
            "GIT_CONFIG_VALUE_0": (
                f"AUTHORIZATION: basic {basic_credentials}"
            ),
        }
    )
    return git_environment


def remove_python_cache_files(repo_path: Path) -> None:
    """Keep interpreter-generated cache files out of the pull request."""

    for cache_directory in repo_path.rglob("__pycache__"):
        if cache_directory.is_dir():
            shutil.rmtree(cache_directory)

    for bytecode_file in repo_path.rglob("*.pyc"):
        if bytecode_file.is_file():
            bytecode_file.unlink()


# ---------------------------------------------------------------------

def clone_repo_to_sandbox(
    repo_url: str,
    branch_base: str = "main",
) -> Path:
    """
    Clone the repository into a fresh temporary directory.

    The current implementation uses LocalEnvironment, so the agent
    executes directly inside this temporary checkout.
    """

    workdir = Path(
        tempfile.mkdtemp(prefix="agent-run-")
    )

    log("")
    log("=" * 90)
    log("[SWEPilot] CLONING REPOSITORY")
    log(f"[SWEPilot] Destination: {workdir}")
    log(f"[SWEPilot] Base branch: {branch_base}")
    log("=" * 90)

    subprocess.run(
        [
            "git",
            "clone",
            "--branch",
            branch_base,
            "--depth",
            "1",
            repo_url,
            str(workdir),
        ],
        check=True,
        env=git_auth_environment(),
    )

    log("[SWEPilot] Repository cloned successfully.")

    return workdir


# ---------------------------------------------------------------------
# Agent execution and independent test gate
# ---------------------------------------------------------------------

def run_agent_on_issue(
    repo_path: Path,
    issue_number: int,
    issue_title: str,
    issue_body: str,
) -> bool:
    test_filename = issue_test_filename(issue_number)
    test_path = repo_path / test_filename

    task = f"""
You are fixing GitHub issue #{issue_number}.

Issue title:
{issue_title}

Issue description:
{issue_body}

Your task is to implement the requested change in the repository.

IMPORTANT REQUIREMENTS:

1. Inspect the existing repository files before making changes.
2. Do not assume the issue is already solved.
3. You MUST create or update this exact test file:

   {test_filename}

4. The test must specifically verify the behavior requested by this issue.
5. Do not reuse unrelated tests from previous issues.
6. First write a focused test for this issue, then implement the necessary code change.
7. Run the issue-specific test locally.
8. Fix any failures until the test passes.
9. Check `git diff` and verify that the intended implementation change exists.
10. Do not commit, push, or create a pull request.

The test should be specific enough to fail if the requested change is not implemented.
Avoid writing a test that merely checks that a file exists or that always passes.
    11. Do not create or use a file named .temp.
    12. Write valid, executable Python in the generated test file.
    13. Do not write escaped source such as \\" where normal Python quotes are required.
    14. Before running pytest, run:
        python -m py_compile {test_filename}
    15. If a file operation fails because a file is locked, inspect the
        directory and use a different safe editing method.
    16. Do not stop after running an old or unrelated test.


When everything is complete, run:

echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT
"""

    print(f"[SWEPilot] Starting agent for issue #{issue_number}")
    print(f"[SWEPilot] Required test file: {test_filename}")

    env = LocalEnvironment(cwd=str(repo_path))

    agent = OrchestratorAgent(
        model=create_model(),
        env=env,
        system_template=SYSTEM_TEMPLATE,
        instance_template=INSTANCE_TEMPLATE,
        step_limit=60,
    )

    result = agent.run(task)

    print("[SWEPilot] MINI-SWE-AGENT FINISHED")
    print(f"[SWEPilot] Agent exit status: {result.get('exit_status')}")

    # Display the final repository state.
    print("[SWEPilot] Final git status:")
    subprocess.run(
        ["git", "status", "--short"],
        cwd=repo_path,
        check=False,
    )

    print("[SWEPilot] Final git diff:")
    subprocess.run(
        ["git", "diff", "--stat"],
        cwd=repo_path,
        check=False,
    )

    # Verify that the agent created or modified the issue-specific test.
    test_status = subprocess.run(
        ["git", "status", "--short", "--", test_filename],
        cwd=repo_path,
        capture_output=True,
        text=True,
        check=False,
    )

    test_changed = bool(test_status.stdout.strip())

    if not test_changed:
        print(
            f"[SWEPilot] ERROR: Agent did not create or modify "
            f"{test_filename}"
        )
        return False

    if not test_path.exists():
        print(f"[SWEPilot] ERROR: Missing test file: {test_filename}")
        return False

    print(f"[SWEPilot] Issue-specific test found: {test_filename}")
    # Remove an unwanted temporary file if the agent created one.
    unwanted_temp_file = repo_path / ".temp"
    if unwanted_temp_file.exists():
        try:
            unwanted_temp_file.unlink()
            log("[SWEPilot] Removed unwanted .temp file.")
        except OSError as exc:
            log(f"[SWEPilot] Could not remove .temp: {exc}")
            return False

    # Validate that the generated test is valid Python before pytest collection.
    print(f"[SWEPilot] Validating syntax: {test_filename}")

    syntax_result = subprocess.run(
        [
            sys.executable,
            "-m",
            "py_compile",
            test_filename,
        ],
        cwd=repo_path,
        text=True,
        check=False,
    )

    if syntax_result.returncode != 0:
        log("[SWEPilot] GENERATED TEST HAS INVALID PYTHON SYNTAX.")
        return False


    # Run only the test generated for this issue.
    print(f"[SWEPilot] Running: {test_filename}")

    test_result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            test_filename,
            "-q",
        ],
        cwd=repo_path,
        text=True,
        check=False,
    )

    if test_result.returncode != 0:
        print("[SWEPilot] ISSUE-SPECIFIC TEST FAILED")
        return False

    print("[SWEPilot] ISSUE-SPECIFIC TEST PASSED")

    # Ensure the agent changed implementation files, not only the generated test.
    status_result = subprocess.run(
        ["git", "status", "--short"],
        cwd=repo_path,
        capture_output=True,
        text=True,
        check=True,
    )

    changed_lines = [
        line for line in status_result.stdout.splitlines()
        if line.strip()
    ]

    if not changed_lines:
        log("[SWEPilot] Agent produced no repository changes.")
        return False

    implementation_changes = [
        line for line in changed_lines
        if test_filename not in line
    ]

    if not implementation_changes:
        log(
            "[SWEPilot] Agent only created or modified the generated test. "
            "No implementation changes were detected."
        )
        return False

    log("[SWEPilot] Changed files:")
    for line in changed_lines:
        log(f"[SWEPilot] {line}")

    log("[SWEPilot] Implementation changes detected.")
    return True


# ---------------------------------------------------------------------
# Branch and pull request creation
# ---------------------------------------------------------------------

def push_branch_and_open_pr(
    repo_path: Path,
    issue_number: int,
    issue_title: str,
) -> str:
    """
    Create the SWEPilot branch, commit changes, push it, and open a PR.
    """

    branch_name = (
        f"SWEPilot/issue-{issue_number}"
    )

    log("")
    log("=" * 90)
    log("[SWEPilot] PREPARING PULL REQUEST")
    log(f"[SWEPilot] Branch: {branch_name}")
    log("=" * 90)

    log("[SWEPilot] Creating branch...")

    subprocess.run(
        [
            "git",
            "-C",
            str(repo_path),
            "checkout",
            "-b",
            branch_name,
        ],
        check=True,
    )

    log("[SWEPilot] Staging changes...")

    remove_python_cache_files(repo_path)

    subprocess.run(
        [
            "git",
            "-C",
            str(repo_path),
            "add",
            "-A",
        ],
        check=True,
    )

    staged_status = subprocess.run(
        [
            "git",
            "-C",
            str(repo_path),
            "diff",
            "--cached",
            "--quiet",
        ],
        capture_output=True,
    )

    if staged_status.returncode == 0:
        raise RuntimeError(
            "The agent passed the tests but produced no changes."
        )

    log("[SWEPilot] Staged diff:")

    staged_diff = subprocess.run(
        [
            "git",
            "-C",
            str(repo_path),
            "diff",
            "--cached",
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    log(staged_diff.stdout)

    commit_message = (
        f"Fix: {issue_title} "
        f"(closes #{issue_number})"
    )

    log(
        "[SWEPilot] Committing changes:"
    )
    log(commit_message)

    subprocess.run(
        [
            "git",
            "-C",
            str(repo_path),
            "commit",
            "-m",
            commit_message,
        ],
        check=True,
        env=git_auth_environment(),
    )

    log("[SWEPilot] Pushing branch to GitHub...")

    subprocess.run(
        [
            "git",
            "-C",
            str(repo_path),
            "push",
            "origin",
            branch_name,
        ],
        check=True,
        env=git_auth_environment(),
    )

    log("[SWEPilot] Branch pushed successfully.")

    repo = gh.get_repo(REPO_NAME)

    log("[SWEPilot] Creating pull request...")

    pr = repo.create_pull(
        title=f"[SWEPilot] {issue_title}",
        body=(
            f"Auto-generated fix for #{issue_number}.\n\n"
            "The mini-SWE-agent implemented the change.\n\n"
            "The independent pytest gate passed.\n\n"
            "**This PR was not merged automatically. "
            "Please review before merging.**"
        ),
        head=branch_name,
        base="main",
    )

    log("[SWEPilot] Pull request created:")
    log(pr.html_url)

    return pr.html_url


# ---------------------------------------------------------------------
# GitHub webhook
# ---------------------------------------------------------------------

@app.post("/webhook")
async def github_webhook(request: Request):
    """
    Handle newly opened GitHub issues.

    Note: this currently performs the full agent run synchronously
    inside the webhook request.
    """

    payload = await request.json()

    action = payload.get("action")

    if (
        action != "opened"
        or "issue" not in payload
        or "repository" not in payload
    ):
        log(
            f"[SWEPilot] Ignoring webhook event: "
            f"{action}"
        )

        return {
            "status": "ignored",
        }

    issue = payload["issue"]
    repository = payload["repository"]

    issue_number = issue["number"]
    issue_title = issue["title"]
    issue_body = issue.get("body") or ""
    clone_url = repository["clone_url"]

    log("")
    log("#" * 90)
    log("[SWEPilot] NEW GITHUB ISSUE RECEIVED")
    log(f"[SWEPilot] Issue number: #{issue_number}")
    log(f"[SWEPilot] Issue title: {issue_title}")
    log("#" * 90)

    repo_path = None

    try:
        repo_path = clone_repo_to_sandbox(
            clone_url,
            branch_base="main",
        )

        passed = run_agent_on_issue(
            issue_title=issue_title,
            issue_body=issue_body,
            repo_path=repo_path,
            issue_number=issue_number,
        )

        if not passed:
            log(
                "[SWEPilot] Tests failed. "
                "No pull request will be created."
            )

            gh.get_repo(REPO_NAME).get_issue(
                issue_number
            ).create_comment(
                "SWEPilot attempted this issue, but the "
                "independent test suite failed. No PR was opened."
            )

            return {
                "status": "failed_tests",
            }

        pr_url = push_branch_and_open_pr(
            repo_path=repo_path,
            issue_number=issue_number,
            issue_title=issue_title,
        )

        log("[SWEPilot] ORCHESTRATION COMPLETED SUCCESSFULLY")

        return {
            "status": "pr_opened",
            "pr_url": pr_url,
        }

    except Exception as exc:
        log("")
        log("[SWEPilot] AGENT ORCHESTRATION FAILED")
        log(str(exc))

        try:
            gh.get_repo(REPO_NAME).get_issue(
                issue_number
            ).create_comment(
                "SWEPilot failed before a PR could be opened. "
                "Check the orchestrator terminal logs."
            )
        except Exception as comment_error:
            log(
                "[SWEPilot] Could not post failure comment: "
                f"{comment_error}"
            )

        return {
            "status": "agent_error",
            "detail": str(exc),
        }