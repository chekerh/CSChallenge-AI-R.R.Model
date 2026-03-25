# Data model

## Conventions

- All entities have: `_id`, `created_at`, optional `updated_at`
- Sensitive operations create `AuditLog` entries.
- Plan enforcement uses `Subscription` + `Entitlements` + `UsageCounter`.

## Entities (existing)

### User (existing)
- `email` (unique)
- `name`
- `password_hash`
- `plan` (`free` | `pro`) **(existing; will evolve)**
- `created_at`

### Resume (existing)
- `user_id`
- `title`
- `created_at`

### ResumeVersion (existing)
- `resume_id`
- `version_label` (`original` | `improved` | `final` | ...)
- `content_text`
- `created_at`

### Feedback (existing)
- `resume_version_id`
- `author` (`ai` | `user`)
- `suggestions` (JSON blob)
- `created_at`

## Entities (to add for paid product)

### Subscription
- `user_id`
- `provider` (`stripe` | `konnect` | ...)
- `provider_customer_id`
- `provider_subscription_id`
- `status` (`trialing` | `active` | `past_due` | `canceled` | `incomplete`)
- `plan_id` (internal Plan)
- `current_period_start`, `current_period_end`
- `cancel_at_period_end` (bool)
- `created_at`, `updated_at`

### Plan
- `code` (`free` | `pro` | `plus`)
- `name` (dynamic, admin-editable)
- `price` (amount + currency)
- `features` (list)
- `limits` (quota object)
- `is_public` (bool)
- `sort_order`

### Entitlement
Computed or stored snapshot:
- `user_id`
- `plan_code`
- `features` (set)
- `limits` (quota object)
- `computed_at`

### UsageCounter
- `user_id`
- `period_key` (e.g. `2026-03` or billing period id)
- `counters` (map: `cv_diagnosis_runs`, `cv_rewrites`, `job_matches`, `resume_process_runs`)

### AdminSetting
- `key` (unique)
- `type` (`string` | `number` | `boolean` | `json`)
- `value` (typed)
- `validation` (schema metadata)
- `updated_by` (admin user id)
- `updated_at`

### ContentBlock
- `key` (unique; e.g. `landing.hero`, `pricing.table`, `help.faq`)
- `status` (`draft` | `published`)
- `content` (JSON)
- `updated_by`, `updated_at`

### AuditLog
- `actor_user_id`
- `actor_role`
- `action` (e.g. `admin.update_plan`, `admin.publish_content`)
- `target_type`, `target_id`
- `metadata` (JSON; redacted)
- `ip`, `user_agent`
- `created_at`

### SupportTicket (optional)
- `user_id`
- `subject`
- `message`
- `status` (`open` | `in_progress` | `resolved`)
- `created_at`, `updated_at`

