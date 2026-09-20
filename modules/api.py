"""FastAPI routes for GitHub webhook events and log streaming."""

from __future__ import annotations

import json
import logging
import uuid

from fastapi import (
    APIRouter,
    BackgroundTasks,
    HTTPException,
    Request,
    WebSocket,
    WebSocketDisconnect,
)

from .config import Settings
from .git_service import GitService
from .logging_config import log
from .log_stream import current_run_id, log_stream_manager
from .models import WebhookPayload
from .workflow import IssueWorkflowService


def run_workflow_in_background(
    workflow: IssueWorkflowService,
    settings: Settings,
    issue_number: int,
    issue_title: str,
    issue_body: str,
    clone_url: str,
    run_id: str,
    repository_name: str | None = None,
) -> None:
    token = current_run_id.set(run_id)
    status = "completed"

    try:
        result = workflow.process_issue(
            issue_number=issue_number,
            issue_title=issue_title,
            issue_body=issue_body,
            clone_url=clone_url,
            repository_name=repository_name,
        )
        status = "failed" if str(result.get("status", "")).lower() in {"failed_tests", "failed"} else "completed"
        log(f"[SWEPilot] Run {run_id} finished: {result}")
    except Exception as exc:
        status = "failed"
        log("[SWEPilot] AGENT ORCHESTRATION FAILED", logging.ERROR)
        log(str(exc), logging.ERROR)

        try:
            workflow.git_service.github.get_repo(repository_name or settings.repo_name).get_issue(issue_number).create_comment(
                "SWEPilot failed before a PR could be opened. Check the orchestrator terminal logs."
            )
        except Exception as comment_error:
            log(f"[SWEPilot] Could not post failure comment: {comment_error}", logging.ERROR)
    finally:
        try:
            log_stream_manager.finish_run(run_id, status)
        finally:
            current_run_id.reset(token)


def create_router(
    settings: Settings,
    workflow: IssueWorkflowService,
) -> APIRouter:
    router = APIRouter()

    @router.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @router.get("/runs")
    async def get_runs():
        if log_stream_manager.database is not None:
            runs = log_stream_manager.database.get_runs()
            return [
                {
                    "run_id": run.run_id,
                    "issue_number": run.issue_number,
                    "issue_title": log_stream_manager.runs_by_id.get(run.run_id, {}).get(
                        "issue_title", f"Issue #{run.issue_number}"
                    ),
                    "repository": log_stream_manager.runs_by_id.get(run.run_id, {}).get("repository"),
                    "status": run.status,
                    "started_at": run.started_at.isoformat(),
                    "finished_at": run.finished_at.isoformat() if run.finished_at else None,
                }
                for run in runs
            ]

        return list(log_stream_manager.runs_by_id.values())

    @router.get("/issues")
    async def get_issues():
        runs = await get_runs()
        return [
            {
                "id": run["issue_number"],
                "title": run["issue_title"],
                "status": "open",
                "labels": [],
                "created_at": run["started_at"],
                "updated_at": run["finished_at"] or run["started_at"],
                "description": "",
                "repository": run.get("repository") or settings.repo_name,
                "agent_status": run["status"],
            }
            for run in runs
        ]

    @router.get("/runs/{issue_number}")
    async def get_run(issue_number: int):
        run = log_stream_manager.get_latest_run_for_issue(issue_number)
        if run is not None:
            return {
                "run_id": run["run_id"],
                "issue_number": run["issue_number"],
                "status": run["status"],
            }

        database = log_stream_manager.database
        stored_run = database.get_latest_run_for_issue(issue_number) if database is not None else None
        if stored_run is None:
            raise HTTPException(status_code=404, detail="No run found for this issue")

        return {
            "run_id": stored_run.run_id,
            "issue_number": stored_run.issue_number,
            "status": stored_run.status,
        }

    @router.get("/runs/{run_id}/logs")
    async def get_run_logs(run_id: str):
        return log_stream_manager.get_logs_for_run(run_id)

    @router.post("/webhook")
    async def github_webhook(
        request: Request,
        background_tasks: BackgroundTasks,
    ) -> dict[str, str]:
        try:
            raw_payload = await request.json()
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise HTTPException(status_code=400, detail="Request body must contain valid JSON") from exc

        payload = WebhookPayload.from_payload(raw_payload)
        if payload.action != "opened" or payload.issue is None or payload.repository is None:
            log(f"[SWEPilot] Ignoring webhook event: {payload.action}")
            return {"status": "ignored"}

        issue = payload.issue
        repository = payload.repository
        if not issue.has_flag(settings.issue_flag):
            log(
                f"[SWEPilot] Ignoring issue #{issue.number} - title does not contain "
                f"the '{settings.issue_flag}' flag: {issue.title!r}"
            )
            return {"status": "ignored", "reason": "missing_flag"}
        repository_name = repository.full_name or GitService.repository_name_from_clone_url(repository.clone_url)

        run_id = uuid.uuid4().hex

        log_stream_manager.register_run(
            run_id,
            issue.number,
            issue.title,
            repository.clone_url,
        )

        token = current_run_id.set(run_id)
        try:
            log("")
            log("#" * 90)
            log("[SWEPilot] NEW GITHUB ISSUE RECEIVED")
            log(f"[SWEPilot] Issue number: #{issue.number}")
            log(f"[SWEPilot] Issue title: {issue.title}")
            log(f"[SWEPilot] Run ID: {run_id}")
            log("#" * 90)
        finally:
            current_run_id.reset(token)

        background_tasks.add_task(
            run_workflow_in_background,
            workflow,
            settings,
            issue.number,
            issue.title,
            issue.body or "",
            repository.clone_url,
            run_id,
            repository_name,
        )

        return {"status": "started", "run_id": run_id}

    @router.websocket("/ws/logs")
    async def dashboard_websocket(websocket: WebSocket):
        await log_stream_manager.connect_dashboard(websocket)

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await log_stream_manager.disconnect_dashboard(websocket)

    @router.websocket("/ws/logs/{run_id}")
    async def websocket_logs(websocket: WebSocket, run_id: str):
        await log_stream_manager.connect_run(websocket, run_id)

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await log_stream_manager.disconnect_run(websocket, run_id)

    return router
