# Tunisia market fit

## Why Tunisia-first matters

- **Bilingual reality:** Many roles require **French**; tech and international paths need **English**; code-switching and mixed-language drafts are common.  
- **Education labels:** Tunisian paths (baccalauréat, licence, mastère professionnel/recherche, diplôme d’ingénieur, BTS equivalents referenced in guidance) must be presented clearly for **local recruiters** and **foreign HR** who do not know the system.  
- **Local job boards vs international:** Tone, length, and “signal” differ—call center applications emphasize availability and languages; engineering emphasizes projects and stack.  
- **Trust:** Users fear **AI lying** or sounding **generic**. The product must default to **honest, proof-based** language and **transparent** labeling of suggestions.

## User segments

| Segment | Pain | Product angle |
|---------|------|----------------|
| Student / intern | No experience framing | Projects, volunteering, coursework as evidence; internship targeting |
| Call center / support | Skills vs fluff | Languages (with honest levels), soft skills, shift availability—without fabrication |
| Junior dev | Weak project descriptions | Impact, stack, links—no invented shipped features |
| Business / admin | Generic bullets | Quantify only when user provides numbers; otherwise specificity of scope |
| Gulf / France / remote | Format + translation | FR/EN versions + “do not translate literally” guidance |

## Language strategy

- **Input:** Arabic script or Darija in free text → model **understands** but **outputs** professional FR/EN unless user chooses Arabic output (future).  
- **Output languages:** `fr`, `en`, `bilingual_notes` (explain when to send which).  
- **Levels:** Use CEFR-style labels when user provides them; otherwise encourage self-assessment honesty.

## Local education presentation (in prompts)

- Map common Tunisian credentials to **French CV conventions** and **English equivalents** *as guidance*, not automatic rewriting of facts.  
- Never invent institution names, honors, or years.

## Recruiter expectations (heuristic)

- **Local SME / services:** 1–2 pages, clear contact, languages, availability, photo norm varies—product notes photo as optional/cultural.  
- **International / ATS:** simpler layout, keyword alignment, fewer graphics in export (export engine phase).

## Adaptation: local vs international

- Same profile → **emphasis** changes: local may foreground languages and immediate availability; international foregrounds impact bullets and standard section titles in EN.

*All market claims in prompts are **assistant knowledge**; validation with Tunisian hiring partners is an **outstanding** research task.*
