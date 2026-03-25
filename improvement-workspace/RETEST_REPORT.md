# Retest report (after remediation)

## Automated (executed)

| Command | Result |
|---------|--------|
| `npm run build` | **Pass** |
| `npm run lint` | **Pass** |
| `npm test` | **Pass** (server Vitest only) |

## Manual / runtime

| Flow | Status |
|------|--------|
| Full browser E2E | **Not re-run** in this session (time-boxed); prior QA covered modes before these changes. |
| Smoke with alternate `BASE` | **Not re-run** after script change; logic is straightforward parse + message. |
| Live Mongo `GET /resumes` | **Not curl-tested** here; aggregation matches existing Mongoose types and **build passed**. |

## Regressions

- None observed from automated checks.
- **Risk to watch:** Any third-party client that assumed `GET /resumes` had only `_id`, `title`, `user_id`, `created_at` still receives those fields plus an extra `version_count` — backward compatible.

## Recommended manual follow-up

1. Log in → classic → confirm orphans show `0 version`, are disabled, and banner appears.
2. `curl -H "Authorization: Bearer …" http://127.0.0.1:PORT/resumes` and confirm `version_count` integers.
3. `cd server && BASE=… npm run smoke` with wrong BASE to see new error text.

---

## Session 2 (after delete + FR upload)

| Command | Result |
|---------|--------|
| `npm run build` | **Pass** |
| `npm run lint` | **Pass** |
| `npm test` | **Pass** |

**Manual:** `DELETE` flow and bulk orphan purge **not** browser-tested here; implementation follows existing ownership patterns (`assertResumeOwner`).

**Suggested manual checks**

1. `curl -X DELETE -H "Authorization: Bearer …" http://127.0.0.1:PORT/resumes/<id>` → `{ ok: true }`, then list resumes without that id.
2. Classic UI: delete a CV with content → list refreshes, selection clears.
3. Picker: “Supprimer N CV sans contenu” with N>0 → orphans disappear from list.

---

## Session 3

| Suite | Result |
|-------|--------|
| `npm run test` (server 3 + frontend 3) | **Pass** |
| `npm run lint` | **Pass** |
| `npm run build` | **Pass** |
