import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from dependencies import get_current_user
from models import Board, Column, User, WorkspaceMember
from schemas import BoardCreate, BoardOut, ColumnCreate, ColumnOut

router = APIRouter(prefix="/boards", tags=["boards"])


async def _assert_member(db: AsyncSession, workspace_id: uuid.UUID, user: User):
    r = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    )
    m = r.scalar_one_or_none()
    if not m:
        raise HTTPException(403, "Not a workspace member")
    return m


@router.post("/workspace/{workspace_id}", response_model=BoardOut, status_code=201)
async def create_board(
    workspace_id: uuid.UUID,
    body: BoardCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _assert_member(db, workspace_id, user)
    board = Board(workspace_id=workspace_id, name=body.name, description=body.description, is_public=body.is_public)
    db.add(board)
    await db.flush()

    # Default columns
    for i, name in enumerate(["Todo", "In Progress", "Review", "Done"]):
        db.add(Column(board_id=board.id, name=name, position=i))
    await db.commit()
    await db.refresh(board)
    return board


@router.get("/workspace/{workspace_id}", response_model=list[BoardOut])
async def list_boards(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _assert_member(db, workspace_id, user)
    result = await db.execute(select(Board).where(Board.workspace_id == workspace_id))
    return result.scalars().all()


@router.get("/{board_id}", response_model=BoardOut)
async def get_board(
    board_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    board = await db.get(Board, board_id)
    if not board:
        raise HTTPException(404, "Board not found")
    return board


@router.get("/{board_id}/full")
async def get_board_full(
    board_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Returns board with all columns and tasks for initial render."""
    result = await db.execute(
        select(Board)
        .where(Board.id == board_id)
        .options(
            selectinload(Board.columns).selectinload(Column.tasks)
        )
    )
    board = result.scalar_one_or_none()
    if not board:
        raise HTTPException(404, "Board not found")
    return board


@router.delete("/{board_id}", status_code=204)
async def delete_board(
    board_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    board = await db.get(Board, board_id)
    if not board:
        raise HTTPException(404, "Board not found")
    await _assert_member(db, board.workspace_id, user)
    await db.delete(board)
    await db.commit()


# ── Columns ───────────────────────────────────────────────────────────────────

@router.post("/{board_id}/columns", response_model=ColumnOut, status_code=201)
async def add_column(
    board_id: uuid.UUID,
    body: ColumnCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    board = await db.get(Board, board_id)
    if not board:
        raise HTTPException(404, "Board not found")
    col = Column(board_id=board_id, **body.model_dump())
    db.add(col)
    await db.commit()
    await db.refresh(col)
    return col


@router.patch("/{board_id}/github")
async def link_github_repo(
    board_id: uuid.UUID,
    repo: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    board = await db.get(Board, board_id)
    if not board:
        raise HTTPException(404, "Board not found")
    board.github_repo = repo
    await db.commit()
    return {"github_repo": repo}
