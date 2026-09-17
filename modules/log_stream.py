import asyncio
import logging
import sys
from collections import defaultdict, deque
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket

current_run_id: ContextVar[str | None] = ContextVar("current_run_id", default=None)


class LogStreamManager:
    """Manage run state, persistence, and WebSocket streaming."""

    def __init__(self, database_service=None):
        self.database = database_service
        self.frontend_connections: set[WebSocket] = set()
        self.run_connections: dict[str, set[WebSocket]] = defaultdict(set)
        self.history: dict[str, deque[dict[str, Any]]] = defaultdict(lambda: deque(maxlen=200))
        self.runs_by_id: dict[str, dict[str, Any]] = {}
        self.runs_by_issue: dict[int, dict[str, Any]] = {}
        self.loop: asyncio.AbstractEventLoop | None = None
        self._terminal_logger = logging.getLogger("SWEPilot.runtime")
        self._terminal_logger.setLevel(logging.ERROR)
        self._terminal_logger.propagate = False
        if not self._terminal_logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)-8s | %(message)s"))
            self._terminal_logger.addHandler(handler)

    def configure_database(self, database_service) -> None:
        self.database = database_service

    def register_run(
        self,
        run_id: str,
        issue_number: int,
        issue_title: str | None = None,
        repository: str | None = None,
    ) -> None:
        metadata = {
            "run_id": run_id,
            "issue_number": issue_number,
            "issue_title": issue_title or f"Issue #{issue_number}",
            "repository": repository,
            "status": "running",
        }
        self.runs_by_id[run_id] = metadata
        self.runs_by_issue[issue_number] = metadata

        if self.database is not None:
            try:
                self.database.create_run(run_id, issue_number, "running")
            except Exception as exc:
                self._terminal_logger.exception("Database run registration failed for %s: %s", run_id, exc)

        self._schedule_broadcast(
            {
                "type": "run_started",
                "run_id": run_id,
                "issue_number": issue_number,
                "status": "running",
            }
        )

    def finish_run(self, run_id: str, status: str) -> None:
        metadata = self.runs_by_id.get(run_id)
        if metadata is not None:
            metadata["status"] = status
            self.runs_by_issue[metadata["issue_number"]] = metadata

        if self.database is not None:
            try:
                self.database.finish_run(run_id, status)
            except Exception as exc:
                self._terminal_logger.exception("Database finish_run failed for %s: %s", run_id, exc)

        if metadata is not None:
            event = {
                "type": "run_finished",
                "run_id": run_id,
                "issue_number": metadata["issue_number"],
                "status": status,
            }
            self._schedule_broadcast(event, run_id)

    def get_latest_run_for_issue(self, issue_number: int):
        return self.runs_by_issue.get(issue_number)

    def get_logs_for_run(self, run_id: str):
        if self.database is not None:
            return self.database.get_logs_for_run(run_id)
        return list(self.history.get(run_id, ()))

    async def connect_dashboard(self, websocket: WebSocket):
        await websocket.accept()
        self.loop = asyncio.get_running_loop()
        self.frontend_connections.add(websocket)
        for run in self.runs_by_id.values():
            if run.get("status") != "running":
                continue
            event = {
                "type": "run_started",
                "run_id": run["run_id"],
                "issue_number": run["issue_number"],
                "status": run["status"],
            }
            await websocket.send_json(event)

    async def disconnect_dashboard(self, websocket: WebSocket):
        self.frontend_connections.discard(websocket)

    async def connect_run(self, websocket: WebSocket, run_id: str):
        await websocket.accept()
        self.loop = asyncio.get_running_loop()
        self.run_connections[run_id].add(websocket)
        for event in self.history.get(run_id, []):
            await websocket.send_json(event)

    async def disconnect_run(self, websocket: WebSocket, run_id: str):
        self.run_connections.get(run_id, set()).discard(websocket)

    def _schedule_broadcast(self, event: dict[str, Any], run_id: str | None = None) -> None:
        if self.loop is None or self.loop.is_closed():
            return
        try:
            asyncio.run_coroutine_threadsafe(self._broadcast_event(event, run_id), self.loop)
        except RuntimeError:
            return

    def publish(self, record: logging.LogRecord) -> None:
        run_id = current_run_id.get()
        if not run_id:
            return

        metadata = self.runs_by_id.get(run_id)
        if metadata is None:
            return

        event = {
            "type": "log",
            "run_id": run_id,
            "issue_number": metadata["issue_number"],
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
        }

        self.history[run_id].append(event)

        if self.database is not None:
            try:
                self.database.save_log(
                    run_id,
                    metadata["issue_number"],
                    event["timestamp"],
                    event["level"],
                    event["message"],
                )
            except Exception as exc:
                self._terminal_logger.exception("Database log save failed for %s: %s", run_id, exc)

        self._schedule_broadcast(event, run_id)

    async def _broadcast_event(self, event: dict[str, Any], run_id: str | None = None) -> None:
        recipients: set[WebSocket] = set(self.frontend_connections)
        if run_id is not None:
            recipients.update(self.run_connections.get(run_id, set()))

        dead_connections: list[WebSocket] = []
        for websocket in list(recipients):
            try:
                await websocket.send_json(event)
            except Exception:
                dead_connections.append(websocket)

        for websocket in dead_connections:
            self.frontend_connections.discard(websocket)
            for run_key, websockets in list(self.run_connections.items()):
                websockets.discard(websocket)
                if not websockets:
                    self.run_connections.pop(run_key, None)


class WebSocketLogHandler(logging.Handler):
    """Bridge Python logging records into the global run/log stream."""

    def emit(self, record: logging.LogRecord):
        try:
            log_stream_manager.publish(record)
        except Exception:
            self.handleError(record)


log_stream_manager = LogStreamManager()