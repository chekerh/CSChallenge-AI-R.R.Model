# Test execution report

**Date:** 2025-03-25  
**Environment:** macOS, local MongoDB, Node via npm workspaces  
**API port:** 4011 (4000 conflict)  
**UI:** Vite dev on 5173 with `VITE_API_URL=http://127.0.0.1:4011`

## Automated

| Suite | Command | Result |
|-------|---------|--------|
| Build | `npm run build` | **Pass** |
| Lint | `npm run lint` | **Pass** |
| Server tests | `npm test` (Vitest) | **Pass** (3 tests) |
| Frontend tests | `vitest run --passWithNoTests` | **Pass** (0 files) |
| API smoke | `BASE=http://127.0.0.1:4011 npm run smoke` | **Pass** with AI step **expected failure** (no key) |

## Manual (browser automation — Cursor IDE browser)

| Flow | Steps | Expected | Actual | Verdict |
|------|-------|----------|--------|---------|
| Load app | Open `/` | Authenticated or auth UI | Logged-in state from prior token, then fresh signup | **Pass** |
| CV Pro | View default mode | Forms visible | Langue, cible, CV textarea, gated Pro sections | **Pass** |
| Classic | Click “Mode classique” | Upload + empty/right panel | Layout OK; picker visible when token present | **Pass** |
| Picker select | Choose resume with versions | Content + actions | One resume showed “no versions”; another OK | **Partial / data** |
| Builder | “Créer mon CV”, fill name | Publish enabled | Publish worked | **Pass** |
| Publish handoff | Click publish | Classic + new CV selected | Observed | **Pass** |
| Mode toggle from classic | Click “CV Pro” | Switched | **Failed** before fix (SVG intercept); **Pass** after fix + reload | **Pass** after fix |
| Logout | Déconnexion | Auth form | **Pass** |
| Signup | start journey → fill → Create | Enters app | **Pass** |

## API manual (curl)

| Call | Result |
|------|--------|
| `POST /cv/diagnosis` with JWT + body | **503** `{ "error": "AI service not configured" }` |

## Not executed

- **PDF/DOCX upload** binary through browser (file picker automation limited).
- **Full OpenAI** diagnosis/process with real key (key not verified in this run).
- **Mobile viewport** systematic check.
- **Kaggle**, **tailor**, **accept** endpoints (no primary UI).
- **Cross-browser** (Chrome-only MCP).

## Blockers during QA

- **Port 4000** wrong process → mitigated by 4011 + `VITE_API_URL`.
- **OpenAI** unset → AI features return 503; **not** treated as regression.
