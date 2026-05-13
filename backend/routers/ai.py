from fastapi import APIRouter, Depends

from dependencies import get_current_user
from models import User
from schemas import (
    AITaskBreakdownRequest, AITaskBreakdownResponse,
    NLPTaskRequest, NLPTaskResult,
    SprintPlanRequest, SprintPlanResponse,
)
from services.ai import breakdown_task, generate_sprint_plan, parse_natural_language_task

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/breakdown", response_model=AITaskBreakdownResponse)
async def ai_task_breakdown(
    body: AITaskBreakdownRequest,
    user: User = Depends(get_current_user),
):
    """Break a high-level goal into actionable subtasks with estimates."""
    return await breakdown_task(body.goal, body.context)


@router.post("/parse-task", response_model=NLPTaskResult)
async def ai_parse_task(
    body: NLPTaskRequest,
    user: User = Depends(get_current_user),
):
    """Extract task metadata from natural language — title, assignee, due date, priority."""
    return await parse_natural_language_task(body.text)


@router.post("/sprint-plan", response_model=SprintPlanResponse)
async def ai_sprint_plan(
    body: SprintPlanRequest,
    user: User = Depends(get_current_user),
):
    """Generate a milestone-based sprint plan for a goal and deadline."""
    return await generate_sprint_plan(body.goal, body.deadline_days, body.team_size)
