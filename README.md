# UtopiaHire - Resume Reviewer/Rewriter

This workspace contains a frontend (React + TypeScript) and a server subproject with migrations and edge functions for OpenAI and Kaggle integration.

## Current stack (source of truth)

| Layer | Technology |
|-------|------------|
| API & persistence | **Node.js**, **Express**, **MongoDB** (**Mongoose**) — `server/` |
| Web app | **Vite**, **React**, **TypeScript** — `frontend/` |
| Shared contracts | **TypeScript** — `shared/` |
| Optional | `edge/` (Deno) scripts; Kaggle / Google OAuth env vars are optional |

**Do not use PostgreSQL for this repo** unless you are maintaining a separate fork. Legacy PostgreSQL/Bolt wording is archived under [`docs/archive/SETUP-LEGACY-POSTGRES-NOTES.md`](docs/archive/SETUP-LEGACY-POSTGRES-NOTES.md).

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (version 18 or higher) - [Download from nodejs.org](https://nodejs.org/)
- **MongoDB** (local installation or cloud instance) - [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
- **Git** (for cloning the repository)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd utopiahire
```

### 2. Install Dependencies

Install all dependencies for the root project, which includes frontend, server, and shared packages:

```bash
npm install
```

This will install dependencies for all workspaces (frontend, server, shared).

### 3. Environment Setup

#### Server Environment Variables

Copy the example environment file and configure it:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and fill in the required values:

- `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/utopiahire`)
- `JWT_SECRET`: A strong random string for JWT token signing
- `OPENAI_API_KEY`: Your OpenAI API key (required for resume processing)
- `KAGGLE_USERNAME` and `KAGGLE_KEY`: Optional, for Kaggle dataset integration
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK`: Optional, for Google OAuth

#### Frontend Environment Variables

The frontend `.env` file is already configured for local development with:
- `VITE_API_URL=http://localhost:4000`
- `VITE_APP_NAME=UtopiaHire`
- `VITE_ENV=development`

### 4. Database Setup

Ensure MongoDB is running on your system. If using MongoDB Compass, connect to `localhost:27017` and create a database named `utopiahire`.

Run the database migrations to set up collections and indexes:

```bash
cd server
npm run migrate
```

### 5. Start the Development Servers

#### Option 1: Start All Services (Recommended)

From the project root, run the PowerShell script to start both frontend and backend:

```powershell
.\start-all.ps1
```

This will open separate terminal windows for frontend and backend development servers.

#### Option 2: Manual Start

**Backend (Server):**
```bash
cd server
npm run dev
```
The server will start on `http://localhost:4000`.

**Frontend:**
```bash
cd frontend
npm run dev
```
Or from project root:
```bash
npm run dev:frontend
```
The frontend will start on `http://localhost:5173`.

### 6. Verify Installation

Once both servers are running:

1. Open `http://localhost:5173` in your browser for the frontend
2. Check server health at `http://localhost:4000/health`

### 7. Run Tests (Optional)

```bash
# Run all tests
npm test

# Run frontend tests only
npm run test:frontend

# Run server tests only
npm run test:server
```

### 8. Build for Production

```bash
# Build all workspaces
npm run build

# Build individual workspaces
npm run build:frontend
npm run build:server
npm run build:shared
```

## Project Structure

```
utopiahire/
├── frontend/          # React + TypeScript frontend (Vite)
├── server/            # Node.js/Express backend
├── shared/            # Shared TypeScript types and utilities
├── edge/              # Deno edge functions for OpenAI/Kaggle
├── .gitignore         # Git ignore rules
├── package.json       # Root package with workspaces
└── README.md          # This file
```

## Troubleshooting

- **Port conflicts**: Ensure ports 4000 (server) and 5173 (frontend) are available (`lsof -nP -iTCP:4000 -sTCP:LISTEN`)
- **MongoDB connection**: Verify MongoDB is running and the connection string is correct
- **Dependencies**: Run `npm install` in each workspace if you encounter missing modules
- **Environment variables**: Ensure all required `.env` variables are set correctly

## Product status (current)

UtopiaHire now includes:

- **Admin roles + dashboard** (`admin`, `support`, `super_admin`) with RBAC
- **Dynamic plans** (`/public/plans`) and admin plan management (`/admin/plans`)
- **Dynamic content blocks** with draft/publish (`/admin/content`)
- **Server-side entitlement and quota enforcement** on premium AI routes
- **Analytics events** and admin metrics endpoint (`/admin/analytics`)
- **Playwright E2E suite** for user/admin critical paths

## E2E testing

Run in two steps:

```bash
# Terminal 1
npm run dev:e2e

# Terminal 2
E2E_WEB_SERVER=1 npm run test:e2e
```

What it covers right now:

- signup flow
- admin dashboard access + analytics view
- classic CV upload happy path

## Admin bootstrap (local/dev)

To elevate an existing user to super admin on startup:

```env
BOOTSTRAP_SUPER_ADMIN_EMAIL=you@example.com
```

Put it in `server/.env` (never commit real `.env` files).

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting:
   - `npm run lint`
   - `npm test`
   - `E2E_WEB_SERVER=1 npm run test:e2e` (if e2e servers are already running)
4. Submit a pull request


