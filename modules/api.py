"""FastAPI routes for GitHub webhook events and log streaming."""

from __future__ import annotations

import json
import logging
import uuid

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Request,
    WebSocket,
    WebSocketDisconnect,
)
from pydantic import BaseModel

from .auth import (
    create_access_token,
    decode_access_token,
    decrypt_github_token,
    encrypt_github_token,
    hash_password,
    verify_password,
)
from cryptography.fernet import InvalidToken
from .config import Settings
from .db_service import DatabaseService
from .git_service import GitService
from .logging_config import log
from .log_stream import current_run_id, log_stream_manager
from .models import WebhookPayload
from .workflow import IssueWorkflowService


# ---------------------------------------------------------------------------
# Pydantic models for auth payloads
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    username: str
    password: str
    github_token: str


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str


class AccountUpdateRequest(BaseModel):
    username: str | None = None
    github_token: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_current_username(request: Request, settings: Settings) -> str | None:
    """Extract the authenticated username from the Authorization header.

    Returns ``None`` when the header is absent or invalid — callers decide
    whether to raise 401.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.removeprefix("Bearer ").strip()
    return decode_access_token(token, settings.secret_key)


def _require_current_username(request: Request, settings: Settings) -> str:
    username = _get_current_username(request, settings)
    if username is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return username


def run_workflow_in_background(
    workflow: IssueWorkflowService,
    settings: Settings,
    issue_number: int,
    issue_title: str,
    issue_body: str,
    clone_url: str,
    run_id: str,
    repository_name: str | None = None,
    github_token: str | None = None,
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
            github_token=github_token,
        )
        status = "failed" if str(result.get("status", "")).lower() in {"failed_tests", "failed"} else "completed"
        log(f"[SWEPilot] Run {run_id} finished: {result}")
    except Exception as exc:
        status = "failed"
        log("[SWEPilot] AGENT ORCHESTRATION FAILED", logging.ERROR)
        log(str(exc), logging.ERROR)

        try:
            gh = workflow.git_service._github_for(github_token)
            gh.get_repo(repository_name or settings.repo_name).get_issue(issue_number).create_comment(
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
    database: DatabaseService,
) -> APIRouter:
    router = APIRouter()

    # ------------------------------------------------------------------
    # Auth endpoints (no auth required)
    # ------------------------------------------------------------------

    @router.post("/auth/register")
    async def register(body: RegisterRequest):
        existing = database.get_user_by_username(body.username)
        if existing is not None:
            raise HTTPException(status_code=409, detail="Username already registered")
        pw_hash = hash_password(body.password)
        encrypted_token = encrypt_github_token(body.github_token, settings.secret_key)
        user = database.create_user(body.username, pw_hash, encrypted_token)
        return {"username": user.username, "created_at": user.created_at.isoformat()}

    @router.post("/auth/login", response_model=LoginResponse)
    async def login(body: LoginRequest):
        user = database.get_user_by_username(body.username)
        if user is None or not verify_password(body.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        jwt_token = create_access_token(body.username, settings.secret_key)
        return LoginResponse(token=jwt_token, username=body.username)

    @router.patch("/auth/account", response_model=LoginResponse)
    async def update_account(request: Request, body: AccountUpdateRequest):
        current_username = _get_current_username(request, settings)
        if current_username is None:
            raise HTTPException(status_code=401, detail="Authentication required")

        new_username = body.username.strip() if body.username is not None else current_username
        new_github_token = body.github_token.strip() if body.github_token is not None else None
        if not new_username:
            raise HTTPException(status_code=422, detail="Username cannot be empty")
        if new_github_token is not None and not new_github_token:
            raise HTTPException(status_code=422, detail="GitHub token cannot be empty")
        if body.username is None and body.github_token is None:
            raise HTTPException(status_code=422, detail="Provide a username or GitHub token")
        if new_username != current_username and database.get_user_by_username(new_username) is not None:
            raise HTTPException(status_code=409, detail="Username already registered")

        user = database.update_user_username(current_username, new_username)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        if new_github_token is not None:
            user = database.update_user_token(new_username, encrypt_github_token(new_github_token, settings.secret_key))

        return LoginResponse(
            token=create_access_token(new_username, settings.secret_key),
            username=user.username,
        )

    # ------------------------------------------------------------------
    # Public endpoints
    # ------------------------------------------------------------------

    @router.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    # ------------------------------------------------------------------
    # Protected endpoints
    # ------------------------------------------------------------------

    @router.get("/runs")
    async def get_runs(request: Request):
        username = _require_current_username(request, settings)

        if log_stream_manager.database is not None:
            runs = log_stream_manager.database.get_runs_for_user(username)
            return [
                {
                    "run_id": run.run_id,
                    "issue_number": run.issue_number,
                    "issue_title": log_stream_manager.runs_by_id.get(run.run_id, {}).get("issue_title")
                    or run.issue_title
                    or f"Issue #{run.issue_number}",
                    "repository": log_stream_manager.runs_by_id.get(run.run_id, {}).get("repository")
                    or run.repository
                    or f"{username}/SWEPilot",
                    "status": run.status,
                    "started_at": run.started_at.isoformat(),
                    "finished_at": run.finished_at.isoformat() if run.finished_at else None,
                }
                for run in runs
            ]

        # In-memory fallback — authentication is required, so only this user's runs are returned.
        all_runs = list(log_stream_manager.runs_by_id.values())
        return [r for r in all_runs if r.get("triggered_by") == username]

    @router.get("/issues")
    async def get_issues(request: Request):
        username = _require_current_username(request, settings)
        runs = await get_runs(request)
        return [
            {
                "id": run["issue_number"],
                "title": run["issue_title"],
                "status": "open",
                "labels": [],
                "created_at": run["started_at"],
                "updated_at": run["finished_at"] or run["started_at"],
                "description": "",
                "repository": run.get("repository") or f"{username}/SWEPilot",
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

    # ------------------------------------------------------------------
    # Webhook (no auth — called by GitHub)
    # ------------------------------------------------------------------

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

        # --- User validation: repo owner must be a registered user ---
        owner = GitService.owner_from_clone_url(repository.clone_url)
        user_github_token: str | None = None

        if owner:
            user = database.get_user_by_username(owner)
            if user is None:
                log(f"[SWEPilot] Rejecting webhook: user '{owner}' is not registered in SWEPilot.")
                return {
                    "status": "rejected",
                    "reason": "user_not_registered",
                    "detail": f"GitHub user '{owner}' is not registered. Please register first.",
                }
            # Decrypt the user's GitHub PAT and use it for this workflow
            try:
                user_github_token = decrypt_github_token(user.github_token, settings.secret_key)
            except InvalidToken:
                log(
                    f"[SWEPilot] Failed to decrypt token for user '{owner}': "
                    "SECRET_KEY does not match the key used when the token was saved.",
                    logging.ERROR,
                )
                return {
                    "status": "error",
                    "reason": "token_decryption_failed",
                    "detail": "The deployed SECRET_KEY does not match the key used to encrypt this GitHub token.",
                }
            except Exception as exc:
                log(f"[SWEPilot] Failed to decrypt token for user '{owner}': {exc!r}", logging.ERROR)
                return {"status": "error", "reason": "token_decryption_failed"}

        run_id = uuid.uuid4().hex

        log_stream_manager.register_run(
            run_id,
            issue.number,
            issue.title,
            repository_name or repository.clone_url,
            triggered_by=owner,
        )

        token = current_run_id.set(run_id)
        try:
            log("")
            log("#" * 90)
            log("[SWEPilot] NEW GITHUB ISSUE RECEIVED")
            log(f"[SWEPilot] Issue number: #{issue.number}")
            log(f"[SWEPilot] Issue title: {issue.title}")
            log(f"[SWEPilot] Triggered by: {owner or 'unknown'}")
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
            user_github_token,
        )

        return {"status": "started", "run_id": run_id}

    # ------------------------------------------------------------------
    # WebSocket endpoints
    # ------------------------------------------------------------------

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
