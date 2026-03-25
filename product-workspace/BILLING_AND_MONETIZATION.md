# Billing and monetization

## Pricing structure (proposal)

All pricing content is **admin-configurable** (DB-backed).

- **Free**: classic resume management + limited diagnosis preview
- **Pro**: deep diagnosis, job match, section rewrites, export packs, higher quotas
- **Plus** (optional): multiple profiles, LinkedIn pack, interview prep, priority support

## What users pay for (concrete)

- Deep diagnosis + “top actions”
- JD match (tailored bullets + keyword gaps)
- 3-tone rewrite packs (prudent/strong/premium)
- Export pack (DOCX/PDF, FR/EN)
- Higher quotas + saved history

## Monetization UX (in-app)

- Paywalls show:
  - what’s locked
  - example output snippet
  - price + trial
  - immediate CTA
- Upgrade prompts triggered by:
  - job match attempt
  - rewrite section attempt
  - export pack attempt
  - usage quota reached

## Billing lifecycle requirements

- Trial support (optional but recommended)
- Renewal
- Failed payment → grace period → restrictions
- Cancel → remains active until period end
- Refund/support workflow (admin controlled)

## Provider integration (implementation)

- Start with **Stripe** for speed.
- Add a local Tunisia payment rail later (Konnect/ClicToPay) if needed.
- Webhooks:
  - subscription created/updated/canceled
  - invoice payment succeeded/failed
  - customer updated

## Entitlement source of truth

- Server computes entitlements from:
  - `Subscription.status`
  - `Plan.limits`
  - feature flags/settings
- UI reads entitlements from `/auth/me` (or `/entitlements/me`) and renders accordingly.

