from celery import Celery
from config import settings

celery_app = Celery(
    "taskflow",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["tasks.notifications", "tasks.github_sync"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "due-date-reminders": {
            "task": "tasks.notifications.send_due_date_reminders",
            "schedule": 3600.0,  # every hour
        },
    },
)
