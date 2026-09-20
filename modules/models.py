"""HTTP payload models for GitHub webhook events."""

from typing import Any

from pydantic import BaseModel, ConfigDict


class IssuePayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    number: int
    title: str
    body: str | None = None

    def has_flag(self, flag: str) -> bool:
        """Return True if the given flag (e.g. '/SWEPilot') appears in the issue title."""
        if not flag:
            return False
        return flag.strip().lower() in self.title.lower()


class RepositoryPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    clone_url: str
    full_name: str | None = None


class WebhookPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    action: str | None = None
    issue: IssuePayload | None = None
    repository: RepositoryPayload | None = None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "WebhookPayload":
        return cls.model_validate(payload)
