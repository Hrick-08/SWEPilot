"""Initialize database tables for the SWEPilot application."""

from modules.config import Settings
from modules.database import Base, create_database_engine
from modules.db_models import AgentLog, AgentRun


def main() -> None:
    settings = Settings.from_env()
    engine = create_database_engine(settings.database_url)
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully.")


if __name__ == "__main__":
    main()
