# UtopiaHire

AI-powered resume review, CV building, job search automation, and career management platform. Built for Tunisian/international job seekers with bilingual French/English support.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 3 |
| Backend | Node.js, Express 4, TypeScript |
| Database | MongoDB 7, Mongoose 7 |
| Auth | JWT, bcryptjs |
| AI | OpenAI (gpt-4o-mini) |
| Payments | Stripe |
| Email | Resend |
| Validation | Zod |
| Logging | Pino |
| Testing | Vitest, Playwright |
| Deployment | Docker, Docker Compose, Nginx |

## Prerequisites

- **Node.js** 18+
- **MongoDB** 7 (local or Atlas)
- **OpenAI API key** (for AI features)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build shared types
npm run build:shared

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env - set MONGODB_URI, JWT_SECRET, OPENAI_API_KEY

# 4. Start MongoDB and run the app
npm run dev
```

The frontend starts at `http://localhost:5173` and the API at `http://localhost:4010`.

## Project Structure

```
utopiahire/
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   └── ui/        # Reusable UI primitives
│   │   ├── contexts/      # Auth context
│   │   └── lib/           # API clients and utilities
│   └── ...
├── server/            # Express + MongoDB API
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── models/        # Mongoose models
│   │   ├── middleware/     # Auth, error handling, CSRF
│   │   ├── cv/            # CV analysis engine
│   │   ├── billing/       # Stripe integration
│   │   ├── analytics/     # Event tracking
│   │   └── services/      # Email service
│   └── ...
├── shared/            # Shared TypeScript types
└── tests/e2e/         # Playwright E2E tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and server in dev mode |
| `npm run build` | Build all workspaces for production |
| `npm test` | Run all unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint |

## Docker

```bash
# Set required environment variables
export MONGO_ROOT_PASSWORD=<strong-password>
export JWT_SECRET=<random-32-chars>
export OPENAI_API_KEY=<your-key>
# ... set other env vars as needed

# Start all services
docker compose up -d
```

## Key Features

- **AI CV Diagnosis**: Deep analysis with scoring, section findings, market notes
- **CV Builder**: Structured CV creation by blocks with preview
- **Job Match**: Compare CV against job descriptions
- **Section Rewrite**: Triple-tone rewriting (conservative/strong/premium)
- **Job Tracking**: Agents, applications, stats dashboard
- **Billing**: Stripe subscriptions (Free/Pro plans)
- **Admin Panel**: User management, plans, content blocks, analytics, audit log
- **RBAC**: User, support, admin, super_admin roles
- **Dark Mode**: System-aware with manual toggle

## Security

- JWT authentication with configurable expiry
- Password strength enforcement (min 8 chars, uppercase, lowercase, digit)
- Rate limiting on auth routes (login: 5/min, signup: 20/min, forgot-password: 3/15min)
- Helmet security headers in production
- CORS configuration
- Request ID tracking
- Structured logging with Pino
- Audit log for admin actions
- TTL indexes on events and audit logs (90-day auto-expiry)
- File type validation on uploads
- MongoDB injection prevention via Mongoose
