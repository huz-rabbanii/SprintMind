import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def utcnow():
    return datetime.now(timezone.utc)


# ── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    OWNER   = "owner"
    ADMIN   = "admin"
    MEMBER  = "member"
    VIEWER  = "viewer"


class TaskPriority(str, enum.Enum):
    LOW    = "low"
    MEDIUM = "medium"
    HIGH   = "high"
    URGENT = "urgent"


class TaskStatus(str, enum.Enum):
    TODO        = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW      = "review"
    DONE        = "done"


class NotificationType(str, enum.Enum):
    TASK_ASSIGNED   = "task_assigned"
    TASK_UPDATED    = "task_updated"
    COMMENT_ADDED   = "comment_added"
    DUE_SOON        = "due_soon"
    MENTION         = "mention"
    GITHUB_LINKED   = "github_linked"


# ── User ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str]    = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None]      = mapped_column(String(500), nullable=True)

    is_active: Mapped[bool]    = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool]  = mapped_column(Boolean, default=False)

    # OAuth
    google_id: Mapped[str | None]  = mapped_column(String(255), nullable=True, unique=True)
    github_id: Mapped[str | None]  = mapped_column(String(255), nullable=True, unique=True)
    github_token: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Email verification / password reset
    verification_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reset_token: Mapped[str | None]        = mapped_column(String(255), nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    workspace_memberships: Mapped[list["WorkspaceMember"]] = relationship(back_populates="user")
    assigned_tasks: Mapped[list["Task"]]  = relationship(foreign_keys="Task.assignee_id", back_populates="assignee")
    created_tasks:  Mapped[list["Task"]]  = relationship(foreign_keys="Task.creator_id",  back_populates="creator")
    comments:       Mapped[list["Comment"]]      = relationship(back_populates="author")
    notifications:  Mapped[list["Notification"]] = relationship(back_populates="user")


# ── Workspace ────────────────────────────────────────────────────────────────

class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str]     = mapped_column(String(255), nullable=False)
    slug: Mapped[str]     = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None]        = mapped_column(String(10), nullable=True, default="🚀")

    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    members: Mapped[list["WorkspaceMember"]] = relationship(back_populates="workspace", cascade="all, delete-orphan")
    boards:  Mapped[list["Board"]]           = relationship(back_populates="workspace",  cascade="all, delete-orphan")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id: Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    user_id: Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"),       nullable=False)
    role: Mapped[UserRole]          = mapped_column(Enum(UserRole), default=UserRole.MEMBER)
    joined_at: Mapped[datetime]     = mapped_column(DateTime(timezone=True), server_default=func.now())

    workspace: Mapped["Workspace"] = relationship(back_populates="members")
    user:      Mapped["User"]      = relationship(back_populates="workspace_memberships")


# ── Board ────────────────────────────────────────────────────────────────────

class Board(Base):
    __tablename__ = "boards"

    id: Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    name: Mapped[str]           = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool]     = mapped_column(Boolean, default=False)
    github_repo: Mapped[str | None] = mapped_column(String(255), nullable=True)  # "owner/repo"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    workspace: Mapped["Workspace"]  = relationship(back_populates="boards")
    columns:   Mapped[list["Column"]] = relationship(back_populates="board", order_by="Column.position", cascade="all, delete-orphan")


class Column(Base):
    __tablename__ = "columns"

    id: Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("boards.id"), nullable=False)
    name: Mapped[str]        = mapped_column(String(100), nullable=False)
    position: Mapped[int]    = mapped_column(Integer, default=0)
    wip_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color: Mapped[str | None]     = mapped_column(String(20), nullable=True)

    board: Mapped["Board"]    = relationship(back_populates="columns")
    tasks: Mapped[list["Task"]] = relationship(back_populates="column", order_by="Task.position", cascade="all, delete-orphan")


# ── Task ─────────────────────────────────────────────────────────────────────

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID]     = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    column_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("columns.id"), nullable=False)
    creator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    parent_task_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True)

    title: Mapped[str]         = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int]      = mapped_column(Integer, default=0)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    labels: Mapped[str | None] = mapped_column(Text, nullable=True)   # JSON array
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_hours: Mapped[float | None] = mapped_column(nullable=True)

    # GitHub
    github_pr_url: Mapped[str | None]     = mapped_column(String(500), nullable=True)
    github_issue_url: Mapped[str | None]  = mapped_column(String(500), nullable=True)
    github_pr_status: Mapped[str | None]  = mapped_column(String(50), nullable=True)

    # AI generated flag
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    column:   Mapped["Column"]         = relationship(back_populates="tasks")
    creator:  Mapped["User"]           = relationship(foreign_keys=[creator_id],  back_populates="created_tasks")
    assignee: Mapped["User | None"]    = relationship(foreign_keys=[assignee_id], back_populates="assigned_tasks")
    subtasks: Mapped[list["Task"]]     = relationship(foreign_keys=[parent_task_id])
    comments: Mapped[list["Comment"]]  = relationship(back_populates="task", cascade="all, delete-orphan")


# ── Comment ───────────────────────────────────────────────────────────────────

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID]   = mapped_column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    task:   Mapped["Task"] = relationship(back_populates="comments")
    author: Mapped["User"] = relationship(back_populates="comments")


# ── Notification ──────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType))
    title: Mapped[str]   = mapped_column(String(255), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_read: Mapped[bool]    = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="notifications")
