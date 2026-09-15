"""FastAPI application factory."""

from fastapi import FastAPI

from .api import create_router
from .config import Settings
from .git_service import GitService
from .workflow import IssueWorkflowService


def create_app(settings: Settings | None = None) -> FastAPI:
	settings = settings or Settings.from_env()
	git_service = GitService(settings)
	workflow = IssueWorkflowService(settings, git_service)
	application = FastAPI(title="SWEPilot", version="1.0.0")
	application.include_router(create_router(settings, workflow))
	application.state.settings = settings
	application.state.workflow = workflow
	return application
