# Dynamic content and settings

## Why this exists

To operate as a paid product, UtopiaHire must let non-engineering operators update:

- pricing cards and plan copy
- landing page content blocks
- FAQ/help center
- banners/announcements
- feature flags and quota knobs

…without redeploying.

## What is configurable (admin-editable)

### Content blocks (CMS-like)

- Landing hero (headline, subheadline, CTA labels)
- Feature highlights (cards)
- Testimonials (list)
- Pricing table copy (plan names, bullets, “most popular” badge)
- FAQ entries
- Support/help articles
- Announcement banners (targeted by plan)

### Settings (operational)

- Upload limits (size, allowed types)
- AI limits (max chars per plan, model selection policy)
- Rate limit presets (per plan)
- Feature flags (job tracker beta, export pack enablement)
- Trial enablement + duration (if business wants it)

## What is NOT configurable

- Auth/security invariants (JWT signing, password policy enforcement)
- Billing provider secrets
- RBAC rules logic
- Core data access control rules

## Schemas and validation

- Each `AdminSetting` has:
  - type (`string|number|boolean|json`)
  - validation metadata (min/max/enum)
  - update audit log
- Each `ContentBlock` has:
  - a typed JSON schema (per block key)
  - status (`draft|published`)
  - updated_by and timestamps

## Publishing workflow (recommended)

- Edit draft → preview → publish
- Publish action writes to audit log
- Rollback supported by storing previous published version (simple history)

