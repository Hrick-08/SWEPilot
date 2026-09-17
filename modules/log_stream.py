import asyncio
import logging
from collections import defaultdict, deque
from contextvars import ContextVar
from datetime import datetime, timezone

from fastapi import WebSocket


# Stores which agent run the current log belongs to
current_run_id: ContextVar[str | None] = ContextVar(
    "current_run_id",
    default=None,
)


class LogStreamManager:

    def __init__(self):
        # run_id -> connected frontend WebSockets
        self.connections: dict[str, set[WebSocket]] = defaultdict(set)

        # Keep the last 200 logs for every run
        self.history: dict[str, deque] = defaultdict(
            lambda: deque(maxlen=200)
        )

        # FastAPI's event loop
        self.loop: asyncio.AbstractEventLoop | None = None

        # issue_number -> run information
        #
        # Example:
        # {
        #     25: {
        #         "run_id": "abc123",
        #         "status": "running"
        #     }
        # }
        self.runs: dict[int, dict] = {}

    # --------------------------------------------------
    # RUN MANAGEMENT
    # --------------------------------------------------

    def register_run(self, run_id: str, issue_number: int):
        """
        Register a new agent run.

        This allows the frontend to ask:
        "What run belongs to issue #25?"
        """

        self.runs[issue_number] = {
            "run_id": run_id,
            "status": "running",
        }

    def get_run(self, issue_number: int):
        """
        Get the run information associated with an issue.
        """

        return self.runs.get(issue_number)

    # --------------------------------------------------
    # WEBSOCKET CONNECTION MANAGEMENT
    # --------------------------------------------------

    async def connect(
        self,
        websocket: WebSocket,
        run_id: str,
    ):

        await websocket.accept()

        # Save the event loop so logs generated elsewhere
        # can schedule WebSocket sends on this loop.
        self.loop = asyncio.get_running_loop()

        # Register this frontend connection
        self.connections[run_id].add(websocket)

        # Send previous logs if frontend connects
        # after the agent has already started.
        for event in self.history[run_id]:
            await websocket.send_json(event)

    async def disconnect(
        self,
        websocket: WebSocket,
        run_id: str,
    ):

        self.connections[run_id].discard(websocket)

    # --------------------------------------------------
    # SEND LOG TO CONNECTED FRONTENDS
    # --------------------------------------------------

    async def broadcast(
        self,
        run_id: str,
        event: dict,
    ):

        dead_connections = []

        # Send the log to every frontend connected
        # to this particular run.
        for websocket in list(self.connections[run_id]):

            try:
                await websocket.send_json(event)

            except Exception:
                dead_connections.append(websocket)

        # Remove broken WebSocket connections
        for websocket in dead_connections:
            self.connections[run_id].discard(websocket)

    # --------------------------------------------------
    # RECEIVE LOG FROM PYTHON LOGGER
    # --------------------------------------------------

    def publish(self, record: logging.LogRecord):

        # Find which agent run generated this log
        run_id = current_run_id.get()

        # This log is not part of an agent run
        if not run_id:
            return

        # Convert Python logging record into a JSON-friendly
        # event that the frontend can understand.
        event = {
            "run_id": run_id,
            "timestamp": datetime.fromtimestamp(
                record.created,
                tz=timezone.utc,
            ).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
        }

        # Save it so a newly connected frontend can
        # receive recent logs.
        self.history[run_id].append(event)

        # If a frontend is connected, send immediately.
        if self.loop is not None and not self.loop.is_closed():

            asyncio.run_coroutine_threadsafe(
                self.broadcast(
                    run_id,
                    event,
                ),
                self.loop,
            )


class WebSocketLogHandler(logging.Handler):

    def emit(self, record: logging.LogRecord):

        try:
            # Send every relevant log record
            # to the WebSocket log manager.
            log_stream_manager.publish(record)

        except Exception:
            self.handleError(record)


# One shared log manager for the application
log_stream_manager = LogStreamManager()