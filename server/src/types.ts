export type User = {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
};

export type Resume = {
  id: string;
  user_id: string;
  title?: string;
  created_at?: string;
};

export type ResumeVersion = {
  id: string;
  resume_id: string;
  version_label: string; // original, improved, final
  content_text: string;
  storage_path?: string;
  created_at?: string;
};

export type Feedback = {
  id: string;
  resume_version_id: string;
  author?: string; // AI or user
  suggestions: string; // JSON stringified structured suggestions
  created_at?: string;
};
