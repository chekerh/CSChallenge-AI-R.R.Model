/**
 * Structured CV data for the in-app CV creator (Tunisia / bilingual friendly).
 */

export interface CvBuilderContact {
  fullName?: string;
  email?: string;
  phone?: string;
  city?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface CvBuilderExperience {
  title: string;
  company: string;
  location?: string;
  start?: string;
  end?: string;
  current?: boolean;
  bullets: string[];
}

export interface CvBuilderEducation {
  school: string;
  degree?: string;
  field?: string;
  start?: string;
  end?: string;
  details?: string;
}

export interface CvBuilderProject {
  name: string;
  description?: string;
  link?: string;
  tech?: string;
}

export interface CvBuilderLanguage {
  name: string;
  level?: string;
}

export interface CvBuilderCertification {
  name: string;
  issuer?: string;
  year?: string;
}

export interface CvBuilderProfile {
  headline?: string;
  summary?: string;
  contact: CvBuilderContact;
  experiences: CvBuilderExperience[];
  education: CvBuilderEducation[];
  projects: CvBuilderProject[];
  skillsTechnical: string[];
  skillsSoft: string[];
  languages: CvBuilderLanguage[];
  certifications: CvBuilderCertification[];
  extras?: string[];
}

export const emptyCvBuilderProfile = (): CvBuilderProfile => ({
  contact: {},
  experiences: [],
  education: [],
  projects: [],
  skillsTechnical: [],
  skillsSoft: [],
  languages: [],
  certifications: [],
  extras: [],
});
