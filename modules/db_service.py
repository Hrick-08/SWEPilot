"""Database service operations for agent runs, logs, and users."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .db_models import AgentLog, AgentRun, User


class DatabaseService:
    """Thin service layer that persists run metadata and log entries."""

    def __init__(self, session_factory):
        self.session_factory = session_factory

    @staticmethod
    def utc_now() -> datetime:
        return datetime.now(timezone.utc)

    # ------------------------------------------------------------------
    # User operations
    # ------------------------------------------------------------------

    def create_user(self, username: str, password_hash: str, encrypted_github_token: str) -> User:
        now = self.utc_now()
        with self.session_factory() as session:
            user = User(
                username=username,
                password_hash=password_hash,
                github_token=encrypted_github_token,
                created_at=now,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            return user

    def get_user_by_username(self, username: str) -> User | None:
        with self.session_factory() as session:
            return session.execute(
                select(User).where(User.username == username)
            ).scalar_one_or_none()

    def update_user_username(self, username: str, new_username: str) -> User | None:
        with self.session_factory() as session:
            user = session.execute(
                select(User).where(User.username == username)
            ).scalar_one_or_none()
            if user is None:
                return None
            user.username = new_username
            session.commit()
            session.refresh(user)
            return user

    def update_user_token(self, username: str, encrypted_github_token: str) -> User | None:
        with self.session_factory() as session:
            user = session.execute(
                select(User).where(User.username == username)
            ).scalar_one_or_none()
            if user is None:
                return None
            user.github_token = encrypted_github_token
            session.commit()
            session.refresh(user)
            return user

    # ------------------------------------------------------------------
    # Run operations
    # ------------------------------------------------------------------

    def create_run(
        self,
        run_id: str,
        issue_number: int,
        status: str = "running",
        triggered_by: str | None = None,
        issue_title: str | None = None,
        repository: str | None = None,
    ) -> AgentRun:
        now = self.utc_now()
        with self.session_factory() as session:
            run = session.execute(select(AgentRun).where(AgentRun.run_id == run_id)).scalar_one_or_none()
            if run is None:
                run = AgentRun(
                    run_id=run_id,
                    issue_number=issue_number,
                    issue_title=issue_title,
                    repository=repository,
                    status=status,
                    started_at=now,
                    finished_at=None,
                    triggered_by=triggered_by,
                )
                session.add(run)
            else:
                run.issue_number = issue_number
                if issue_title is not None:
                    run.issue_title = issue_title
                if repository is not None:
                    run.repository = repository
                run.status = status
                run.started_at = run.started_at or now
                if triggered_by is not None:
                    run.triggered_by = triggered_by
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

    def update_run_issue_title(self, run_id: str, issue_title: str) -> AgentRun | None:
        with self.session_factory() as session:
            run = session.execute(select(AgentRun).where(AgentRun.run_id == run_id)).scalar_one_or_none()
            if run is None:
                return None
            run.issue_title = issue_title
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

    def get_runs_for_user(self, username: str) -> list[AgentRun]:
        """Return runs triggered by a specific GitHub username."""
        with self.session_factory() as session:
            return (
                session.execute(
                    select(AgentRun)
                    .where(AgentRun.triggered_by == username)
                    .order_by(AgentRun.started_at.desc())
                )
                .scalars()
                .all()
            )

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
