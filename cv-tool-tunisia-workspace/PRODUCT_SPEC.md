# Product specification — Tunisia-first CV optimization platform

## Vision

A **paid, premium CV improvement platform** for Tunisia that delivers **deep diagnosis**, **honest rewrites**, **role-aware tailoring**, and **French/English workflows**—not a template toy or fake ATS score.

## Target users (primary)

- Students, recent graduates, internship seekers in Tunisia  
- Juniors applying locally (call centers, business, admin, finance, marketing) and internationally (tech, remote)  
- Career changers needing clearer positioning  
- Users who need **strong French and/or English** CVs without awkward literal translation  

## Value proposition (why pay)

| Free tier | Paid tier |
|-----------|-----------|
| Shallow scan + top 5 issues + sample rewrite teaser | Full section-by-section audit + score dimensions explained |
| One language preview | Full FR/EN rewrites + bilingual strategy notes |
| — | Job-description match + gap analysis + tailored CV draft |
| — | Conservative / strong / premium tone packs |
| — | Export-ready text, action plan, LinkedIn headline starters |
| — | Tunisia education labeling guidance baked into prompts |

## Non-goals

- Inventing degrees, employers, dates, or metrics not present in user input  
- A single opaque “ATS 87%” badge without explainability  
- Purely visual templates without strategic content improvement  
- Replacing human recruiters or guaranteeing interviews  

## Feature scope (modules)

1. **Intake** — PDF, DOCX, paste, optional structured fields (phased)  
2. **Structured profile** — normalized sections (MVP: heuristic + AI-assisted structure from text)  
3. **Diagnosis engine** — multi-dimension audit with “what / why / how” per finding  
4. **Tunisia localization** — licence, mastère, ingénieur, baccalauréat, language levels, local vs international framing  
5. **Rewrite engine** — section-level, tone variants, honesty guardrails  
6. **Role targeting** — internship, first job, freelance, call center, software, data, business, remote intl.  
7. **Meaningful scoring** — dimensions with explanations, not a black box  
8. **Job match** — paste JD, gap/strength map, tailored wording suggestions  
9. **Outputs** — improved text, before/after, exports (DOCX/PDF later), FR/EN versions  
10. **Trust layer** — label user facts vs AI suggestions vs inferences; exaggeration warnings  

## Monetization logic (product)

- **Free:** drives trust; limited depth; watermarked or truncated premium sections acceptable.  
- **Paid:** full JSON payloads, all tones, job match, bilingual pack, exports.  
- **Upsell:** multiple profiles, interview prep, freelancer bio, portfolio blurbs.  

*Technical gating (Stripe, quotas) is planned in architecture; MVP may use env/feature flag until billing is wired.*

## Success metrics (qualitative bar)

Users say: they **understand weaknesses**, know **what to change**, have **recruiter-usable** FR/EN text, and **saved hours** vs doing it alone.

## Brand note (codebase)

Current repo ships as **UtopiaHire**; product direction aligns with **CV Pro Tunisia** positioning documented here. UI may show dual branding until rename.
