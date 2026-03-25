# Admin and operations

## Admin tool principles

- Least privilege: roles see only what they need.
- Audit everything sensitive.
- Prefer reversible changes (draft/publish and rollback).

## Operational workflows

### Content and pricing updates
- Edit draft in admin → preview → publish.
- Audit log entry includes block key and diff summary.

### Plan/quota updates
- Update `Plan.limits` via admin.
- Changes apply next billing period by default (configurable).

### Support workflows
- Search user, view subscription + usage + recent errors.
- Provide “safe actions”: reset plan (admin), revoke sessions (future), resend receipts (billing).

### Incident management
- Add banner (admin) for outages.
- Disable AI endpoints (feature flag) if provider down.
- Track incident in `ACTIONS_LOG.md` and ensure postmortem notes exist.

## Backups and recovery

- Mongo backups (Atlas) with tested restore procedure.
- Documented “how to restore” runbook (future).

# Admin and operations

## Operational workflows

### Plan/pricing updates
- Edit `Plan` and `ContentBlock(pricing)` in admin
- Preview changes
- Publish with audit log

### Feature rollout
- Enable feature flag for a cohort (phase 2)
- Monitor error rate and usage
- Roll back by disabling flag

### Support workflow
- User lookup by email
- View subscription state + recent errors + usage counters
- Reset password flow (future) / account help
- Escalate suspected abuse to admin

### Incident response basics
- Identify outage scope from health + logs
- Communicate via admin banner
- Roll back release or disable AI endpoints if provider down
- Postmortem entry in `ACTIONS_LOG.md`

## Data retention and privacy

- Resume text is sensitive:
  - limit access by role
  - redact from logs/events
- Provide user deletion flow (GDPR-like) later if needed

## Backups

- Managed Mongo backups
- Test restore procedure quarterly (process document)

