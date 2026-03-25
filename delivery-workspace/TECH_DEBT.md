# Technical debt

| Priority | Item | Impact |
|----------|------|--------|
| High | No E2E tests | Regressions in upload/viewer flow not caught automatically |
| High | Unused `@supabase/supabase-js` in frontend | Bloat, confusion, supply-chain noise |
| Medium | `README.md` contradicts itself (Postgres vs Mongo) | Onboarding errors |
| Medium | Legacy `server/migrations/*.sql` | Misleading for Mongo-first stack |
| Medium | Local `uploads/` directory | Not suitable for horizontal scale without shared volume/S3 |
| Medium | `node-fetch` on server | Could migrate to native `fetch` (Node 18+) and drop dep + shims |
| Low | Google OAuth / Passport packages installed but unused | Dead weight unless wired |
| Low | `shared/` package usage unclear | May duplicate types with `server/src/types.ts` |
| Low | Browserslist data outdated (build warning) | Run `npx update-browserslist-db@latest` when convenient |
| Low | npm audit findings | Schedule dependency upgrades |

## Quick wins

- Remove or document Supabase.
- Trim README to single source of truth.
- Add one Playwright happy-path test.
