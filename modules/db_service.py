"""Database service operations for agent runs and logs."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .db_models import AgentLog, AgentRun


class DatabaseService:
    """Thin service layer that persists run metadata and log entries."""

    def __init__(self, session_factory):
        self.session_factory = session_factory

    @staticmethod
    def utc_now() -> datetime:
        return datetime.now(timezone.utc)

    def create_run(self, run_id: str, issue_number: int, status: str = "running") -> AgentRun:
        now = self.utc_now()
        with self.session_factory() as session:
            run = session.execute(select(AgentRun).where(AgentRun.run_id == run_id)).scalar_one_or_none()
            if run is None:
                run = AgentRun(
                    run_id=run_id,
                    issue_number=issue_number,
                    status=status,
                    started_at=now,
                    finished_at=None,
                )
                session.add(run)
            else:
                run.issue_number = issue_number
                run.status = status
                run.started_at = run.started_at or now
                if run.finished_at is not None and status == "running":
                    run.finished_at = None
            session.commit()
            session.refresh(run)
            return run

    def save_log(
        self,
        run_id: str,
        issue_number: int,
        timestamp: datetime | str,
        level: str,
        message: str,
    ) -> AgentLog:
        if isinstance(timestamp, str):
            timestamp_value = datetime.fromisoformat(timestamp)
            if timestamp_value.tzinfo is None:
                timestamp_value = timestamp_value.replace(tzinfo=timezone.utc)
        else:
            timestamp_value = timestamp

        with self.session_factory() as session:
            session.execute(
                select(AgentRun).where(AgentRun.run_id == run_id)
            ).scalar_one_or_none()
            log_entry = AgentLog(
                run_id=run_id,
                issue_number=issue_number,
                timestamp=timestamp_value,
                level=level,
                message=message,
            )
            session.add(log_entry)
            session.commit()
            session.refresh(log_entry)
            return log_entry

    def finish_run(self, run_id: str, status: str) -> AgentRun | None:
        now = self.utc_now()
        with self.session_factory() as session:
            run = session.execute(select(AgentRun).where(AgentRun.run_id == run_id)).scalar_one_or_none()
            if run is None:
                return None
            run.status = status
            run.finished_at = now
            session.commit()
            session.refresh(run)
            return run

    def get_run(self, run_id: str) -> AgentRun | None:
        with self.session_factory() as session:
            return session.execute(select(AgentRun).where(AgentRun.run_id == run_id)).scalar_one_or_none()

    def get_latest_run_for_issue(self, issue_number: int) -> AgentRun | None:
        with self.session_factory() as session:
            return (
                session.execute(
                    select(AgentRun)
                    .where(AgentRun.issue_number == issue_number)
                    .order_by(AgentRun.started_at.desc())
                    .limit(1)
                )
                .scalar_one_or_none()
            )

    def get_runs(self) -> list[AgentRun]:
        with self.session_factory() as session:
            return session.execute(select(AgentRun).order_by(AgentRun.started_at.desc())).scalars().all()

    def get_logs_for_run(self, run_id: str) -> list[dict[str, str | int | None]]:
        with self.session_factory() as session:
            rows = session.execute(
                select(AgentLog)
                .where(AgentLog.run_id == run_id)
                .order_by(AgentLog.timestamp.asc(), AgentLog.id.asc())
            ).scalars().all()

        return [
            {
                "type": "log",
                "run_id": row.run_id,
                "issue_number": row.issue_number,
                "timestamp": row.timestamp.isoformat(),
                "level": row.level,
                "message": row.message,
            }
            for row in rows
        ]
