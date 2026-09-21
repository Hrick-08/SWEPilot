"""FastAPI application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import sessionmaker

from .api import create_router
from .config import Settings
from .database import Base, create_database_engine, migrate_database
from .db_models import AgentLog, AgentRun, User  # noqa: F401
from .db_service import DatabaseService
from .git_service import GitService
from .log_stream import log_stream_manager
from .workflow import IssueWorkflowService


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()

    engine = create_database_engine(settings.database_url)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True)
    database_service = DatabaseService(session_factory)

    log_stream_manager.configure_database(database_service)
    Base.metadata.create_all(bind=engine)
    migrate_database(engine)

    git_service = GitService(settings)
    workflow = IssueWorkflowService(settings, git_service)
    application = FastAPI(title="SWEPilot", version="1.0.0")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://swepilot.hrick.in"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(create_router(settings, workflow, database_service))
    application.state.settings = settings
    application.state.workflow = workflow
    application.state.database = database_service
    application.state.log_stream_manager = log_stream_manager
    return application
