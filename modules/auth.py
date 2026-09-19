"""
SWEPilot - trigger gate (authorization check).

Runs BEFORE any job is queued and BEFORE mini-SWE-agent / the LLM is started.
Everything in here is plain, deterministic code. The model never decides who
is allowed to trigger the agent.

Usage (inside your webhook handler):

    raw = await request.body()
    if not verify_signature(raw, request.headers.get("X-Hub-Signature-256"), WEBHOOK_SECRET):
        raise HTTPException(401)

    decision = evaluate_issue_event(json.loads(raw), installation_token)
    log_decision(decision)          # -> feeds your history / web UI
    if not decision.allowed:
        return {"status": "ignored", "reason": decision.reason}

    queue_job(...)                  # only now does the agent get involved
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import os
from dataclasses import dataclass

import requests

log = logging.getLogger("swepilot.auth")

GITHUB_API = "https://api.github.com"

# The flag that must appear in the issue title (compared case-insensitively).
TRIGGER_FLAG = "/swepilot"

# Issue actions that can start a run.
HANDLED_ACTIONS = {"opened", "edited", "reopened"}

# GitHub's "permission" field is one of: admin, write, read, none.
# (maintain is reported as write, triage is reported as read.)
# admin + write  ==  owner / admins / collaborators with write access.
ALLOWED_PERMISSIONS = {"admin", "write"}

# Optional allow-list, e.g. SWEPILOT_ALLOWED_REPOS="alice/demo,alice/other".
# Empty / unset means "any repo the GitHub App is installed on".
ALLOWED_REPOS = {
    r.strip().lower()
    for r in os.getenv("SWEPILOT_ALLOWED_REPOS", "").split(",")
    if r.strip()
}


@dataclass
class Decision:
    allowed: bool
    reason: str
    actor: str | None = None        # GitHub username that triggered the event
    permission: str | None = None   # what GitHub says that user can do on the repo


# --------------------------------------------------------------------------- #
# Step 1: is this request really from GitHub?
# --------------------------------------------------------------------------- #
def verify_signature(raw_body: bytes, signature_header: str | None, secret: str) -> bool:
    """Validate the X-Hub-Signature-256 header (HMAC-SHA256 of the raw body)."""
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)


# --------------------------------------------------------------------------- #
# Step 2: ask GitHub what this user is allowed to do on this repo
# --------------------------------------------------------------------------- #
def get_permission(owner: str, repo: str, username: str, token: str) -> str | None:
    """
    GET /repos/{owner}/{repo}/collaborators/{username}/permission

    Returns "admin" | "write" | "read" | "none", or None if the lookup failed.
    A failed lookup must be treated as "not allowed" (fail closed).
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}/collaborators/{username}/permission"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
    except requests.RequestException:
        log.exception("Permission lookup failed for %s on %s/%s", username, owner, repo)
        return None

    if resp.status_code == 200:
        return resp.json().get("permission")
    if resp.status_code == 404:          # user does not exist / has no relation to repo
        return "none"

    log.error("Unexpected %s from permission API: %s", resp.status_code, resp.text[:200])
    return None


# --------------------------------------------------------------------------- #
# Step 3: put every check together and return one decision
# --------------------------------------------------------------------------- #
def evaluate_issue_event(payload: dict, token: str) -> Decision:
    """Cheap checks first, the GitHub API call last."""
    action = payload.get("action")
    issue = payload.get("issue")
    repo_info = payload.get("repository") or {}
    sender = payload.get("sender") or {}
    actor = sender.get("login")

    if action not in HANDLED_ACTIONS or not issue:
        return Decision(False, f"ignored event/action: {action}", actor)

    # For "edited", only react when the TITLE changed (that's where the flag lives).
    if action == "edited" and "title" not in (payload.get("changes") or {}):
        return Decision(False, "edit did not change the title", actor)

    full_name = (repo_info.get("full_name") or "").lower()
    if ALLOWED_REPOS and full_name not in ALLOWED_REPOS:
        return Decision(False, f"repository {full_name} is not allow-listed", actor)

    # Flag detection (feature 2).
    if TRIGGER_FLAG not in (issue.get("title") or "").lower():
        return Decision(False, "no /SWEPilot flag in title", actor)

    if not actor:
        return Decision(False, "payload has no sender", None)

    # Never react to bots (also stops loops caused by our own comments / PRs).
    if sender.get("type") == "Bot":
        return Decision(False, "sender is a bot", actor)

    # Authorization (feature 3).
    # NOTE: we check the SENDER (who performed this action), not issue.user
    # (who originally wrote the issue). Otherwise a stranger could open an
    # issue, and later edit the title to add the flag.
    owner, repo = full_name.split("/", 1)
    permission = get_permission(owner, repo, actor, token)

    if permission is None:
        return Decision(False, "could not verify permissions (failing closed)", actor)
    if permission not in ALLOWED_PERMISSIONS:
        return Decision(False, f"{actor} has '{permission}' access; write/admin required",
                        actor, permission)

    return Decision(True, "authorized", actor, permission)