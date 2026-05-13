import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models import User, Workspace, WorkspaceMember, UserRole
from schemas import InviteMember, WorkspaceCreate, WorkspaceOut
from services.email import send_invite_email

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug + "-" + str(uuid.uuid4())[:8]


@router.post("/", response_model=WorkspaceOut, status_code=201)
async def create_workspace(
    body: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ws = Workspace(name=body.name, slug=_slugify(body.name), description=body.description, icon=body.icon, owner_id=user.id)
    db.add(ws)
    await db.flush()
    db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role=UserRole.OWNER))
    await db.commit()
    await db.refresh(ws)
    return ws


@router.get("/", response_model=list[WorkspaceOut])
async def list_workspaces(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user.id)
    )
    return result.scalars().all()


@router.get("/{workspace_id}", response_model=WorkspaceOut)
async def get_workspace(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(404, "Workspace not found")
    return ws


@router.post("/{workspace_id}/invite")
async def invite_member(
    workspace_id: uuid.UUID,
    body: InviteMember,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(404, "Workspace not found")
    if ws.owner_id != user.id:
        raise HTTPException(403, "Only the owner can invite members")

    # Check if user exists
    result = await db.execute(select(User).where(User.email == body.email))
    invitee = result.scalar_one_or_none()
    if invitee:
        existing = await db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == invitee.id,
            )
        )
        if not existing.scalar_one_or_none():
            db.add(WorkspaceMember(workspace_id=workspace_id, user_id=invitee.id, role=UserRole(body.role)))
            await db.commit()

    # Send invite email regardless
    from fastapi import BackgroundTasks
    await send_invite_email(body.email, ws.name, user.full_name)
    return {"message": f"Invitation sent to {body.email}"}


@router.get("/{workspace_id}/members")
async def list_members(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(WorkspaceMember, User)
        .join(User, User.id == WorkspaceMember.user_id)
        .where(WorkspaceMember.workspace_id == workspace_id)
    )
    rows = result.all()
    return [
        {"user": {"id": str(u.id), "full_name": u.full_name, "email": u.email, "avatar_url": u.avatar_url}, "role": m.role}
        for m, u in rows
    ]


@router.delete("/{workspace_id}", status_code=204)
async def delete_workspace(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(404, "Workspace not found")
    if ws.owner_id != user.id:
        raise HTTPException(403, "Only the owner can delete the workspace")
    await db.delete(ws)
    await db.commit()
