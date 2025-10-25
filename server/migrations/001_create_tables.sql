-- users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  provider TEXT,
  provider_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- resume_versions table (versioning)
CREATE TABLE IF NOT EXISTS resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  content_text TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_version_id UUID REFERENCES resume_versions(id) ON DELETE CASCADE,
  author TEXT,
  suggestions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
