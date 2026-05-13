from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables
from routers import ai, analytics, auth, boards, github_integration, notifications, tasks, websockets, workspaces


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered collaborative Kanban SaaS API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [
    auth.router,
    workspaces.router,
    boards.router,
    tasks.router,
    ai.router,
    analytics.router,
    github_integration.router,
    notifications.router,
    websockets.router,
]:
    app.include_router(router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
