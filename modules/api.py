"""FastAPI routes for GitHub webhook events."""

import logging

from fastapi import APIRouter, Request

from .config import Settings
from .logging_config import log
from .models import WebhookPayload
from .workflow import IssueWorkflowService


def create_router(settings: Settings, workflow: IssueWorkflowService) -> APIRouter:
	router = APIRouter()

	@router.get("/health")
	async def health() -> dict[str, str]:
		return {"status": "ok"}

	@router.post("/webhook")
	async def github_webhook(request: Request) -> dict[str, str]:
		payload = WebhookPayload.from_payload(await request.json())
		if payload.action != "opened" or payload.issue is None or payload.repository is None:
			log(f"[SWEPilot] Ignoring webhook event: {payload.action}")
			return {"status": "ignored"}

		issue = payload.issue
		repository = payload.repository
		log("")
		log("#" * 90)
		log("[SWEPilot] NEW GITHUB ISSUE RECEIVED")
		log(f"[SWEPilot] Issue number: #{issue.number}")
		log(f"[SWEPilot] Issue title: {issue.title}")
		log("#" * 90)

		try:
			return workflow.process_issue(
				issue_number=issue.number,
				issue_title=issue.title,
				issue_body=issue.body or "",
				clone_url=repository.clone_url,
			)
		except Exception as exc:
			log("[SWEPilot] AGENT ORCHESTRATION FAILED", logging.ERROR)
			log(str(exc), logging.ERROR)
			try:
				workflow.git_service.github.get_repo(settings.repo_name).get_issue(
					issue.number
				).create_comment(
					"SWEPilot failed before a PR could be opened. Check the orchestrator terminal logs."
				)
			except Exception as comment_error:
				log(f"[SWEPilot] Could not post failure comment: {comment_error}", logging.ERROR)
			return {"status": "agent_error", "detail": str(exc)}

	return router
