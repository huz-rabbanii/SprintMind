import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models import Board, Column, Task, User, WorkspaceMember

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/workspace/{workspace_id}")
async def workspace_analytics(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify membership
    r = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    )
    if not r.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(403, "Not a member")

    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # Boards in workspace
    boards_result = await db.execute(select(Board).where(Board.workspace_id == workspace_id))
    boards = boards_result.scalars().all()
    board_ids = [b.id for b in boards]

    if not board_ids:
        return {"total_tasks": 0, "completed_tasks": 0, "overdue_tasks": 0, "completion_rate": 0.0, "velocity": []}

    # Total tasks
    total_q = await db.execute(
        select(func.count(Task.id))
        .join(Column)
        .where(Column.board_id.in_(board_ids))
    )
    total = total_q.scalar() or 0

    # Completed tasks
    done_q = await db.execute(
        select(func.count(Task.id))
        .join(Column)
        .where(Column.board_id.in_(board_ids), Task.completed_at.isnot(None))
    )
    completed = done_q.scalar() or 0

    # Overdue
    overdue_q = await db.execute(
        select(func.count(Task.id))
        .join(Column)
        .where(
            Column.board_id.in_(board_ids),
            Task.due_date < now,
            Task.completed_at.is_(None),
        )
    )
    overdue = overdue_q.scalar() or 0

    # Velocity: tasks completed per day over last 30 days (grouped by day)
    velocity_q = await db.execute(
        select(
            func.date_trunc("day", Task.completed_at).label("day"),
            func.count(Task.id).label("count"),
        )
        .join(Column)
        .where(
            Column.board_id.in_(board_ids),
            Task.completed_at >= thirty_days_ago,
        )
        .group_by("day")
        .order_by("day")
    )
    velocity = [{"date": str(row.day)[:10], "count": row.count} for row in velocity_q.all()]

    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "overdue_tasks": overdue,
        "completion_rate": round(completed / total * 100, 1) if total else 0.0,
        "velocity": velocity,
    }


@router.get("/board/{board_id}")
async def board_analytics(
    board_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Board).where(Board.id == board_id)
        .options(selectinload(Board.columns).selectinload(Column.tasks))
    )
    board = result.scalar_one_or_none()
    if not board:
        from fastapi import HTTPException
        raise HTTPException(404, "Board not found")

    columns_data = []
    for col in board.columns:
        columns_data.append({
            "name": col.name,
            "count": len(col.tasks),
            "wip_limit": col.wip_limit,
        })

    priority_counts: dict[str, int] = {}
    for col in board.columns:
        for task in col.tasks:
            p = task.priority.value if hasattr(task.priority, "value") else str(task.priority)
            priority_counts[p] = priority_counts.get(p, 0) + 1

    return {
        "board_name": board.name,
        "columns": columns_data,
        "priority_breakdown": priority_counts,
        "total_tasks": sum(c["count"] for c in columns_data),
    }
