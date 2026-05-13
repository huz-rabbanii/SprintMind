from celery_app import celery_app
from config import settings


@celery_app.task(name="tasks.notifications.send_due_date_reminders")
def send_due_date_reminders():
    """Hourly: email users whose tasks are due within 24 hours."""
    import asyncio
    from datetime import datetime, timedelta, timezone

    from sqlalchemy import select

    from database import AsyncSessionLocal
    from models import Task, User, Column
    from services.email import send_email

    async def _run():
        async with AsyncSessionLocal() as db:
            window = datetime.now(timezone.utc) + timedelta(hours=24)
            result = await db.execute(
                select(Task, User)
                .join(Column, Column.id == Task.column_id)
                .join(User, User.id == Task.assignee_id)
                .where(Task.due_date <= window, Task.due_date > datetime.now(timezone.utc), Task.completed_at.is_(None))
            )
            for task, user in result.all():
                await send_email(
                    user.email,
                    f"Task due soon: {task.title}",
                    f"<p>Your task <strong>{task.title}</strong> is due on {task.due_date}.</p>",
                )

    asyncio.run(_run())
