from celery_app import celery_app


@celery_app.task(name="tasks.github_sync.sync_board_prs")
def sync_board_prs(board_id: str, github_token: str, repo: str):
    """Sync PR statuses for all tasks on a board."""
    import asyncio

    from sqlalchemy import select

    from database import AsyncSessionLocal
    from models import Column, Task
    from services.github import get_repo_prs

    async def _run():
        prs = await get_repo_prs(github_token, repo)
        pr_map = {pr["html_url"]: pr["state"] for pr in prs}

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Task)
                .join(Column)
                .where(Column.board_id == board_id, Task.github_pr_url.isnot(None))
            )
            for task in result.scalars().all():
                if task.github_pr_url in pr_map:
                    task.github_pr_status = pr_map[task.github_pr_url]
            await db.commit()

    asyncio.run(_run())
