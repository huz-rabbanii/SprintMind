import hashlib
import hmac
import json
from typing import Optional

import httpx

from config import settings


GITHUB_API = "https://api.github.com"


async def get_user_repos(token: str) -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API}/user/repos",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
            params={"sort": "updated", "per_page": 50},
        )
        resp.raise_for_status()
        return resp.json()


async def get_repo_prs(token: str, repo: str) -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API}/repos/{repo}/pulls",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
            params={"state": "all", "per_page": 30},
        )
        resp.raise_for_status()
        return resp.json()


async def get_repo_issues(token: str, repo: str) -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API}/repos/{repo}/issues",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
            params={"state": "open", "per_page": 30},
        )
        resp.raise_for_status()
        return [i for i in resp.json() if "pull_request" not in i]  # exclude PRs


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    if not settings.GITHUB_WEBHOOK_SECRET:
        return True
    expected = "sha256=" + hmac.new(
        settings.GITHUB_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def extract_task_id_from_commit(message: str) -> Optional[str]:
    """Extract #TASK-<id> pattern from commit message."""
    import re
    match = re.search(r"#TASK-([a-fA-F0-9\-]+)", message)
    return match.group(1) if match else None
