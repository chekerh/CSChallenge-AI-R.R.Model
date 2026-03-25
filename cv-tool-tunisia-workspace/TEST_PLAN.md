# Test plan — CV Pro Tunisia

## Parser / intake

| ID | Case | Expected |
|----|------|----------|
| P1 | Paste plain text CV | Diagnosis returns sections_detected |
| P2 | Empty text | 400 `text required` |
| P3 | Very long text (>40k chars) | 413 or truncate with message (future) |

## Scoring / diagnosis

| ID | Case | Expected |
|----|------|----------|
| D1 | Junior student CV | Low impact/completeness scores with explained gaps |
| D2 | Strong experienced CV | High scores with nuanced improvements |
| D3 | Tunisian education terms | market_fit + education guidance mentions local context |
| D4 | targetRole = call_center | relevance emphasizes languages/service |

## Rewrite

| ID | Case | Expected |
|----|------|----------|
| R1 | Experience bullet rewrite | No new company names in output |
| R2 | tone conservative vs premium | Observable tone shift, same facts |
| R3 | User bullet with no metrics | No invented numbers |

## Job match

| ID | Case | Expected |
|----|------|----------|
| J1 | JD + CV | gaps, strengths, apply_recommendation |
| J2 | Empty JD | 400 |

## Localization

| L1 | outputLanguage `fr` | French UI strings optional; JSON content French |
| L2 | outputLanguage `en` | English content |

## API / auth

| A1 | No JWT on `/cv/diagnosis` | 401 |
| A2 | Valid JWT | 200 |

## UX

| U1 | Mode switch Classic ↔ CV Pro | State resets or preserves per product decision (currently full page modes) |
| U2 | Loading / error states | User sees error from API |

## Billing (future)

| B1 | Free tier truncation | Only `top_fixes` returned |
| B2 | Pro tier | Full payload |

## Automation recommendation

- Vitest: allowlist validation on `targetRole`  
- Contract tests: JSON schema snapshot for diagnosis (optional zod)  
- Manual: 5 anonymized Tunisian CVs reviewed by native FR/EN speaker  
