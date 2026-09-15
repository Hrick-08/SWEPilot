"""Git and GitHub operations used by the issue workflow."""

import base64
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from github import Github

from .config import Settings
from .logging_config import log


class GitService:
    def __init__(self, settings: Settings, github: Github | None = None):
        self.settings = settings
        self.github = github or Github(settings.github_token)

    def auth_environment(self) -> dict[str, str]:
        credentials = base64.b64encode(
            f"x-access-token:{self.settings.github_token}".encode()
        ).decode()
        environment = os.environ.copy()
        environment.update({
            "GIT_CONFIG_COUNT": "1",
            "GIT_CONFIG_KEY_0": "http.extraHeader",
            "GIT_CONFIG_VALUE_0": f"AUTHORIZATION: basic {credentials}",
        })
        return environment

    def clone_to_sandbox(self, repo_url: str, branch_base: str | None = None) -> Path:
        branch = branch_base or self.settings.base_branch
        workdir = Path(tempfile.mkdtemp(prefix="agent-run-"))
        log("")
        log("=" * 90)
        log("[SWEPilot] CLONING REPOSITORY")
        log(f"[SWEPilot] Destination: {workdir}")
        log(f"[SWEPilot] Base branch: {branch}")
        log("=" * 90)
        subprocess.run(
            ["git", "clone", "--branch", branch, "--depth", "1", repo_url, str(workdir)],
            check=True,
            env=self.auth_environment(),
        )
        log("[SWEPilot] Repository cloned successfully.")
        return workdir

    @staticmethod
    def remove_python_cache_files(repo_path: Path) -> None:
        for cache_directory in repo_path.rglob("__pycache__"):
            if cache_directory.is_dir():
                shutil.rmtree(cache_directory)
        for bytecode_file in repo_path.rglob("*.pyc"):
            if bytecode_file.is_file():
                bytecode_file.unlink()

    def push_branch_and_open_pr(self, repo_path: Path, issue_number: int, issue_title: str) -> str:
        branch_name = f"SWEPilot/issue-{issue_number}"
        log("")
        log("=" * 90)
        log("[SWEPilot] PREPARING PULL REQUEST")
        log(f"[SWEPilot] Branch: {branch_name}")
        log("=" * 90)
        subprocess.run(["git", "-C", str(repo_path), "checkout", "-b", branch_name], check=True)
        self.remove_python_cache_files(repo_path)
        subprocess.run(["git", "-C", str(repo_path), "add", "-A"], check=True)
        staged_status = subprocess.run(
            ["git", "-C", str(repo_path), "diff", "--cached", "--quiet"],
            capture_output=True,
        )
        if staged_status.returncode == 0:
            raise RuntimeError("The agent passed the tests but produced no changes.")
        staged_diff = subprocess.run(
            ["git", "-C", str(repo_path), "diff", "--cached"],
            capture_output=True,
            text=True,
            check=True,
        )
        log("[SWEPilot] Staged diff:")
        log(staged_diff.stdout)
        commit_message = f"Fix: {issue_title} (closes #{issue_number})"
        subprocess.run(
            ["git", "-C", str(repo_path), "commit", "-m", commit_message],
            check=True,
            env=self.auth_environment(),
        )
        subprocess.run(
            ["git", "-C", str(repo_path), "push", "origin", branch_name],
            check=True,
            env=self.auth_environment(),
        )
        repo = self.github.get_repo(self.settings.repo_name)
        pr = repo.create_pull(
            title=f"[SWEPilot] {issue_title}",
            body=(
                f"Auto-generated fix for #{issue_number}.\n\n"
                "The mini-SWE-agent implemented the change.\n\n"
                "The independent pytest gate passed.\n\n"
                "**This PR was not merged automatically. Please review before merging.**"
            ),
            head=branch_name,
            base=self.settings.base_branch,
        )
        log("[SWEPilot] Pull request created:")
        log(pr.html_url)
        return pr.html_url
