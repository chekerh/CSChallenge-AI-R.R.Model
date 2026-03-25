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

- **Port conflicts**: Ensure ports 4000 (server) and 5173 (frontend) are available
- **MongoDB connection**: Verify MongoDB is running and the connection string is correct
- **Dependencies**: Run `npm install` in each workspace if you encounter missing modules
- **Environment variables**: Ensure all required `.env` variables are set correctly

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting: `npm run test && npm run lint`
4. Submit a pull request

---

## MongoDB setup

This project uses **MongoDB (Mongoose)**. If MongoDB is running locally (e.g. Compass on `localhost:27017` and database `utopiahire`), set the connection string in `server/.env`.

1) Set `server/.env` (copy `server/.env.example` to `server/.env`) and make sure these values are set:

```
MONGODB_URI=mongodb://localhost:27017/utopiahire
JWT_SECRET=replace_with_a_strong_secret
OPENAI_API_KEY=sk-...   # you mentioned you have provided this key
KAGGLE_USERNAME=        # optional
KAGGLE_KEY=             # optional
```

2) Install server deps and run migration/seed:

```powershell
cd C:\Users\Dell\Documents\CVModel\project\server
npm install
npm run migrate
```

3) Start server and open frontend (Vite):

```powershell
npm run dev    # in server directory
# in project root (frontend)
npm install
npm run dev
```

4) Quick API checks (PowerShell):

```powershell
# health
Invoke-WebRequest -Uri http://localhost:4000/health -UseBasicParsing | Select-Object -ExpandProperty Content

# signup
$resp = Invoke-RestMethod -Uri http://localhost:4000/auth/signup -Method POST -Body (ConvertTo-Json @{ email='you@example.com'; password='password123'; name='Local User' }) -ContentType 'application/json'
$token = $resp.token

# test upload with token (text only)
Invoke-RestMethod -Uri http://localhost:4000/resumes/upload -Method Post -Headers @{ Authorization = "Bearer $token" } -Body (ConvertTo-Json @{ title='My CV'; text='This is the resume content' }) -ContentType 'application/json'
```

Notes:
- Compass shows the `utopiahire` database and collections — migrations create indexes and will seed a test user. Use Compass to verify data after you run migrations.
- The server uses your `OPENAI_API_KEY` to call OpenAI when you trigger processing on a resume version.
 
## How to run locally (step-by-step)

1) Backend

```powershell
cd C:\Users\Dell\Documents\CVModel\project\server
copy .env.example .env    # edit .env and fill your keys (or create manually)
npm install
npm run migrate
npm run dev
```

The server binds to 127.0.0.1:4000 by default. If curl or PowerShell can't reach it, try these troubleshooting steps:

- Use 127.0.0.1 explicitly with curl: `curl.exe http://127.0.0.1:4000/health`
- Open `http://127.0.0.1:4000/health` in your browser.
- If you need to add a firewall rule, run PowerShell as Administrator and then:

```powershell
New-NetFirewallRule -DisplayName "Allow 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

2) Frontend (from project root)

```powershell
cd C:\Users\Dell\Documents\CVModel\project
npm install
npm run dev
```

Open the Vite URL printed by the dev server (usually http://localhost:5173).

3) Quick checks

```powershell
# check port listener
netstat -ano | Select-String ':4000'

# test connection
curl.exe http://127.0.0.1:4000/health
```

If anything fails, capture the server terminal output (the server logs incoming requests and errors), and paste it here.

Smoke test (quick end-to-end check)

After starting the backend (`npm run dev` in the `server` folder) you can run a quick smoke test which signs up, logs in, creates a resume and calls the processing endpoint. From the `server` folder:

```powershell
npm install
npm run smoke
```

The smoke test uses `127.0.0.1:4000` by default. If your server is bound to another host/port, set the `BASE` environment variable before running the script.

One-command start (Windows PowerShell)

If you want a single command to open backend and frontend dev terminals and run the smoke test, use the supplied PowerShell helper from the project root:

```powershell
.
\start-all.ps1
```

This will open two new PowerShell windows (backend and frontend), wait a few seconds, then run the smoke test in a third window. Adjust the script if you change ports or the backend host.


