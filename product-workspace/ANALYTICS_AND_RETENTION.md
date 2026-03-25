# Analytics and retention

## Product KPIs

- **Activation**: % of signups that upload/build a CV within 24h
- **First value**: % that run diagnosis (or view Top 5 fixes)
- **Conversion**: free → paid
- **Retention**: D7, D30; returning users per month
- **Usage**: diagnosis runs, rewrite runs, job matches per plan
- **Quality**: AI error rate, processing latency, upload failure rate

## Revenue KPIs

- MRR, ARPU, LTV (later)
- Churn rate
- Trial conversion rate
- Failed payment recovery rate

## Event tracking (implementation approach)

- Server emits events to DB collection `Event` (or logs pipeline later):
  - `user.signup`, `user.login`
  - `resume.upload`, `resume.process`, `resume.download`
  - `cv.diagnosis`, `cv.rewrite`, `cv.job_match`
  - `billing.checkout_started`, `billing.subscription_updated`
  - `admin.content_published`, `admin.setting_updated`
- PII redaction: never store full resume text in events.

## Retention mechanics (product)

- Job tracker module (users return to manage applications)
- Progress tracking: “score delta” after edits
- Admin-controlled campaigns (banners)
- Email reminders (phase 2): weekly summary with next actions

## Admin analytics views

- Funnel: signup → upload → diagnosis → upgrade
- Plan usage: heatmap of quotas used
- Reliability: top error codes + endpoints

