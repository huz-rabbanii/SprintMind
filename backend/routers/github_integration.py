import json
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models import Task, User
from services.github import (
    extract_task_id_from_commit,
    get_repo_issues,
    get_repo_prs,
    get_user_repos,
    verify_webhook_signature,
)

router = APIRouter(prefix="/github", tags=["github"])


@router.get("/repos")
async def list_repos(user: User = Depends(get_current_user)):
    if not user.github_token:
        raise HTTPException(400, "GitHub account not connected")
    return await get_user_repos(user.github_token)


@router.get("/repos/{owner}/{repo}/prs")
async def list_prs(owner: str, repo: str, user: User = Depends(get_current_user)):
    if not user.github_token:
        raise HTTPException(400, "GitHub account not connected")
    return await get_repo_prs(user.github_token, f"{owner}/{repo}")


@router.get("/repos/{owner}/{repo}/issues")
async def list_issues(owner: str, repo: str, user: User = Depends(get_current_user)):
    if not user.github_token:
        raise HTTPException(400, "GitHub account not connected")
    return await get_repo_issues(user.github_token, f"{owner}/{repo}")


@router.post("/webhook")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    if not verify_webhook_signature(payload, x_hub_signature_256):
        raise HTTPException(403, "Invalid webhook signature")

    event = request.headers.get("X-GitHub-Event", "")
    data = json.loads(payload)

    if event == "push":
        for commit in data.get("commits", []):
            task_id_str = extract_task_id_from_commit(commit.get("message", ""))
            if task_id_str:
                try:
                    task_id = uuid.UUID(task_id_str)
                    task = await db.get(Task, task_id)
                    if task:
                        task.github_pr_status = "commit_pushed"
                        await db.commit()
                except ValueError:
                    pass

    elif event == "pull_request":
        pr = data.get("pull_request", {})
        body_text = pr.get("body", "") or ""
        task_id_str = extract_task_id_from_commit(body_text)
        if task_id_str:
            try:
                task_id = uuid.UUID(task_id_str)
                task = await db.get(Task, task_id)
                if task:
                    task.github_pr_url = pr.get("html_url")
                    task.github_pr_status = pr.get("state", "open")
                    await db.commit()
            except ValueError:
                pass

    return {"ok": True}
