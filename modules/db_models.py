"""ORM models for agent runs, their logs, and users."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    """Registered SWEPilot user.  ``username`` must match the GitHub handle."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    github_token: Mapped[str] = mapped_column(String, nullable=False)  # encrypted
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    issue_number: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    triggered_by: Mapped[str | None] = mapped_column(String, nullable=True)  # GitHub username

    logs: Mapped[list["AgentLog"]] = relationship(back_populates="run", cascade="all, delete-orphan")


class AgentLog(Base):
    __tablename__ = "agent_logs"
    __table_args__ = (
        Index("ix_agent_logs_run_timestamp", "run_id", "timestamp"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("agent_runs.run_id"), index=True, nullable=False)
    issue_number: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    level: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    run: Mapped[AgentRun] = relationship(back_populates="logs")
