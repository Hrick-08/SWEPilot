"""FastAPI routes for GitHub webhook events."""

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
) -> None:

    token = current_run_id.set(run_id)

    try:
        result = workflow.process_issue(
            issue_number=issue_number,
            issue_title=issue_title,
            issue_body=issue_body,
            clone_url=clone_url,
        )

        log(f"[SWEPilot] Run {run_id} finished: {result}")

    except Exception as exc:
        log(
            "[SWEPilot] AGENT ORCHESTRATION FAILED",
            logging.ERROR,
        )

        log(
            str(exc),
            logging.ERROR,
        )

        try:
            workflow.git_service.github.get_repo(
                settings.repo_name
            ).get_issue(
                issue_number
            ).create_comment(
                "SWEPilot failed before a PR could be opened. "
                "Check the orchestrator terminal logs."
            )

        except Exception as comment_error:
            log(
                f"[SWEPilot] Could not post failure comment: "
                f"{comment_error}",
                logging.ERROR,
            )

    finally:
        current_run_id.reset(token)


def create_router(
    settings: Settings,
    workflow: IssueWorkflowService,
) -> APIRouter:

    router = APIRouter()

    # ---------------------------------------------------------
    # Health check
    # ---------------------------------------------------------

    @router.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    # ---------------------------------------------------------
    # TEMPORARY LOG TEST
    # ---------------------------------------------------------
    @router.get("/test-log")
    async def test_log():

        token = current_run_id.set("test123")

        try:
            log("[TEST] WebSocket log streaming is working")
        finally:
            current_run_id.reset(token)

        return {
            "status": "log_sent",
            "run_id": "test123"
        }

    # ---------------------------------------------------------
    # GET_RUn
    # ---------------------------------------------------------



    @router.get("/runs/{issue_number}")
    async def get_run(issue_number: int):

        run = log_stream_manager.get_run(issue_number)

        if run is None:
            raise HTTPException(
                status_code=404,
                detail="No run found for this issue"
            )

        return run

    # ---------------------------------------------------------
    # GitHub webhook
    # ---------------------------------------------------------

    @router.post("/webhook")
    async def github_webhook(
        request: Request,
        background_tasks: BackgroundTasks,
    ) -> dict[str, str]:

        try:
            raw_payload = await request.json()

        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise HTTPException(
                status_code=400,
                detail="Request body must contain valid JSON",
            ) from exc

        payload = WebhookPayload.from_payload(raw_payload)

        if (
            payload.action != "opened"
            or payload.issue is None
            or payload.repository is None
        ):
            log(
                f"[SWEPilot] Ignoring webhook event: "
                f"{payload.action}"
            )

            return {"status": "ignored"}

        issue = payload.issue
        repository = payload.repository

        # Create a unique ID for this agent execution
        run_id = uuid.uuid4().hex
        log_stream_manager.register_run(
            run_id,
            issue.number
        )

        # Attach this run_id to the logs generated here
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

        # Start the agent workflow in the background
        background_tasks.add_task(
            run_workflow_in_background,
            workflow,
            settings,
            issue.number,
            issue.title,
            issue.body or "",
            repository.clone_url,
            run_id,
        )

        # Return immediately
        return {
            "status": "started",
            "run_id": run_id,
        }

    # ---------------------------------------------------------
    # WebSocket log endpoint
    # ---------------------------------------------------------

    @router.websocket("/ws/logs/{run_id}")
    async def websocket_logs(
        websocket: WebSocket,
        run_id: str,
    ):

        await log_stream_manager.connect(
            websocket,
            run_id,
        )

        try:
            while True:
                await websocket.receive_text()

        except WebSocketDisconnect:

            await log_stream_manager.disconnect(
                websocket,
                run_id,
            )

    return router