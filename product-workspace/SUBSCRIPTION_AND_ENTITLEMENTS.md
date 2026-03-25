# Subscription and entitlements

## Plan definitions (initial)

### Free
- Classic resumes: upload/list/versions/download/delete
- CV Pro diagnosis: limited preview (truncate or subset of dimensions)
- Quotas: low

### Pro (paid)
- Full diagnosis (all dimensions + findings)
- Job match
- Rewrite section (3 tones)
- Export packs (DOCX/PDF/FR+EN)
- Higher quotas

### Plus (optional future)
- Multiple “profiles” (e.g. career tracks)
- LinkedIn pack
- Interview prep module
- Priority support

## Entitlement model

### Feature keys (examples)

- `cv.diagnosis.full`
- `cv.job_match`
- `cv.rewrite_section`
- `export.docx`
- `export.pdf`
- `jobs.tracker`

### Quota keys (examples)

- `quota.cv_diagnosis_runs_per_month`
- `quota.cv_rewrite_sections_per_month`
- `quota.cv_job_matches_per_month`

## Enforcement rules

- **Always server-side**: every premium endpoint checks:
  - subscription status
  - feature entitlement
  - quota availability
- UI gating is convenience only.

## Upgrade/downgrade rules

- Upgrade: immediate entitlement increase.
- Cancel: remain paid until period end, then downgrade.
- Past due: allow access during grace period, then restrict premium features.

## Trial rules (if enabled)

- Trial starts on first upgrade.
- Trial has Pro entitlements but lower quotas (optional).
- Trial ends → active (if paid) or restricted (if not).

