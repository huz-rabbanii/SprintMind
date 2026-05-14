# SprintMind 

> AI-powered collaborative Kanban SaaS with real-time collaboration, GitHub integration, intelligent task planning, analytics, and modern DevOps workflows.

---

## Features at a Glance

| Feature | Detail |
|---|---|
| **JWT Auth + OAuth** | Register, login, Google OAuth, refresh tokens, email verification, password reset |
| **Workspaces & Boards** | Multi-workspace support, invite members with RBAC, default columns |
| **Kanban Board** | Drag-and-drop tasks (dnd-kit), WIP limits, labels, priorities, due dates |
| **Real-Time Collaboration** | WebSocket presence, typing indicators, live cursor, instant task sync |
| **AI Task Breakdown** | Enter a goal → GPT-4o generates subtasks with estimates and complexity rating |
| **Natural Language Tasks** | "Finish deployment by Friday, assign to Huzaifa" → structured task |
| **AI Sprint Planner** | Goal + deadline → weekly milestones with tasks and risk assessment |
| **GitHub Integration** | Link repos, sync PRs, auto-update tasks from commit messages (`#TASK-<id>`) |
| **Analytics Dashboard** | Sprint velocity chart, completion rate, overdue count, AI insights |
| **Notifications** | In-app + email notifications for assignments, mentions, due dates |
| **Background Jobs** | Celery + Redis for due-date reminders and GitHub PR sync |
| **Docker + CI/CD** | Fully dockerised (Postgres + Redis + backend + frontend + nginx), GitHub Actions |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, dnd-kit, Recharts |
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL, Alembic |
| Auth | JWT (python-jose), bcrypt, Google OAuth |
| AI | OpenAI GPT-4o (task breakdown, NLP parsing, sprint planning) |
| Realtime | WebSockets (FastAPI native) |
| Queue | Celery + Redis |
| GitHub | PyGithub + webhook handler |
| DevOps | Docker Compose, nginx, GitHub Actions |

---

## Project Structure

```
taskflow-ai/
├── backend/
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── config.py            # Settings via pydantic-settings
│   ├── database.py          # Async SQLAlchemy engine + session
│   ├── models.py            # All ORM models (User, Workspace, Board, Task…)
│   ├── schemas.py           # All Pydantic request/response schemas
│   ├── dependencies.py      # get_current_user dependency
│   ├── celery_app.py        # Celery + beat schedule
│   ├── routers/
│   │   ├── auth.py          # Register, login, refresh, verify, reset
│   │   ├── workspaces.py    # CRUD + member invite
│   │   ├── boards.py        # Board + column CRUD, GitHub link
│   │   ├── tasks.py         # Task CRUD + move + comments
│   │   ├── ai.py            # Task breakdown, NLP parser, sprint planner
│   │   ├── analytics.py     # Workspace + board analytics
│   │   ├── github_integration.py  # Repo list, PR list, webhook
│   │   ├── notifications.py # List + mark read
│   │   └── websockets.py    # /ws/board/<id> endpoint
│   ├── services/
│   │   ├── auth.py          # JWT, bcrypt, user queries
│   │   ├── ai.py            # OpenAI wrappers
│   │   ├── email.py         # SMTP via aiosmtplib
│   │   ├── github.py        # GitHub API + webhook verification
│   │   └── realtime.py      # WebSocket ConnectionManager
│   ├── tasks/
│   │   ├── notifications.py # Due-date reminder Celery task
│   │   └── github_sync.py   # PR status sync Celery task
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Redirect to /dashboard or /login
│   │   ├── (auth)/               # Login + Register pages
│   │   ├── dashboard/            # Workspace list
│   │   ├── workspace/[id]/       # Board list
│   │   ├── board/[id]/           # Kanban board view
│   │   └── analytics/            # Analytics dashboard
│   ├── components/
│   │   ├── board/                # KanbanBoard, Column, TaskCard, TaskModal
│   │   ├── ai/                   # AIPanel (breakdown + NLP + sprint)
│   │   ├── realtime/             # PresenceBar
│   │   └── layout/               # Sidebar, Topbar
│   ├── store/                    # Zustand: authStore, boardStore
│   ├── hooks/                    # useSocket
│   ├── lib/                      # api.ts (axios), socket.ts (WS)
│   ├── Dockerfile
│   └── package.json
├── nginx/nginx.conf
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/huz-rabbanii/taskflow-ai
cd taskflow-ai

cp backend/.env.example backend/.env
# Fill in OPENAI_API_KEY, SECRET_KEY, and optionally SMTP / GitHub credentials

docker compose up --build
```

- Frontend → http://localhost
- Backend API → http://localhost/api
- API docs → http://localhost:8000/docs

### Option B — Local dev

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

cp .env.example .env         # fill in values

uvicorn main:app --reload    # http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

**Redis + Postgres** (Docker, keep running locally)
```bash
docker run -d -p 5432:5432 -e POSTGRES_USER=taskflow -e POSTGRES_PASSWORD=taskflow -e POSTGRES_DB=taskflow postgres:16
docker run -d -p 6379:6379 redis:7
```

**Celery worker** (optional — for email notifications)
```bash
cd backend
celery -A celery_app worker --loglevel=info
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `SECRET_KEY` | Long random string for JWT signing |
| `DATABASE_URL` | PostgreSQL async URL |
| `REDIS_URL` | Redis URL |
| `OPENAI_API_KEY` | GPT-4o for AI features |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth |
| `GITHUB_WEBHOOK_SECRET` | Webhook HMAC secret |
| `SMTP_*` | Email (SMTP) credentials |

---

## API Highlights

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login → JWT pair |
| `POST` | `/api/ai/breakdown` | AI task breakdown |
| `POST` | `/api/ai/parse-task` | NLP → structured task |
| `POST` | `/api/ai/sprint-plan` | Sprint planner |
| `GET`  | `/api/boards/{id}/full` | Full board (columns + tasks) |
| `POST` | `/api/github/webhook` | GitHub push/PR webhook |
| `GET`  | `/api/analytics/workspace/{id}` | Velocity + metrics |
| `WS`   | `/api/ws/board/{id}` | Real-time board channel |

Full interactive docs: `http://localhost:8000/docs`

---

## GitHub Integration

1. Link a repo to a board via `PATCH /api/boards/{id}/github?repo=owner/repo`
2. Add a webhook in GitHub → `https://yourhost/api/github/webhook` (content-type: `application/json`)
3. In commit messages, reference tasks: `Fix auth bug #TASK-<uuid>` — task status updates automatically
4. PR URLs and statuses sync every hour via the Celery beat worker

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel (set `NEXT_PUBLIC_API_URL` env var) |
| Backend | Railway / Render (set all env vars) |
| Database | Supabase / Railway PostgreSQL |
| Redis | Railway / Upstash |

Or run the full stack on any VPS with `docker compose up -d`.

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push to `main`:
- `ruff` linting on Python
- `pytest` backend tests
- `next lint` + `next build` frontend
- Docker image builds on merge to `main`
