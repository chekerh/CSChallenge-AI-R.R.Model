# UtopiaHire — Product

UtopiaHire is an AI-powered resume review, CV building, job search automation, and career management platform. It targets Tunisian and international job seekers and supports bilingual French/English.

## Core value proposition

- A job seeker uploads a resume and receives a deep AI diagnosis instead of a generic score: section-by-section findings, a 0-100 scoring model, and market notes about how the CV reads for recruiters and ATS.
- The CV builder produces structured, recruiter-ready documents by blocks, with a live preview, instead of forcing people to fight Word formatting.
- Job match compares a CV against real job descriptions and says exactly where the gap is — not just "you're a 73% match".
- Section rewrite generates triple-tone rewrites (conservative / strong / premium) so a candidate can adapt one bullet to many applications without rewriting from scratch.

## Feature inventory

- AI CV Diagnosis: deep analysis with scoring, per-section findings, market notes.
- CV Builder: structured creation by blocks with preview and publish.
- Job Match: CV vs job description scoring with gap detection.
- Section Rewrite: triple-tone rewrites (conservative / strong / premium).
- Job Tracking: agents, applications, and a stats dashboard.
- Billing: Stripe subscriptions, Free and Pro plans.
- Admin panel: user management, plans, content blocks, analytics, audit log.
- RBAC: user, support, admin, super_admin roles.
- Dark mode: system-aware with a manual toggle.

## Technical foundation

- Frontend: React 18, TypeScript, Vite 5, Tailwind CSS 3.
- Backend: Node.js, Express 4, TypeScript.
- Database: MongoDB 7 with Mongoose 7.
- Auth: JWT with configurable expiry; password policy enforced.
- AI: OpenAI (gpt-4o-mini) used through a strict JSON-output layer.
- Payments: Stripe in TND for Tunisian users.
- Email: Resend.
- Validation: Zod.
- Logging: Pino structured logs; analytics events tracked for product decisions.
- Deployment: Docker Compose with Nginx.

## What is deliberately different

- Not another "upload your CV, get a score" tool: analysis output is actionable and section-specific.
- Tailored for the Tunisian market (TND, French + English) rather than a US-only SaaS.
- The same AI that scores the CV is used to rewrite it and to match it to specific jobs — one coherent pipeline instead of disconnected features.
- Candidate data is treated as sensitive: JWT auth, rate limiting, audit log for admin actions, TTL expiry on events.
