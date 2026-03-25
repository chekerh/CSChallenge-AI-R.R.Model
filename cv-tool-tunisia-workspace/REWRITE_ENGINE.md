# Rewrite engine specification

## Goals

- **Section-by-section** improvement (summary, experience bullets, projects, education blurbs, skills).  
- **Three tones:** `conservative` (minimal change), `strong` (clear upgrade), `premium` (executive polish—still honest).  
- **Never invent facts.** Only reorganize, clarify, and strengthen **user-supplied** content.

## Anti-hallucination rules (enforced in system prompt)

1. Do not add employers, job titles, dates, metrics, degrees, or certifications not present in input.  
2. If the user implies a metric without a number, **do not invent a number**—use placeholders like “[quantify if you have a figure]” or ask for clarification in `notes_for_user`.  
3. Label outputs: `user_facts_preserved`, `ai_suggested_wording`, `inferred_from_context` (only for obvious typos/format fixes).  
4. If a bullet is too vague to rewrite safely, return `needs_user_input: true` with specific questions.

## Section strategies

| Section | Approach |
|---------|----------|
| Headline | Role + 1 value hook from stated skills/experience |
| Summary | 3–4 lines, outcome-oriented, no new employers |
| Experience | STAR-lite where user gave situation; else scope clarity |
| Projects | Tech + outcome from user data; link placeholders preserved |
| Education | Correct Tunisian→FR/EN labeling suggestions without changing facts |
| Skills | Group + prioritize by target role; drop fluff |

## Output shape (per section)

```json
{
  "section": "experience",
  "original": "…",
  "rewritten_conservative": "…",
  "rewritten_strong": "…",
  "rewritten_premium": "…",
  "changes_explained": ["…"],
  "honesty_flags": ["…"]
}
```

## API

- `POST /cv/rewrite-section` with `{ sectionType, text, tone?, outputLanguage, targetRole }`.  
- **Paid gate** (future): full triple tone only for `pro`.

## Quality tests

- Golden files: anonymized Tunisian CVs; human review for “sounds natural in FR/EN.”  
- Regression: prompts must not emit fabricated company names in fixture runs.
