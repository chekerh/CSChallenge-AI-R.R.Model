# Bug report (validation session)

| ID | Severity | Summary | Reproduction | Root cause | Status |
|----|----------|---------|--------------|------------|--------|
| B1 | **High** (dev) | API cannot bind after `ts-node-dev` file save — `EADDRINUSE` | Edit `server/src/*.ts` while dev server running | Child process not released on restart | **Fixed** — `ts-node-dev --exit-child` in `server/package.json` |
| B2 | **High** (UX) | “start your journey” / auth controls not clickable | Open login page, click link under heading | `AssistantCharacter` used `fixed z-50` without `pointer-events-none`, images stacked above form | **Fixed** — `interactive={false}` + form `z-10` |
| B3 | **Medium** | After upload, if AI fails, right panel stayed “No Resume Selected” | Upload with empty `OPENAI_API_KEY` | `onUploaded` only after successful process | **Fixed** — `onUploaded` after upload; soft error for AI |
| B4 | **Medium** | Smoke test always failed signup | `node server/scripts/smokeTest.js` | Email `@local` rejected by regex; password `secret` &lt; 8 chars | **Fixed** — regex + smoke credentials |
| B5 | **Low** (env) | Default port 4000 not available on host | `npm run dev` in `server/` | Other `node` process (PID 53833) listening | **Not fixed** (environmental) — use `PORT` or free port |
| B6 | **Info** | `curl :4000/health` not JSON | Request health on occupied 4000 | Different application on port | **N/A** — not UtopiaHire |

## Needs verification

- **B1 fix** under rapid file churn on Windows/Linux (only verified via config change + lint/build).
- **PDF upload** extraction and large-file limit (10MB) — not browser-tested here.
