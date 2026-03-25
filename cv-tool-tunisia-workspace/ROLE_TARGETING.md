# Role targeting specification

## Enum: `CvTargetRole`

| id | Label (EN) | Emphasis |
|----|------------|----------|
| `internship` | Internship | Education, projects, eagerness to learn, availability |
| `first_job` | First job | Transferable skills, internships, concrete tasks |
| `freelance` | Freelance profile | Services, stack/tools, portfolio, rates optional (user-only) |
| `call_center` | Call center / support | Languages + honest levels, customer service, resilience |
| `software` | Software engineering | Stack, repos, delivery, team—no fake shipped features |
| `data_ai` | Data / AI | Data stack, projects, responsible use of “ML” claims |
| `business_admin` | Business / admin / finance | Organization, tools (Excel, ERP), process |
| `remote_international` | Remote / international | English-forward, async collaboration, impact bullets |

## Tailoring mechanics

1. **Prompt injection** — `targetRole` selects a short “recruiter lens” paragraph in the system prompt.  
2. **Scoring weights** — `relevance` and `keyword_alignment` use role-specific keyword hints (heuristic lists in prompt, not rigid ATS).  
3. **Section order hints** — e.g. freelance: summary + services + projects before long education.  
4. **Language register** — call center: clear and friendly; software: precise and concise.

## Same profile, different targets

- Store **one** structured source profile (future); generate **derived** drafts per target without mutating facts.  
- UI: “duplicate for another target” (premium).

## Implementation

- `targetRole` passed to `/cv/diagnosis`, `/cv/rewrite-section`, `/cv/job-match`.  
- Validated server-side against allowlist.
