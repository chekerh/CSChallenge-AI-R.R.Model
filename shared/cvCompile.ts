import type { CvBuilderProfile } from './cvBuilderTypes';

/** Plain-text CV from structured builder (FR headings; suitable for EN content too). */
export function compileProfileToPlainText(p: CvBuilderProfile): string {
  const lines: string[] = [];
  const c = p.contact || {};
  if (c.fullName) lines.push(c.fullName);
  const contactBits: string[] = [];
  if (c.email) contactBits.push(c.email);
  if (c.phone) contactBits.push(c.phone);
  if (c.city) contactBits.push(c.city);
  if (contactBits.length) lines.push(contactBits.join(' · '));
  const links: string[] = [];
  if (c.linkedin) links.push(`LinkedIn: ${c.linkedin}`);
  if (c.github) links.push(`GitHub: ${c.github}`);
  if (c.portfolio) links.push(`Portfolio: ${c.portfolio}`);
  if (links.length) lines.push(links.join(' | '));
  lines.push('');

  if (p.headline) {
    lines.push(p.headline);
    lines.push('');
  }
  if (p.summary) {
    lines.push('PROFIL / RÉSUMÉ');
    lines.push(p.summary);
    lines.push('');
  }

  if (p.experiences?.length) {
    lines.push('EXPÉRIENCE PROFESSIONNELLE');
    for (const ex of p.experiences) {
      const dates = [ex.start, ex.end].filter(Boolean).join(' – ');
      const head = [ex.title, ex.company].filter(Boolean).join(' — ');
      lines.push(head);
      if (ex.location) lines.push(ex.location);
      if (dates) lines.push(dates);
      for (const b of ex.bullets || []) {
        if (b.trim()) lines.push(`• ${b.trim()}`);
      }
      lines.push('');
    }
  }

  if (p.education?.length) {
    lines.push('FORMATION');
    for (const ed of p.education) {
      const head = [ed.degree, ed.field].filter(Boolean).join(', ');
      lines.push([ed.school, head].filter(Boolean).join(' — '));
      const dates = [ed.start, ed.end].filter(Boolean).join(' – ');
      if (dates) lines.push(dates);
      if (ed.details) lines.push(ed.details);
      lines.push('');
    }
  }

  if (p.projects?.length) {
    lines.push('PROJETS');
    for (const pr of p.projects) {
      lines.push(pr.name + (pr.link ? ` (${pr.link})` : ''));
      if (pr.tech) lines.push(`Stack: ${pr.tech}`);
      if (pr.description) lines.push(pr.description);
      lines.push('');
    }
  }

  if (p.skillsTechnical?.length) {
    lines.push('COMPÉTENCES TECHNIQUES');
    lines.push(p.skillsTechnical.filter(Boolean).join(', '));
    lines.push('');
  }
  if (p.skillsSoft?.length) {
    lines.push('SOFT SKILLS');
    lines.push(p.skillsSoft.filter(Boolean).join(', '));
    lines.push('');
  }
  if (p.languages?.length) {
    lines.push('LANGUES');
    for (const l of p.languages) {
      lines.push(`${l.name}${l.level ? ` — ${l.level}` : ''}`);
    }
    lines.push('');
  }
  if (p.certifications?.length) {
    lines.push('CERTIFICATIONS');
    for (const cert of p.certifications) {
      lines.push([cert.name, cert.issuer, cert.year].filter(Boolean).join(' — '));
    }
    lines.push('');
  }
  if (p.extras?.length) {
    lines.push('AUTRES');
    for (const x of p.extras) {
      if (x.trim()) lines.push(x.trim());
    }
  }

  return lines.join('\n').trim();
}
