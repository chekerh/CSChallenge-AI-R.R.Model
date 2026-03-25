# Pricing and value

## Why users pay

- **Time:** Deep audit + rewrites + JD match = hours of coaching compressed.  
- **Outcome clarity:** They know *what* to fix and *why*, not generic tips.  
- **Bilingual output:** Professional FR/EN variants for Tunisia’s split market.  
- **Job-specific tailoring:** One CV → many focused versions.  
- **Trust:** Honesty layer reduces fear of “AI lying.”

## Suggested tiers

| Tier | Price anchor (TND / mo) | Includes |
|------|-------------------------|----------|
| **Free** | 0 | Top 5 issues, partial scores, one short rewrite sample |
| **Pro** | Set locally (e.g. 29–49 TND/mo or annual discount) | Full diagnosis, all score dimensions, triple-tone rewrites, FR+EN pack, job match, export text |
| **Plus** (upsell) | Higher | Multiple saved profiles, LinkedIn pack, cover letter starters, interview notes |

*Exact TND pricing requires local payment rails (Konnect, ClicToPay, etc.) and competitive research—**not set in code**.*

## Differentiation vs generic tools

- Tunisia education + market copy in prompts  
- Explainable scoring dimensions  
- No fabricated metrics  
- Job-description workflow built-in  

## Retention

- Email/WhatsApp digest: “3 fixes this week”  
- Re-run audit after edit  
- Seasonal campaigns (graduation, rentrée)  

## Upsell triggers

- User hits free char limit  
- User runs job match (paywall)  
- User requests second language full export  

## Implementation note

Until Stripe/local billing ships, use **`X-User-Plan: pro`** header (dev only) or `user.plan` in DB for gating tests.
