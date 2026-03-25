import { z } from 'zod';

const targetRoleZ = z.enum([
  'internship',
  'first_job',
  'freelance',
  'call_center',
  'software',
  'data_ai',
  'business_admin',
  'remote_international',
]);

const outputLangZ = z.enum(['fr', 'en', 'bilingual_guidance']);

export const cvDiagnosisBodySchema = z.object({
  text: z.string().min(1).max(48_000),
  outputLanguage: outputLangZ.optional().default('fr'),
  targetRole: targetRoleZ,
});

export const cvRewriteBodySchema = z.object({
  sectionType: z.string().min(1).max(120),
  sectionText: z.string().min(1).max(48_000),
  outputLanguage: outputLangZ.optional().default('fr'),
  targetRole: targetRoleZ,
});

export const cvJobMatchBodySchema = z.object({
  text: z.string().min(1).max(48_000),
  jobDescription: z.string().min(1).max(24_000),
  outputLanguage: outputLangZ.optional().default('fr'),
  targetRole: targetRoleZ,
});

const contactZ = z
  .object({
    fullName: z.string().max(200).optional(),
    email: z.string().max(200).optional(),
    phone: z.string().max(80).optional(),
    city: z.string().max(120).optional(),
    linkedin: z.string().max(500).optional(),
    github: z.string().max(500).optional(),
    portfolio: z.string().max(500).optional(),
  })
  .strict()
  .optional()
  .default({});

const experienceZ = z.object({
  title: z.string().max(200),
  company: z.string().max(200),
  location: z.string().max(200).optional(),
  start: z.string().max(80).optional(),
  end: z.string().max(80).optional(),
  current: z.boolean().optional(),
  bullets: z.array(z.string().max(2000)).max(25).default([]),
});

const educationZ = z.object({
  school: z.string().max(300),
  degree: z.string().max(200).optional(),
  field: z.string().max(200).optional(),
  start: z.string().max(80).optional(),
  end: z.string().max(80).optional(),
  details: z.string().max(2000).optional(),
});

const projectZ = z.object({
  name: z.string().max(200),
  description: z.string().max(4000).optional(),
  link: z.string().max(500).optional(),
  tech: z.string().max(500).optional(),
});

const languageZ = z.object({
  name: z.string().max(80),
  level: z.string().max(80).optional(),
});

const certZ = z.object({
  name: z.string().max(200),
  issuer: z.string().max(200).optional(),
  year: z.string().max(20).optional(),
});

export const cvBuilderProfileSchema = z.object({
  headline: z.string().max(500).optional(),
  summary: z.string().max(8000).optional(),
  contact: contactZ,
  experiences: z.array(experienceZ).max(20).default([]),
  education: z.array(educationZ).max(15).default([]),
  projects: z.array(projectZ).max(20).default([]),
  skillsTechnical: z.array(z.string().max(120)).max(80).default([]),
  skillsSoft: z.array(z.string().max(120)).max(40).default([]),
  languages: z.array(languageZ).max(20).default([]),
  certifications: z.array(certZ).max(30).default([]),
  extras: z.array(z.string().max(2000)).max(20).optional(),
});

export const cvBuilderDraftBodySchema = z.object({
  title: z.string().max(200).optional(),
  profile: cvBuilderProfileSchema,
});

export const cvBuilderPublishBodySchema = z.object({
  title: z.string().max(200).optional(),
  profile: cvBuilderProfileSchema,
});

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) {
    const msg = r.error.issues.map((e) => e.message).join('; ');
    throw new Error(`Validation: ${msg}`);
  }
  return r.data;
}
