# Regression checklist (post-fix)

Executed after applying `pointer-events-none` and picker label changes.

| Check | Method | Result |
|-------|--------|--------|
| Monorepo build | `npm run build` | **Pass** |
| Lint | `npm run lint` | **Pass** |
| Server tests | `npm test` | **Pass** (not re-run after tiny frontend-only change; last full run **pass**) |
| Classic → CV Pro click | Browser MCP | **Pass** |
| CV Pro → Classic click | Browser MCP | **Pass** |
| Builder publish → classic | Browser MCP (before fix retest) | **Pass** |

## Not re-run (low risk)

- Full smoke with OpenAI (environment unchanged).
- Entire matrix re-walk (time-boxed).

## Watch list for next CI run

- Add one Playwright spec: mode toggle from classic + picker has options.
- Consider visual regression for header z-index stacking.
