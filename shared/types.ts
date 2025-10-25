export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resume {
  _id: string;
  userId: string;
  title: string;
  text: string;
  originalContent?: string;
  fileType?: string;
  versions: ResumeVersion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeVersion {
  _id: string;
  resumeId: string;
  content: string;
  feedback?: FeedbackResult;
  createdAt: Date;
}

export interface FeedbackResult {
  score: number;
  suggestions: string[];
  improvements: {
    category: string;
    details: string[];
  }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}