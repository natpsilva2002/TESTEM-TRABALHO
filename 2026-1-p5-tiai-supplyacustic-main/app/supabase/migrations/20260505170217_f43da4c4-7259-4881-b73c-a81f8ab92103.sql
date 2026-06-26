ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS custom_furniture jsonb NOT NULL DEFAULT '[]'::jsonb;