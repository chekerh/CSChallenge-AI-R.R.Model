# Graph Report - source  (2026-08-09)

## Corpus Check
- Corpus is ~1,855 words - fits in a single context window. You may not need a graph.

## Summary
- 78 nodes · 97 edges · 9 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.74)
- Token cost: 4,623 input · 3,891 output

## God Nodes (most connected - your core abstractions)
1. `UtopiaHire` - 11 edges
2. `AI CV Diagnosis` - 8 edges
3. `Job Tracking` - 8 edges
4. `LinkedIn Post Generator` - 8 edges
5. `Bilingual French/English` - 7 edges
6. `Tunisian Job Seekers` - 6 edges
7. `Section Rewrite` - 5 edges
8. `ATS Rejections Are Structural Not Personal` - 5 edges
9. `Tone Samples` - 5 edges
10. `Job Match` - 4 edges

## Surprising Connections (you probably didn't know these)
- `0-100 Scoring Model` --semantically_similar_to--> `Job Match Score Distribution`  [INFERRED] [semantically similar]
  source/01-product.md → source/02-market.md
- `Market Notes` --conceptually_related_to--> `ATS Rejections Are Structural Not Personal`  [INFERRED]
  source/01-product.md → source/04-insights.md
- `French-Speaking Job Seekers` --conceptually_related_to--> `Bilingual French/English`  [INFERRED]
  source/02-market.md → source/01-product.md
- `Career Switchers` --conceptually_related_to--> `Section Rewrite`  [INFERRED]
  source/02-market.md → source/01-product.md
- `Structural Rejection Reasons` --semantically_similar_to--> `Resume Is a Filtered Document`  [INFERRED] [semantically similar]
  source/02-market.md → source/04-insights.md

## Hyperedges (group relationships)
- **ATS Structural Rejection Cluster** — market_ats_filters, market_structural_rejection_reasons, insights_ats_rejections_structural_not_personal, insights_resume_is_filtered_document [EXTRACTED 0.90]
- **Job Search Application Funnel** — market_job_search_funnel, product_job_tracking, product_stats_dashboard, insights_agents_keep_pipeline_full, market_application_funnel_metrics [EXTRACTED 0.95]
- **Subscription Monetization Philosophy** — plans_subscription_not_per_credit, plans_tnd_localized_currency, plans_free_plan_is_real_product, plans_free_plan, plans_pro_plan [EXTRACTED 0.90]

## Communities

### Community 0 - "Candidate Toolkit & Audience"
Cohesion: 0.15
Nodes (15): AI Rewrite Is Not Lying, Tunisian Candidates Pay a Double Tax, Fit Matters More Than Format, Three Tone Switches Are Enough, Career Switchers, International Job Seekers, Section Rewrite Tone Usage, Tunisian Graduates and Professionals (+7 more)

### Community 1 - "Brand Voice & Editorial Rules"
Cohesion: 0.21
Nodes (12): No Engagement-Bait Content, A Tool Cannot Get You a Job, Calm Confidence, Earned CTA, Hard Bans, Honest About Limits, LinkedIn Post Generator, One Post One Claim (+4 more)

### Community 2 - "ATS & Tailoring"
Cohesion: 0.24
Nodes (10): ATS Rejections Are Structural Not Personal, Resume Is a Filtered Document, Tailoring Should Name the Gap, ATS Filters, French-Speaking Job Seekers, Job Match Score Distribution, Recruiters, Structural Rejection Reasons (+2 more)

### Community 3 - "Job Search Funnel"
Cohesion: 0.28
Nodes (9): Agents Keep the Pipeline Full, Automation Removes Grunt Work Not Decisions, Job Search Is a Funnel, Application Funnel Metrics, Job Search Funnel, Spreadsheet Application Tracking, Job Tracking Retention, Job Tracking (+1 more)

### Community 4 - "AI Diagnosis Engine"
Cohesion: 0.25
Nodes (9): AI Value Is Diagnosis Not Text, Diagnosis Reads Like a Code Review, CV Diagnosis Completion Rate, Diagnosis-First Flow, AI CV Diagnosis, Market Notes, OpenAI gpt-4o-mini, Tech Stack Foundation (+1 more)

### Community 5 - "Payments & Security"
Cohesion: 0.29
Nodes (8): Priced in TND Not USD, Payment Data Security, TND Localized Currency, Audit Log, Stripe Billing, Candidate Data Sensitivity, JWT Authentication, TND Currency Payments

### Community 6 - "Plans & Usage Limits"
Cohesion: 0.33
Nodes (7): Diagnosis Quality Conversion Lever, Free Plan, Free Plan Is a Real Product, Pro Plan, QUOTA_EXCEEDED Error, Usage Counter, Usage Limits

### Community 7 - "Bilingual CV Craft"
Cohesion: 0.53
Nodes (6): Bilingual Is a Real Capability, French and English CVs Are Different Artifacts, Bilingual Is Not Machine Translation, Language Switching Problem, Bilingual French/English, Bilingual Content Rule

### Community 8 - "Subscription Philosophy"
Cohesion: 1.0
Nodes (2): Subscription Fits Job-Search Phase, Subscription Not Per-Credit

## Knowledge Gaps
- **26 isolated node(s):** `Admin Panel`, `Live Preview`, `Stats Dashboard`, `Audit Log`, `JWT Authentication` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Subscription Philosophy`** (2 nodes): `Subscription Fits Job-Search Phase`, `Subscription Not Per-Credit`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UtopiaHire` connect `Candidate Toolkit & Audience` to `ATS & Tailoring`, `Job Search Funnel`, `AI Diagnosis Engine`, `Payments & Security`, `Bilingual CV Craft`?**
  _High betweenness centrality (0.657) - this node is a cross-community bridge._
- **Why does `Stripe Billing` connect `Payments & Security` to `Candidate Toolkit & Audience`, `Plans & Usage Limits`?**
  _High betweenness centrality (0.313) - this node is a cross-community bridge._
- **Why does `Tone Samples` connect `Brand Voice & Editorial Rules` to `ATS & Tailoring`, `Job Search Funnel`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **What connects `Admin Panel`, `Live Preview`, `Stats Dashboard` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._