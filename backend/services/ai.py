import json
from typing import Optional

from openai import AsyncOpenAI

from config import settings
from schemas import (
    AISubtask, AITaskBreakdownResponse,
    NLPTaskResult, SprintMilestone, SprintPlanResponse,
)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
MODEL = settings.OPENAI_MODEL


async def breakdown_task(goal: str, context: Optional[str] = None) -> AITaskBreakdownResponse:
    system = (
        "You are an expert software project manager. "
        "Break down the given goal into concrete, actionable subtasks. "
        "Return valid JSON only."
    )
    user_msg = f"Goal: {goal}"
    if context:
        user_msg += f"\nContext: {context}"
    user_msg += (
        "\n\nRespond with JSON in this exact schema:\n"
        '{"subtasks": [{"title": "...", "description": "...", "estimated_hours": 2.0, "priority": "medium"}], '
        '"complexity": "medium", "total_estimated_hours": 12.0}'
    )

    resp = await client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user_msg}],
        temperature=0.4,
    )
    data = json.loads(resp.choices[0].message.content)
    subtasks = [AISubtask(**s) for s in data.get("subtasks", [])]
    return AITaskBreakdownResponse(
        goal=goal,
        subtasks=subtasks,
        complexity=data.get("complexity", "medium"),
        total_estimated_hours=data.get("total_estimated_hours", sum(s.estimated_hours or 0 for s in subtasks)),
    )


async def parse_natural_language_task(text: str) -> NLPTaskResult:
    system = (
        "You extract task metadata from natural language. Return valid JSON only.\n"
        "Schema: {\"title\": \"...\", \"assignee_name\": \"...\", "
        "\"due_date\": \"YYYY-MM-DD or null\", \"priority\": \"low|medium|high|urgent\", "
        "\"labels\": [\"...\"]}"
    )
    resp = await client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": system}, {"role": "user", "content": text}],
        temperature=0.2,
    )
    data = json.loads(resp.choices[0].message.content)
    return NLPTaskResult(**data)


async def generate_sprint_plan(goal: str, deadline_days: int, team_size: int) -> SprintPlanResponse:
    system = (
        "You are an agile coach. Generate a sprint plan for the given goal and deadline. "
        "Return valid JSON only."
    )
    user_msg = (
        f"Goal: {goal}\nDeadline: {deadline_days} days\nTeam size: {team_size}\n\n"
        "Schema: {\"milestones\": [{\"week\": 1, \"title\": \"...\", \"tasks\": [\"...\"]}], "
        "\"total_tasks\": 12, \"suggested_team_size\": 3, \"risk_level\": \"medium\"}"
    )
    resp = await client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user_msg}],
        temperature=0.5,
    )
    data = json.loads(resp.choices[0].message.content)
    milestones = [SprintMilestone(**m) for m in data.get("milestones", [])]
    return SprintPlanResponse(
        goal=goal,
        milestones=milestones,
        total_tasks=data.get("total_tasks", 0),
        suggested_team_size=data.get("suggested_team_size", team_size),
        risk_level=data.get("risk_level", "medium"),
    )
