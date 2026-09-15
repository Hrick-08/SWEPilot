"""SWEPilot backend entrypoint.

Run with:
    uvicorn run_agent:app --host 0.0.0.0 --port 8000 --reload

The implementation lives in the ``swepilot`` package. This module remains as
an entrypoint and compatibility facade for existing local integrations.
"""

from pathlib import Path

from modules.agent import (
    INSTANCE_TEMPLATE,
    SYSTEM_TEMPLATE,
    OrchestratorAgent,
    create_model,
)
from modules.app import create_app
from modules.config import Settings
from modules.git_service import GitService
from modules.workflow import IssueWorkflowService, issue_test_filename


app = create_app()


def _services() -> tuple[Settings, GitService, IssueWorkflowService]:
    settings = Settings.from_env()
    git_service = GitService(settings)
    return settings, git_service, IssueWorkflowService(settings, git_service)


def git_auth_environment() -> dict[str, str]:
    """Compatibility wrapper for the former module-level helper."""
    _, git_service, _ = _services()
    return git_service.auth_environment()


def remove_python_cache_files(repo_path: Path) -> None:
    GitService.remove_python_cache_files(repo_path)


def clone_repo_to_sandbox(repo_url: str, branch_base: str = "main") -> Path:
    _, git_service, _ = _services()
    return git_service.clone_to_sandbox(repo_url, branch_base)


def run_agent_on_issue(
    repo_path: Path,
    issue_number: int,
    issue_title: str,
    issue_body: str,
) -> bool:
    _, _, workflow = _services()
    return workflow.run_agent_on_issue(repo_path, issue_number, issue_title, issue_body)


def push_branch_and_open_pr(
    repo_path: Path,
    issue_number: int,
    issue_title: str,
) -> str:
    _, git_service, _ = _services()
    return git_service.push_branch_and_open_pr(repo_path, issue_number, issue_title)


__all__ = [
    "INSTANCE_TEMPLATE",
    "SYSTEM_TEMPLATE",
    "OrchestratorAgent",
    "app",
    "clone_repo_to_sandbox",
    "create_model",
    "git_auth_environment",
    "issue_test_filename",
    "push_branch_and_open_pr",
    "remove_python_cache_files",
    "run_agent_on_issue",
]
