# Scoring engine specification

## Principles

- **No fake ATS score.** Each dimension is **0–100** or **1–5** with a **plain-language explanation** and **next action**.  
- Scores are **relative to the text provided** and **target role**, not universal truth.  
- When data is missing, score **“insufficient data”** rather than guessing.

## Dimensions (v1)

| Dimension | What we measure | User-facing explanation |
|-----------|-----------------|-------------------------|
| **clarity** | Obvious structure, headings, scan-ability | “Can a recruiter skim this in 30 seconds?” |
| **professionalism** | Tone, formatting cues in text, consistency | “Does this read like a serious candidate?” |
| **relevance** | Fit to stated `targetRole` | “How aligned is content with the role you chose?” |
| **impact** | Use of outcomes, scope (honest) | “Do bullets show scope/results you actually stated?” |
| **keyword_alignment** | Role-relevant terms vs generic filler | “Keywords vs buzzwords.” |
| **completeness** | Presence of key sections / obvious gaps | “What’s missing that recruiters expect?” |
| **consistency** | Dates, tense, duplicate bullets | “Contradictions or repetition.” |
| **language_quality** | FR/EN grammar and register for chosen output | “Language polish for your target market.” |
| **structure** | Section order, length balance | “Information architecture.” |
| **readability** | Sentence length, density | “Ease of reading.” |
| **market_fit** | Tunisia local vs international appropriateness | “Framing for local boards vs abroad.” |
| **credibility** | Red flags: vague superlatives without proof | “Sounds verifiable vs inflated.” |

## Transparency

Each dimension returns:

```json
{
  "dimension": "impact",
  "score": 52,
  "summary": "…",
  "evidence": ["quote or paraphrase from CV"],
  "improvements": ["actionable step 1", "…"]
}
```

## Anti-gaming

- Do not reward **keyword stuffing**; `keyword_alignment` penalizes irrelevant lists.  
- Down-rank **unsubstantiated superlatives** in `credibility`.

## Implementation

- Produced inside **`diagnosis`** OpenAI JSON schema (see `server/src/cv/engine.ts`).  
- Parser validates presence of fields; missing → safe defaults in API layer.
