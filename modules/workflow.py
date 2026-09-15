"""Issue-to-pull-request orchestration service."""

import subprocess
import sys
from pathlib import Path

from minisweagent.environments.local import LocalEnvironment

from .agent import INSTANCE_TEMPLATE, OrchestratorAgent, SYSTEM_TEMPLATE, create_model
from .config import Settings
from .git_service import GitService
from .logging_config import log


def issue_test_filename(issue_number: int) -> str:
	return f"test_issue_{issue_number}_generated.py"


class IssueWorkflowService:
	"""Coordinates the agent, independent test gate, and GitHub services."""

	def __init__(self, settings: Settings, git_service: GitService):
		self.settings = settings
		self.git_service = git_service

	def run_agent_on_issue(
		self,
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
2. You MUST create or update this exact test file: {test_filename}
3. The test must specifically verify the behavior requested by this issue.
4. First write a focused test, then implement the necessary code change.
5. Run the issue-specific test locally and fix failures until it passes.
6. Check git diff and verify that the intended implementation change exists.
7. Do not commit, push, or create a pull request.
8. Do not create or use a file named .temp.
9. Run `python -m py_compile {test_filename}` before pytest.

When everything is complete, run:
echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT
"""
		log(f"[SWEPilot] Starting agent for issue #{issue_number}")
		log(f"[SWEPilot] Required test file: {test_filename}")
		agent = OrchestratorAgent(
			model=create_model(self.settings),
			env=LocalEnvironment(cwd=str(repo_path)),
			system_template=SYSTEM_TEMPLATE,
			instance_template=INSTANCE_TEMPLATE,
			step_limit=self.settings.agent_step_limit,
		)
		result = agent.run(task)
		log(f"[SWEPilot] Agent exit status: {result.get('exit_status')}")

		subprocess.run(["git", "status", "--short"], cwd=repo_path, check=False)
		subprocess.run(["git", "diff", "--stat"], cwd=repo_path, check=False)

		test_status = subprocess.run(
			["git", "status", "--short", "--", test_filename],
			cwd=repo_path,
			capture_output=True,
			text=True,
			check=False,
		)
		if not test_status.stdout.strip() or not test_path.exists():
			log(f"[SWEPilot] ERROR: Agent did not create or modify {test_filename}")
			return False

		unwanted_temp_file = repo_path / ".temp"
		if unwanted_temp_file.exists():
			try:
				unwanted_temp_file.unlink()
				log("[SWEPilot] Removed unwanted .temp file.")
			except OSError as exc:
				log(f"[SWEPilot] Could not remove .temp: {exc}")
				return False

		syntax_result = subprocess.run(
			[sys.executable, "-m", "py_compile", test_filename],
			cwd=repo_path,
			check=False,
		)
		if syntax_result.returncode != 0:
			log("[SWEPilot] GENERATED TEST HAS INVALID PYTHON SYNTAX.")
			return False

		test_result = subprocess.run(
			[sys.executable, "-m", "pytest", test_filename, "-q"],
			cwd=repo_path,
			check=False,
		)
		if test_result.returncode != 0:
			log("[SWEPilot] ISSUE-SPECIFIC TEST FAILED")
			return False

		status_result = subprocess.run(
			["git", "status", "--short"],
			cwd=repo_path,
			capture_output=True,
			text=True,
			check=True,
		)
		changed_lines = [line for line in status_result.stdout.splitlines() if line.strip()]
		implementation_changes = [line for line in changed_lines if test_filename not in line]
		if not implementation_changes:
			log("[SWEPilot] Agent only changed the generated test.")
			return False
		for line in changed_lines:
			log(f"[SWEPilot] {line}")
		return True

	def process_issue(
		self,
		issue_number: int,
		issue_title: str,
		issue_body: str,
		clone_url: str,
	) -> dict[str, str]:
		repo_path = self.git_service.clone_to_sandbox(clone_url, self.settings.base_branch)
		passed = self.run_agent_on_issue(repo_path, issue_number, issue_title, issue_body)
		if not passed:
			self.git_service.github.get_repo(self.settings.repo_name).get_issue(issue_number).create_comment(
				"SWEPilot attempted this issue, but the independent test suite failed. No PR was opened."
			)
			return {"status": "failed_tests"}
		pr_url = self.git_service.push_branch_and_open_pr(repo_path, issue_number, issue_title)
		return {"status": "pr_opened", "pr_url": pr_url}
