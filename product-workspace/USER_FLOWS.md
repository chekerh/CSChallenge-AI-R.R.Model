# User flows

## Onboarding flow

1. Landing (value + trust + pricing preview)
2. Sign up (email/password)
3. Quick start choice:
   - Upload CV (classic)
   - Build CV (builder)
4. First outcome:
   - “Top 5 fixes” (free) or “deep diagnosis” (trial/pro)
5. Save/export + next step prompt (apply workflow)

## Classic CV flow (upload / paste)

1. Upload PDF/DOCX/TXT or paste text
2. System creates resume + `original` version
3. User can:
   - View versions
   - Download text
   - Trigger AI processing (creates improved version)
   - Delete resume

## Builder flow (structured)

1. Fill profile blocks
2. Save draft
3. Preview text
4. Publish → creates a classic resume entry
5. Optional: send to CV Pro analysis

## CV Pro flow (paid value)

1. Choose output language + target role
2. Paste CV text
3. Run diagnosis → get scores + top actions + findings
4. (Pro) Add job description → job match + tailored wording
5. (Pro) Rewrite section → tone packs
6. Export pack (DOCX/PDF, FR/EN)

## Upgrade flow

1. User hits paywall (job match / rewrite / export pack)
2. Upgrade prompt shows:
   - What they get right now
   - Example before/after
   - Price + trial terms
3. Checkout
4. Post-checkout: entitlement refresh + success screen

## Billing flow

- Trial start → active → renewal
- Failed payment → grace period → restricted mode
- Cancel → remains active until period end → downgrades to free with history retained

## Support flow

- Help center + FAQ
- “Report an issue” with context (screen, last request id)
- Support can view account + recent errors and assist without seeing full resume text (redaction controls)

## Admin/operator flow

- Admin login (role-protected)
- Manage:
  - Users + plan state
  - Plans/pricing content
  - Feature flags + quotas
  - Help center content
  - Announcements/banners
  - Metrics dashboard
  - Audit log + incident view

