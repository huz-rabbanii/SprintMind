import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


# ── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("username")
    @classmethod
    def username_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, hyphens and underscores")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


# ── User ─────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    full_name: str
    avatar_url: Optional[str]
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_format(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip().lower()
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, hyphens and underscores")
        return v


class ChangePassword(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── Workspace ─────────────────────────────────────────────────────────────────

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "🚀"


class WorkspaceOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    icon: Optional[str]
    owner_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteMember(BaseModel):
    email: EmailStr
    role: str = "member"


# ── Board ─────────────────────────────────────────────────────────────────────

class BoardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False


class BoardOut(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: Optional[str]
    is_public: bool
    github_repo: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ColumnCreate(BaseModel):
    name: str
    position: int = 0
    color: Optional[str] = None
    wip_limit: Optional[int] = None


class ColumnOut(BaseModel):
    id: uuid.UUID
    board_id: uuid.UUID
    name: str
    position: int
    color: Optional[str]
    wip_limit: Optional[int]

    model_config = {"from_attributes": True}


# ── Task ─────────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    labels: Optional[list[str]] = None
    due_date: Optional[datetime] = None
    assignee_id: Optional[uuid.UUID] = None
    estimated_hours: Optional[float] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    column_id: Optional[uuid.UUID] = None
    position: Optional[int] = None
    priority: Optional[str] = None
    labels: Optional[list[str]] = None
    due_date: Optional[datetime] = None
    assignee_id: Optional[uuid.UUID] = None
    estimated_hours: Optional[float] = None


class TaskOut(BaseModel):
    id: uuid.UUID
    column_id: uuid.UUID
    title: str
    description: Optional[str]
    position: int
    priority: str
    labels: Optional[str]
    due_date: Optional[datetime]
    estimated_hours: Optional[float]
    assignee_id: Optional[uuid.UUID]
    creator_id: uuid.UUID
    github_pr_url: Optional[str]
    github_pr_status: Optional[str]
    ai_generated: bool
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── AI ────────────────────────────────────────────────────────────────────────

class AITaskBreakdownRequest(BaseModel):
    goal: str
    context: Optional[str] = None


class AISubtask(BaseModel):
    title: str
    description: Optional[str]
    estimated_hours: Optional[float]
    priority: str


class AITaskBreakdownResponse(BaseModel):
    goal: str
    subtasks: list[AISubtask]
    complexity: str
    total_estimated_hours: float


class NLPTaskRequest(BaseModel):
    text: str


class NLPTaskResult(BaseModel):
    title: str
    assignee_name: Optional[str]
    due_date: Optional[str]
    priority: str
    labels: list[str]


class SprintPlanRequest(BaseModel):
    goal: str
    deadline_days: int
    team_size: int = 1


class SprintMilestone(BaseModel):
    week: int
    title: str
    tasks: list[str]


class SprintPlanResponse(BaseModel):
    goal: str
    milestones: list[SprintMilestone]
    total_tasks: int
    suggested_team_size: int
    risk_level: str


# ── Notification ──────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    body: Optional[str]
    link: Optional[str]
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
