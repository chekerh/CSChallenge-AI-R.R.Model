# Value roadmap — make it worth paying for

## Product goal

Turn “CV rewrite” into a **job-winning workflow**: diagnosis → targeted edits → export → apply → track → iterate.

## What already differentiates (keep)

- **Tunisia-first prompts**: education labels, bilingual strategy, local + international positioning.
- **Explainable scoring** (not fake ATS).
- **Honesty guardrails** (don’t invent experience/metrics).
- **Two modes**: classic upload + structured builder + Pro studio.

## Missing to justify a monthly price (prioritized)

### 1) In-app pricing + upgrade path (must-have for revenue)

- Pricing page with clear outcomes + examples (FR/EN).
- Upgrade button in user bar + Pro feature teasers (locked sections show what you’d get).
- Plan-based quotas: diagnosis runs/day, rewrite tokens, JD matches/week.
- Billing integration (start with Stripe, then Tunisia-local rails).

### 2) Exports recruiters actually want

- DOCX export (ATS-friendly) with 2–3 clean templates.
- PDF export (same templates) with correct typography and spacing.
- “FR + EN pack” export (two files + naming).

### 3) Job application workflow (retention driver)

- Job tracker: company, role, link, status, notes, deadlines.
- Attach a CV version + cover letter per job.
- “Tailor to this job” generates: bullets, keywords, and a short cover letter draft.
- Reminder loop: weekly “apply next” and “fix next”.

### 4) Tunisia trust-builders (why this app vs generic)

- Diploma phrasing helper: “Licence/Mastère/Ingénieur” → FR/EN equivalents, EU-friendly wording.
- Call-center / support playbook: metrics users can *truthfully* add (tickets/day, CSAT, SLA).
- Arabic UI toggle + Arabic name/address formatting rules (optional output language later).
- Sector presets: call center, business/admin, junior software, data.

### 5) Proof + coaching style UX

- Before/after with “why this changed” annotations.
- “Recruiter lens” toggles: what a recruiter scans in 10 seconds; highlight missing signals.
- Consistency checks: dates, titles, skill claims vs experience bullets.

## Engineering plan (90-day)

- **Week 1–2**: pricing page + upgrade hooks + plan quotas in `/cv/*` routes.
- **Week 3–4**: DOCX export (server-side template) + downloadable pack.
- **Month 2**: job tracker + job-tailor endpoint + cover letter draft.
- **Month 3**: Tunisia localization modules + Arabic UI + retention notifications.

