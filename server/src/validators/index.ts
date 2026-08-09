import { z } from 'zod';

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

// Resume schemas
export const createResumeSchema = z.object({
  title: z.string().max(200, 'Le titre est trop long').optional(),
  text: z.string().max(50000, 'Le contenu est trop long').optional(),
  file: z.any().optional(), // Handled by multer
});

export const processResumeSchema = z.object({
  suggestions: z.array(z.object({
    type: z.enum(['structure', 'content', 'metrics', 'keywords']),
    text: z.string(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
  })).optional(),
});

// CV Builder schemas
export const cvBuilderContactSchema = z.object({
  fullName: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  portfolio: z.string().url().optional().or(z.literal('')),
});

export const cvBuilderExperienceSchema = z.object({
  title: z.string().max(100),
  company: z.string().max(100),
  location: z.string().max(100).optional(),
  start: z.string().max(20).optional(),
  end: z.string().max(20).optional(),
  current: z.boolean().optional(),
  bullets: z.array(z.string().max(500)).optional(),
});

export const cvBuilderEducationSchema = z.object({
  school: z.string().max(150),
  degree: z.string().max(100),
  field: z.string().max(100).optional(),
  start: z.string().max(20).optional(),
  end: z.string().max(20).optional(),
  details: z.string().max(500).optional(),
});

export const cvBuilderProjectSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(500).optional(),
  url: z.string().url().optional().or(z.literal('')),
  technologies: z.array(z.string().max(50)).optional(),
});

// Job Agent schemas
export const createJobAgentSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  enabled: z.boolean().optional(),
  schedule: z.enum(['hourly', 'daily', 'weekly']).optional(),
  keywords: z.array(z.string().max(100)).optional(),
  location: z.string().max(200).optional(),
  remoteOnly: z.boolean().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
});

export const updateJobAgentSchema = createJobAgentSchema.partial();

export const createJobApplicationSchema = z.object({
  agent_id: z.string().min(1),
  company: z.string().min(1, 'L\'entreprise est requise').max(200),
  position: z.string().min(1, 'Le poste est requis').max(200),
  url: z.string().url('URL invalide'),
  status: z.enum(['saved', 'applied', 'interview', 'rejected', 'accepted']).optional(),
  match_score: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateJobApplicationSchema = z.object({
  status: z.enum(['saved', 'applied', 'interview', 'rejected', 'accepted']).optional(),
  match_score: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

// Billing schemas
export const createCheckoutSchema = z.object({
  plan_code: z.enum(['pro']),
});

// Admin schemas
export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'support', 'admin', 'super_admin']),
});

export const updatePlanSchema = z.object({
  code: z.string().min(1),
  name: z.string().optional(),
  price_monthly: z.number().min(0).optional(),
  features: z.array(z.string()).optional(),
  limits: z.record(z.number()).optional(),
});

export const createContentBlockSchema = z.object({
  key: z.string().min(1).max(50),
  title: z.string().max(200),
  content: z.string(),
  status: z.enum(['draft', 'published']).optional(),
});

// Helper function to validate request body
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({ 
          error: 'Validation failed',
          details: errors 
        });
      } else {
        res.status(400).json({ error: 'Invalid request body' });
      }
    }
  };
}