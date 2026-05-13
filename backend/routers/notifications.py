import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models import Notification, User
from schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationOut])
async def list_notifications(
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50)
    if unread_only:
        q = q.where(Notification.is_read == False)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"ok": True}
