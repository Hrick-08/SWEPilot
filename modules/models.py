"""HTTP payload models for GitHub webhook events."""

from typing import Any

from pydantic import BaseModel, ConfigDict


class IssuePayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    number: int
    title: str
    body: str | None = None


class RepositoryPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    clone_url: str


class WebhookPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    action: str | None = None
    issue: IssuePayload | None = None
    repository: RepositoryPayload | None = None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "WebhookPayload":
        return cls.model_validate(payload)
