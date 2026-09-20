"""Application configuration and environment loading."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    github_token: str
    repo_name: str | None
    foundry_endpoint: str
    foundry_deployment: str
    database_url: str
    foundry_api_version: str = "2025-04-01-preview"
    base_branch: str = "main"
    agent_step_limit: int = 60
    issue_flag: str = "/SWEPilot"

    @classmethod
    def from_env(cls, env_file: Path | None = None) -> "Settings":
        load_dotenv(env_file or Path(__file__).resolve().parent.parent / ".env", override=True)
        required = {
            "github_token": "GITHUB_TOKEN",
            "foundry_endpoint": "AZURE_FOUNDRY_ENDPOINT",
            "foundry_deployment": "AZURE_FOUNDRY_DEPLOYMENT",
            "database_url": "DATABASE_URL",
        }
        missing = [name for name in required.values() if not os.getenv(name)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
        database_url = os.environ[required["database_url"]]
        if database_url.startswith("postgresql+psycopg2://"):
            database_url = database_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)

        return cls(
            github_token=os.environ[required["github_token"]],
            repo_name=os.getenv("REPO_NAME"),
            foundry_endpoint=os.environ[required["foundry_endpoint"]].rstrip("/"),
            foundry_deployment=os.environ[required["foundry_deployment"]],
            database_url=database_url,
            foundry_api_version=os.getenv("AZURE_FOUNDRY_API_VERSION", "2025-04-01-preview"),
            base_branch=os.getenv("SWEPILOT_BASE_BRANCH", "main"),
            agent_step_limit=int(os.getenv("SWEPILOT_AGENT_STEP_LIMIT", "60")),
            issue_flag=os.getenv("SWEPILOT_ISSUE_FLAG", "/SWEPilot"),
        )

    @property
    def foundry_api_base(self) -> str:
        if self.foundry_endpoint.endswith("/openai/v1"):
            return self.foundry_endpoint
        separator = "&" if "?" in self.foundry_endpoint else "?"
        return f"{self.foundry_endpoint}{separator}api-version={quote(self.foundry_api_version)}"
