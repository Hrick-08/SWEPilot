"""Database engine and SQLAlchemy session configuration."""

from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""


def create_database_engine(database_url: str):
    """Create the SQLAlchemy engine for PostgreSQL."""
    return create_engine(database_url, pool_pre_ping=True, future=True)


def migrate_database(engine) -> None:
    """Apply small, idempotent schema updates to existing deployments."""
    users_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    agent_runs_columns = {column["name"] for column in inspect(engine).get_columns("agent_runs")}

    with engine.begin() as connection:
        if "created_at" not in users_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ"))
            connection.execute(text("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
            connection.execute(text("ALTER TABLE users ALTER COLUMN created_at SET NOT NULL"))
        if "triggered_by" not in agent_runs_columns:
            connection.execute(text("ALTER TABLE agent_runs ADD COLUMN triggered_by VARCHAR"))
        if "issue_title" not in agent_runs_columns:
            connection.execute(text("ALTER TABLE agent_runs ADD COLUMN issue_title VARCHAR"))
        connection.execute(
            text(
                """
                UPDATE agent_runs AS runs
                SET issue_title = substring(logs.message from '\\[SWEPilot\\] Issue title: (.*)$')
                FROM agent_logs AS logs
                WHERE runs.run_id = logs.run_id
                  AND (runs.issue_title IS NULL OR runs.issue_title = '')
                  AND logs.message LIKE '[SWEPilot] Issue title:%'
                """
            )
        )


def create_session_factory(database_url: str):
    """Create a session factory bound to the configured database."""
    engine = create_database_engine(database_url)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True)


def get_session(session_factory) -> Generator[Session, None, None]:
    """Yield a scoped database session for use in services."""
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
