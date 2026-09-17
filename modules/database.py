"""Database engine and SQLAlchemy session configuration."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""


def create_database_engine(database_url: str):
    """Create the SQLAlchemy engine for PostgreSQL."""
    return create_engine(database_url, pool_pre_ping=True, future=True)


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
