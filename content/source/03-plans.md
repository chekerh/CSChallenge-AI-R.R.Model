# UtopiaHire — Plans & Monetization

## Plans

- Free plan: core features with usage limits; enough to diagnose and improve one CV and see the value.
- Pro plan: paid via Stripe, priced in TND for Tunisian users, unlocks higher AI usage limits and the full automation toolkit.

## Usage limits (how Free vs Pro is enforced)

- Usage is tracked per user per period through a usage counter with a unique compound index (user_id + period_key).
- The AI diagnosis, rewrite, and match features consume quota; exceeding it returns a QUOTA_EXCEEDED / UPGRADE_REQUIRED error so the user knows exactly why they hit the wall.

## Pricing philosophy

- Subscription, not per-credit: a candidate in an active search uses the tool intensely for weeks, then pauses. Subscriptions fit that rhythm better than metered credits.
- Localized currency (TND) removes the payment friction Tunisian users feel with USD-priced SaaS.
- The free plan is a real product, not a demo: it must produce one full diagnosis so the user can judge quality before paying.

## Strategic notes

- Conversion lever is quality of the diagnosis, not feature gating — a great free diagnosis sells the Pro plan.
- Retention comes from the job tracking pipeline (agents + applications + stats), which gives users a reason to keep coming back between interviews.
- Payment data is sensitive: Stripe customer IDs are stored with select: false, webhooks verify signatures, and billing events are audited.
