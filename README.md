<div align="center">

# 🚀 NexusFlow AI

### *The AI-Powered Collaborative Workspace Platform*

**A production-grade full-stack application combining the best of Notion, Trello, Google Docs, and ChatGPT into one unified workspace experience.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.6-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Real-Time Features](#-real-time-features)
- [AI Capabilities](#-ai-capabilities)
- [Deployment](#-deployment)
- [Docker](#-docker)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Project Structure](#-project-structure)
- [Demo Credentials](#-demo-credentials)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**NexusFlow AI** is a full-stack collaborative workspace platform built with modern TypeScript throughout. It brings together project management, real-time collaboration, and AI-powered assistance in a beautiful, responsive dark-mode interface.
This codebase demonstrates production-grade patterns — JWT refresh token rotation, Socket.io presence tracking, optimistic UI updates, lazy-loaded code splitting, Prisma ORM migrations, Dockerized deployment, and CI/CD pipelines.

### Live Demo
| Service | URL |
|---------|-----|
| Frontend (Vercel) | `https://nexusflow-ai.vercel.app` |
| Backend API (Railway) | `https://nexusflow-api.up.railway.app` |

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT + Refresh Token Rotation** — 15-minute access tokens with 7-day sliding refresh tokens
- **Role-Based Access Control (RBAC)** — `ADMIN`, `MEMBER`, `VIEWER` roles per workspace
- **bcryptjs** password hashing with cost factor 12
- **Helmet.js** security headers, rate limiting (100 req/15min), CORS protection
- **Secure cookie-based token storage** with HttpOnly flags

### 🏢 Workspace Management
- Create unlimited workspaces with custom colors and emoji icons
- Invite members by email with role assignment
- Workspace-level activity feeds and member presence
- Real-time online member tracking via Socket.io

### 📋 Kanban Board
- **Full drag-and-drop** powered by `@dnd-kit/core` + `@dnd-kit/sortable`
- 4 swimlane columns: **Todo → In Progress → In Review → Done**
- Drag overlay with smooth spring animations (Framer Motion)
- Real-time task sync — changes broadcast to all workspace members instantly

### ✅ Task Management
- Rich task model: title, description, status, priority (Critical/High/Medium/Low), labels
- Assignee selection, due dates, and overdue detection
- Inline editing in task detail modal
- File attachments with Multer disk storage
- Threaded comments with typing indicators
- Paginated table view with multi-field filtering and sorting

### 🤖 AI Assistant (GPT-4o-mini)
| Endpoint | Capability |
|----------|-----------|
| Summarize Task | Generates concise summary of task + comments |
| Generate Subtasks | Breaks task into 3-7 actionable sub-items |
| Rewrite Description | Rewrites description as professional JIRA ticket |
| Suggest Deadline | Recommends deadline based on complexity + priority |
| AI Chat | Conversational workspace assistant with context |
| Meeting Summary | Transforms bullet notes into structured meeting minutes |
| Productivity Insights | GPT-powered analysis of team velocity and patterns |

### 📊 Analytics Dashboard
- **Area Chart** — 30-day task completion trend
- **Bar Chart** — Tasks by status distribution
- **Pie Charts** — Priority breakdown + task type distribution
- **Top Contributors** leaderboard with completion rates
- **Activity heatmap** and velocity metrics

### 🔔 Notifications
- Real-time push notifications via Socket.io
- In-app notification panel with unread count badge
- Notification types: task assignment, comments, mentions, due date reminders
- Mark individual / mark all as read

### 📁 File Management
- Multer-powered file uploads (up to 10MB)
- Per-task file attachments with metadata
- File type icons and size formatting
- Secure file deletion with ownership checks

### 🎨 UI/UX
- **Full dark mode** with Slate/Indigo design system
- **Framer Motion** page transitions and micro-animations
- Collapsible animated sidebar with workspace switcher
- Responsive design — works on mobile, tablet, desktop
- `DiceBear` generated avatars for users without profile pictures
- Toast notifications with react-hot-toast
- Skeleton loading states throughout

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS | JavaScript runtime |
| Express | 4.18 | HTTP server framework |
| TypeScript | 5.3 | Type safety |
| Prisma ORM | 5.7 | Database ORM + migrations |
| PostgreSQL | 16 | Primary database |
| Socket.io | 4.6 | Real-time bidirectional communication |
| OpenAI SDK | 4.24 | GPT-4o-mini AI integration |
| JWT (jsonwebtoken) | 9.0 | Authentication tokens |
| bcryptjs | 2.4 | Password hashing |
| Multer | 1.4 | File upload handling |
| Winston | 3.11 | Structured logging |
| Helmet | 7.1 | Security HTTP headers |
| express-rate-limit | 7.1 | API rate limiting |
| compression | 1.7 | Gzip response compression |
| morgan | 1.10 | HTTP request logging |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI component library |
| Vite | 5.0 | Build tool + dev server |
| TypeScript | 5.3 | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |
| Framer Motion | 10.18 | Animations and transitions |
| Zustand | 4.4 | Client-side state management |
| TanStack Query | 5.17 | Server state + caching |
| React Router | 6.21 | Client-side routing |
| Socket.io-client | 4.6 | Real-time WebSocket client |
| Recharts | 2.10 | Analytics charts |
| @dnd-kit | 6/8/3 | Drag-and-drop Kanban |
| Axios | 1.6 | HTTP client with interceptors |
| react-hook-form | 7.49 | Form state management |
| Zod | 3.22 | Schema validation |
| react-markdown | 9.0 | Markdown rendering in AI chat |
| lucide-react | 0.312 | Icon library |
| react-hot-toast | 2.4 | Toast notifications |
| date-fns | 3.2 | Date formatting utilities |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Zustand  │  │  React   │  │  Socket  │  │   Recharts  │  │
│  │  Stores   │  │  Query   │  │  Client  │  │   Charts    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS + WSS
┌─────────────────────────────────────────────────────────────┐
│                     API Server (Express)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │   Auth   │  │  REST    │  │ Socket.io │  │   OpenAI   │  │
│  │ Middleware│  │  Routes  │  │  Handler  │  │   GPT-4o   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Prisma  │  │  Multer  │  │  Winston  │  │   Helmet   │  │
│  │   ORM    │  │  Upload  │  │  Logging  │  │  Security  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       PostgreSQL 16                           │
│  Users • Workspaces • Boards • Tasks • Comments • Files      │
│  Notifications • ActivityLogs • RefreshTokens • AiChats      │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Patterns
- **Repository pattern** via Prisma — all DB access through typed ORM
- **Singleton Prisma client** with global caching for dev hot-reload safety
- **JWT refresh rotation** — old refresh tokens are revoked on use (prevents replay attacks)
- **Workspace rooms** — Socket.io rooms scoped per workspace ID for targeted broadcasts
- **Optimistic UI** — React Query cache manipulation for instant feedback
- **Code splitting** — React Router lazy imports + Vite manual chunks

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+ ([download](https://nodejs.org/))
- **PostgreSQL** 15+ ([download](https://www.postgresql.org/download/)) or Docker
- **npm** 9+ (comes with Node.js)
- **Git**

### Option A — Local Development (Manual)

```bash
# 1. Clone the repository
git clone https://github.com/Mohitjain1708/NexusFlowAI.git
cd NexusFlowAI

# 2. Setup Backend
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT secrets, and OPENAI_API_KEY
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev           # Starts on http://localhost:5000

# 3. Setup Frontend (new terminal)
cd ../frontend
cp .env.example .env.local
# Edit .env.local — set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev           # Starts on http://localhost:5173
```

### Option B — Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/Mohitjain1708/NexusFlowAI.git
cd NexusFlowAI

# 2. Set your OpenAI API key
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# 3. Start all services (PostgreSQL + Backend + Frontend)
docker compose up --build

# 4. Run migrations + seed (first time only)
docker exec nexusflow_backend npx prisma migrate deploy
docker exec nexusflow_backend npx prisma db seed

# App is running:
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
# Database: localhost:5432
```

---

## 🔑 Environment Variables

### Backend — `backend/.env`

```env
# ─── Server ─────────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ─── Database ───────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:password@localhost:5432/nexusflow?schema=public"

# ─── JWT Authentication ─────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
REFRESH_TOKEN_SECRET=your_refresh_token_secret_minimum_32_characters
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# ─── OpenAI ─────────────────────────────────────────────────
OPENAI_API_KEY=sk-your-openai-api-key-here

# ─── CORS ───────────────────────────────────────────────────
FRONTEND_URL=http://localhost:5173

# ─── File Upload ────────────────────────────────────────────
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

### Frontend — `frontend/.env.local`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> ⚠️ **Security Note:** Never commit `.env` files. Both are listed in `.gitignore`. Use GitHub Secrets / Vercel Environment Variables / Railway Variables for production.

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ | Register new user (creates default workspace) |
| `POST` | `/auth/login` | ❌ | Login, returns access + refresh tokens |
| `POST` | `/auth/logout` | ✅ | Revoke refresh token |
| `POST` | `/auth/refresh` | ❌ | Rotate refresh token, get new access token |
| `GET` | `/auth/me` | ✅ | Get authenticated user profile |

### Workspaces

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/workspaces` | ✅ | List all user's workspaces |
| `POST` | `/workspaces` | ✅ | Create workspace |
| `GET` | `/workspaces/:id` | ✅ | Get workspace details + stats |
| `PUT` | `/workspaces/:id` | ✅ ADMIN | Update workspace |
| `DELETE` | `/workspaces/:id` | ✅ ADMIN | Delete workspace |
| `POST` | `/workspaces/:id/invite` | ✅ ADMIN | Invite member by email |
| `DELETE` | `/workspaces/:id/members/:userId` | ✅ ADMIN | Remove member |

### Boards

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/boards?workspaceId=...` | ✅ | List boards in workspace |
| `POST` | `/boards` | ✅ | Create board |
| `GET` | `/boards/:id` | ✅ | Get board with tasks |
| `PUT` | `/boards/:id` | ✅ | Update board |
| `DELETE` | `/boards/:id` | ✅ ADMIN | Delete board |

### Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/tasks?boardId=...&status=...&priority=...&page=...` | ✅ | List + filter tasks |
| `POST` | `/tasks` | ✅ | Create task (emits socket event) |
| `GET` | `/tasks/:id` | ✅ | Get task detail |
| `PUT` | `/tasks/:id` | ✅ | Update task (emits socket event) |
| `DELETE` | `/tasks/:id` | ✅ | Delete task (emits socket event) |
| `PATCH` | `/tasks/:id/move` | ✅ | Move task to new status column |

### AI Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/ai/summarize/:taskId` | ✅ | Summarize task with AI |
| `POST` | `/ai/subtasks/:taskId` | ✅ | Generate subtask suggestions |
| `POST` | `/ai/rewrite/:taskId` | ✅ | Rewrite task as professional ticket |
| `POST` | `/ai/deadline/:taskId` | ✅ | Suggest optimal deadline |
| `POST` | `/ai/chat` | ✅ | Conversational AI assistant |
| `POST` | `/ai/meeting-summary` | ✅ | Format meeting notes |
| `GET` | `/ai/insights/:workspaceId` | ✅ | Get AI productivity insights |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/analytics/:workspaceId` | ✅ | Full analytics (charts, stats, contributors) |
| `GET` | `/analytics/:workspaceId/dashboard` | ✅ | Dashboard summary stats |

### Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST/DELETE` | `/comments` | Task comments CRUD |
| `GET/PUT/DELETE` | `/notifications` | Notification management |
| `POST` | `/files/upload` | Upload file attachment |
| `GET/DELETE` | `/files` | List/delete task files |
| `GET/PUT` | `/users/profile` | User profile management |
| `PUT` | `/users/password` | Change password |
| `GET` | `/users/search` | Search users for assignment |

---

## 🗄 Database Schema

The Prisma schema defines **11 models**:

```prisma
model User             # id, email, name, avatar, role, createdAt
model RefreshToken     # id, token, userId, expiresAt, revoked
model Workspace        # id, name, description, color, icon, ownerId
model WorkspaceMember  # userId, workspaceId, role (ADMIN|MEMBER|VIEWER)
model Board            # id, name, description, workspaceId, color, position
model Task             # id, title, description, status, priority, assigneeId,
                       # boardId, dueDate, labels[], position, order
model Comment          # id, content, taskId, authorId, createdAt
model File             # id, filename, originalName, size, mimeType, taskId
model Notification     # id, type, message, userId, taskId, read, createdAt
model ActivityLog      # id, action, entityType, entityId, userId, workspaceId
model AiChat           # id, messages[], userId, workspaceId, title, createdAt
```

### Enums
```prisma
enum Role              { ADMIN  MEMBER  VIEWER }
enum TaskStatus        { TODO   IN_PROGRESS   IN_REVIEW   DONE }
enum TaskPriority      { LOW    MEDIUM        HIGH        CRITICAL }
enum NotificationType  { TASK_ASSIGNED  TASK_DUE  COMMENT_ADDED
                         WORKSPACE_INVITE  MENTION  TASK_COMPLETED }
```

---

## ⚡ Real-Time Features

Socket.io events (scoped to workspace rooms):

| Event | Direction | Description |
|-------|-----------|-------------|
| `workspace:join` | Client → Server | Join workspace room |
| `workspace:leave` | Client → Server | Leave workspace room |
| `task:created` | Server → Clients | New task broadcast |
| `task:updated` | Server → Clients | Task update broadcast |
| `task:deleted` | Server → Clients | Task deletion broadcast |
| `task:moved` | Server → Clients | Kanban column change |
| `comment:added` | Server → Clients | New comment broadcast |
| `user:typing` | Client → Server | Typing indicator |
| `user:typing:broadcast` | Server → Clients | Show typing to others |
| `notification:send` | Server → Client | Personal notification |
| `presence:update` | Server → Clients | Online members list |

---

## 🤖 AI Capabilities

All AI features use **OpenAI GPT-4o-mini** for cost-effective, high-quality responses:

```typescript
// Example: Generate subtasks
POST /api/ai/subtasks/:taskId

// Response:
{
  "subtasks": [
    "Research existing solutions and document findings",
    "Create wireframe mockups for approval",
    "Implement core functionality with unit tests",
    "Write integration tests and documentation",
    "Conduct code review and address feedback"
  ]
}
```

The AI Assistant sidebar supports:
- **Full conversation history** passed to OpenAI for context awareness
- **Workspace context** injected into system prompt
- **Suggested prompts** for common productivity tasks
- **Markdown rendering** for structured AI responses

---

## 🌐 Deployment

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From frontend directory
cd frontend
npm run build
vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_API_URL  = https://your-backend.up.railway.app/api
# VITE_SOCKET_URL = https://your-backend.up.railway.app
```

### Backend → Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard:
# DATABASE_URL (Railway provisions PostgreSQL automatically)
# JWT_SECRET
# REFRESH_TOKEN_SECRET
# OPENAI_API_KEY
# FRONTEND_URL = https://your-app.vercel.app
```

### Post-Deploy: Run Migrations
```bash
# Via Railway CLI
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

---

## 🐳 Docker

The project includes production-ready Docker configuration:

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f backend

# Stop all services
docker compose down

# Reset database
docker compose down -v  # removes volumes
docker compose up --build -d
docker exec nexusflow_backend npx prisma migrate deploy
docker exec nexusflow_backend npx prisma db seed
```

**Services:**
| Container | Port | Description |
|-----------|------|-------------|
| `nexusflow_postgres` | 5432 | PostgreSQL 16 database |
| `nexusflow_backend` | 5000 | Express API + Socket.io |
| `nexusflow_frontend` | 5173 | Nginx serving React build |

---

## ⚙️ CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs on every push to `main` or `develop`:

```
Push to main/develop
       │
       ├── test-backend
       │     ├── Setup PostgreSQL service container
       │     ├── npm ci + prisma generate
       │     ├── TypeScript type check
       │     └── Build backend
       │
       ├── test-frontend
       │     ├── npm ci
       │     ├── TypeScript type check
       │     └── Vite build
       │
       └── [on main only]
             ├── deploy-frontend → Vercel
             └── deploy-backend  → Railway
```

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `RAILWAY_TOKEN` | Railway deployment token |
| `VITE_API_URL` | Production backend API URL |
| `VITE_SOCKET_URL` | Production backend socket URL |

---

## 📁 Project Structure

```
NexusFlowAI/
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # GitHub Actions CI/CD
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (11 models)
│   │   └── seed.ts                # Demo data seeder
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts        # Prisma singleton client
│   │   │   └── env.ts             # Typed environment config
│   │   ├── controllers/           # 10 feature controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── workspace.controller.ts
│   │   │   ├── board.controller.ts
│   │   │   ├── task.controller.ts
│   │   │   ├── comment.controller.ts
│   │   │   ├── file.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── ai.controller.ts   # 7 OpenAI endpoints
│   │   │   ├── analytics.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts  # JWT verify + RBAC
│   │   │   ├── errorHandler.ts     # Typed error handling
│   │   │   ├── notFound.ts         # 404 handler
│   │   │   └── validate.middleware.ts
│   │   ├── routes/                 # 10 route files
│   │   ├── sockets/
│   │   │   └── socketHandler.ts    # Socket.io event handler
│   │   ├── utils/
│   │   │   └── logger.ts           # Winston structured logging
│   │   └── index.ts               # Express app entry point
│   ├── Dockerfile                  # Multi-stage Docker build
│   ├── railway.toml                # Railway deployment config
│   ├── Procfile                    # Heroku/Railway process file
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/
│   │   │   │   └── AIAssistant.tsx  # Chat sidebar with markdown
│   │   │   ├── analytics/
│   │   │   │   └── ProductivityChart.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── TasksWidget.tsx
│   │   │   │   └── ActivityFeed.tsx
│   │   │   ├── kanban/
│   │   │   │   ├── KanbanColumn.tsx
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   └── SortableTaskCard.tsx
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── Sidebar.tsx      # Collapsible animated sidebar
│   │   │   │   └── Header.tsx
│   │   │   ├── notifications/
│   │   │   │   └── NotificationPanel.tsx
│   │   │   ├── tasks/
│   │   │   │   ├── TaskDetailModal.tsx  # Full task modal
│   │   │   │   └── CreateTaskModal.tsx
│   │   │   ├── ui/
│   │   │   │   └── LoadingScreen.tsx
│   │   │   └── workspace/
│   │   │       └── InviteMemberModal.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx        # react-hook-form + demo creds
│   │   │   ├── SignupPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── DashboardPage.tsx    # Stats + charts + AI insights
│   │   │   ├── WorkspacesPage.tsx   # Grid + create modal
│   │   │   ├── WorkspacePage.tsx    # Workspace detail
│   │   │   ├── KanbanPage.tsx       # dnd-kit drag-and-drop
│   │   │   ├── TasksPage.tsx        # Table + filters + pagination
│   │   │   ├── AnalyticsPage.tsx    # Recharts visualization
│   │   │   └── SettingsPage.tsx     # Profile/security/notifications
│   │   ├── services/
│   │   │   └── api.ts               # Axios + auto token refresh
│   │   ├── sockets/
│   │   │   └── socketClient.ts      # Socket.io client + Zustand sync
│   │   ├── store/
│   │   │   ├── authStore.ts         # Persisted auth state
│   │   │   ├── workspaceStore.ts    # Workspace + task state
│   │   │   └── notificationStore.ts
│   │   ├── types/
│   │   │   └── index.ts             # All TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── cn.ts                # clsx + tailwind-merge
│   │   │   └── helpers.ts           # Date/priority/status utils
│   │   ├── styles/
│   │   │   └── globals.css          # Tailwind component layers
│   │   ├── App.tsx                  # Router + lazy routes + guards
│   │   └── main.tsx                 # React 18 createRoot entry
│   ├── Dockerfile                   # Nginx multi-stage build
│   ├── nginx.conf                   # SPA routing config
│   ├── vercel.json                  # Vercel deployment config
│   ├── vite.config.ts               # Vite + proxy + code splitting
│   ├── tailwind.config.js           # Custom design system
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml               # Full stack Docker Compose
├── .gitignore
└── README.md
```

---

## 🎭 Demo Credentials

After running `prisma db seed`, the following demo accounts are available:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@nexusflow.ai` | `password123` |
| **Member** | `member@nexusflow.ai` | `password123` |
| **Viewer** | `viewer@nexusflow.ai` | `password123` |

The seed also creates:
- 1 sample workspace: **"Nexus Product Team"**
- 1 board: **"Sprint 1"**
- 8 sample tasks across all status columns

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Commit with conventional commits: `git commit -m "feat: add your feature"`
4. Push: `git push origin feat/your-feature-name`
5. Open a Pull Request

### Commit Convention
```
feat:     New feature
fix:      Bug fix
refactor: Code refactoring
perf:     Performance improvement
docs:     Documentation update
test:     Adding or updating tests
chore:    Build process or auxiliary tool changes
ci:       CI/CD changes
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ using TypeScript, React, Node.js, and OpenAI**

*Production-grade code · Clean architecture · Designed to impress*

⭐ Star this repo if you found it useful!

</div>
