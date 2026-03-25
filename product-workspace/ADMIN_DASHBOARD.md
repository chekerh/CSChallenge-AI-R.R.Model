# Admin dashboard

## Roles

- **super_admin**: full access (plans, billing overrides, settings publish)
- **admin**: manage users, content, support; limited billing actions
- **support**: read-only user lookup, reset login, view tickets; no plan edits
- **analyst**: analytics read-only
- **content_manager**: edit/publish content blocks; no user/billing access

## Core admin capabilities (minimum viable admin)

### Users
- Search users by email
- View user profile + subscription status + usage counters
- Set role (super_admin only)
- Change plan (limited; should ideally be via billing, with audit log)

### Plans & pricing content
- Edit plan names/descriptions/features displayed on pricing page
- Set plan visibility (`is_public`)
- Update quotas/limits (with validation)

### Dynamic content
- Manage:
  - Landing blocks (hero, testimonials, feature highlights)
  - Pricing table content
  - FAQ/help center content
  - Banners/announcements
- Draft + publish workflow (optional but recommended)

### Settings / feature flags
- Toggle new features safely (e.g. job tracker beta)
- Operational thresholds:
  - max upload size
  - AI max chars per request
  - rate limit presets per plan

### Analytics
- KPIs:
  - signups, activated users, DAU/WAU
  - conversion rate
  - churn
  - AI usage per plan
  - top failure reasons

### Audit logs
- Every admin write must produce an audit entry with actor, action, target, timestamp.

## Admin UX principles

- Safe defaults (no destructive actions without confirmation)
- Clear “what changed” diff on publish
- Role-based nav: users only see what they can access

