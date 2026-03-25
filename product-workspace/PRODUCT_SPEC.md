# Product spec — UtopiaHire (CV Pro Tunisia)

## Summary

UtopiaHire is a **subscription CV optimization platform** for Tunisia-focused job seekers that delivers:

- **Trustworthy deep CV diagnosis** with explainable scoring
- **Role-targeted rewrites** with strict anti-hallucination rules
- **Bilingual workflows** (FR/EN now; Arabic UI later)
- A practical workflow: upload/build → iterate versions → export → apply

## Target audience

- **Country / market**: Tunisia (with international applications as a strong secondary use case)
- **Primary users**:
  - Students and new grads (internships, first job)
  - Call center / support candidates (high-volume market)
  - Business/admin/finance juniors
  - Junior software/data candidates applying internationally

## Core user problem

Users struggle to produce a CV that is:

- recruiter-readable in **10 seconds**
- aligned to a role and job description
- credible (no invented claims)
- strong in French and/or English

They need **clear, actionable guidance** and exports that are usable for real applications.

## Value proposition

Users pay because UtopiaHire:

- **Saves time** (coaching-like diagnosis + rewrites in minutes)
- **Reduces uncertainty** (explainable scores + “what to change next”)
- **Improves outcomes** (job-targeted edits + better signal density)
- **Builds trust** (explicit “facts vs suggestions” guardrails)

## Goals (production-grade)

- Reliable auth + roles + secure data handling
- Subscription-ready plans with consistent server-side enforcement
- Admin-managed pricing/content/settings without code changes
- Observability + audit logs for admin and AI operations
- Strong UX for onboarding, core flows, and upgrade prompts

## Non-goals

- Guaranteeing interviews or job offers
- Inventing experience/metrics/dates
- Replacing human recruiters
- Being a design-template marketplace (templates can exist but aren’t the core value)

## Scope definition

### MVP scope (already partially implemented)

- Auth (email/password)
- Classic resume management: upload/paste → list → versions → download → delete
- CV Builder: structured draft → save → publish to classic
- CV Pro diagnosis (role-targeted, explainable scores)

### Premium scope (must be clearly better)

- Job description match (gap analysis + tailored suggestions)
- Section rewrites (multi-tone packs)
- Higher usage limits, export packs, saved history

### Production scope (non-negotiable to charge money)

- Subscription lifecycle (trial/grace/cancel), webhooks, billing-state handling
- Admin dashboard with roles, audit logs, content/settings management
- Quotas and abuse prevention (per plan)
- Analytics + retention loop (job tracker + reminders)
- Legal/privacy and transparent AI data handling

