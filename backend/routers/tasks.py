import json
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from dependencies import get_current_user
from models import Board, Column, Task, TaskPriority, User, WorkspaceMember
from schemas import TaskCreate, TaskOut, TaskUpdate, CommentCreate, CommentOut
from services.realtime import manager
from models import Comment

router = APIRouter(prefix="/tasks", tags=["tasks"])


async def _assert_board_access(db: AsyncSession, board_id: uuid.UUID, user: User):
    board = await db.get(Board, board_id)
    if not board:
        raise HTTPException(404, "Board not found")
    member = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == board.workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    )
    if not member.scalar_one_or_none() and board.workspace_id not in []:
        raise HTTPException(403, "Not a workspace member")
    return board


@router.post("/column/{column_id}", response_model=TaskOut, status_code=201)
async def create_task(
    column_id: uuid.UUID,
    body: TaskCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    col = await db.get(Column, column_id)
    if not col:
        raise HTTPException(404, "Column not found")

    # Get next position
    result = await db.execute(select(func.count()).where(Task.column_id == column_id))
    count = result.scalar() or 0

    task = Task(
        column_id=column_id,
        creator_id=user.id,
        title=body.title,
        description=body.description,
        position=count,
        priority=TaskPriority(body.priority),
        labels=json.dumps(body.labels) if body.labels else None,
        due_date=body.due_date,
        assignee_id=body.assignee_id,
        estimated_hours=body.estimated_hours,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # Broadcast
    await manager.broadcast(str(col.board_id), {
        "type": "task_created",
        "task": {"id": str(task.id), "title": task.title, "column_id": str(column_id)},
    })
    return task


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: uuid.UUID,
    body: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")

    update_data = body.model_dump(exclude_none=True)
    if "priority" in update_data:
        update_data["priority"] = TaskPriority(update_data["priority"])
    if "labels" in update_data:
        update_data["labels"] = json.dumps(update_data["labels"])

    # Handle move to different column
    old_column_id = task.column_id
    for k, v in update_data.items():
        setattr(task, k, v)

    # Mark as completed if moved to done column
    if "column_id" in update_data and update_data["column_id"] != old_column_id:
        col = await db.get(Column, task.column_id)
        if col and col.name.lower() in ("done", "completed", "closed"):
            task.completed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(task)

    col = await db.get(Column, task.column_id)
    if col:
        await manager.broadcast(str(col.board_id), {
            "type": "task_updated",
            "task": {"id": str(task.id), "title": task.title, "column_id": str(task.column_id)},
        })
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    await db.delete(task)
    await db.commit()


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return task


# ── Comments ──────────────────────────────────────────────────────────────────

@router.post("/{task_id}/comments", response_model=CommentOut, status_code=201)
async def add_comment(
    task_id: uuid.UUID,
    body: CommentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    comment = Comment(task_id=task_id, author_id=user.id, content=body.content)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


@router.get("/{task_id}/comments", response_model=list[CommentOut])
async def list_comments(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at))
    return result.scalars().all()
