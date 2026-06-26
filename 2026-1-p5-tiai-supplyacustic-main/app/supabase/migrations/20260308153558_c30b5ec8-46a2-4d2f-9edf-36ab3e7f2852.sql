
-- ============================================================
-- AcustiAI - Complete Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE (credits system)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  daily_credits INTEGER NOT NULL DEFAULT 5,
  last_refill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. MATERIALS TABLE (acoustic materials bank)
-- ============================================================
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  -- Absorption coefficients per frequency (Hz)
  absorption_125hz DECIMAL(4,3) NOT NULL DEFAULT 0,
  absorption_250hz DECIMAL(4,3) NOT NULL DEFAULT 0,
  absorption_500hz DECIMAL(4,3) NOT NULL DEFAULT 0,
  absorption_1000hz DECIMAL(4,3) NOT NULL DEFAULT 0,
  absorption_2000hz DECIMAL(4,3) NOT NULL DEFAULT 0,
  absorption_4000hz DECIMAL(4,3) NOT NULL DEFAULT 0,
  -- Noise Reduction Coefficient (average of 250,500,1000,2000 Hz)
  nrc DECIMAL(4,3) NOT NULL DEFAULT 0,
  density_kg_m3 DECIMAL(8,2),
  thickness_mm DECIMAL(6,1),
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materials are viewable by all authenticated users" ON public.materials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert custom materials" ON public.materials
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
CREATE POLICY "Users can update their own custom materials" ON public.materials
  FOR UPDATE USING (auth.uid() = created_by);

-- ============================================================
-- 3. PROJECTS TABLE
-- ============================================================
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  -- Room dimensions
  length_m DECIMAL(8,2),
  width_m DECIMAL(8,2),
  height_m DECIMAL(8,2),
  -- Room type
  room_function TEXT NOT NULL DEFAULT 'escritório',
  -- Interior description
  interior_description TEXT,
  furniture_elements TEXT[], -- array of element types
  -- Material assignments
  wall_material_id UUID REFERENCES public.materials(id),
  floor_material_id UUID REFERENCES public.materials(id),
  ceiling_material_id UUID REFERENCES public.materials(id),
  additional_materials JSONB DEFAULT '[]'::jsonb,
  -- 3D model
  model_file_path TEXT,
  model_file_name TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. ANALYSES TABLE
-- ============================================================
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'full', -- 'full', '3d_model', 'quick'
  -- Calculated metrics
  volume_m3 DECIMAL(10,3),
  total_absorption DECIMAL(10,3),
  rt60_125hz DECIMAL(6,3),
  rt60_250hz DECIMAL(6,3),
  rt60_500hz DECIMAL(6,3),
  rt60_1000hz DECIMAL(6,3),
  rt60_2000hz DECIMAL(6,3),
  rt60_4000hz DECIMAL(6,3),
  rt60_average DECIMAL(6,3),
  -- AI report
  ai_report TEXT,
  problems_identified JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, error
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own analyses" ON public.analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analyses" ON public.analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 5. CHAT MESSAGES TABLE
-- ============================================================
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. STORAGE BUCKET for 3D models
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'models3d',
  'models3d',
  false,
  52428800, -- 50MB
  ARRAY['model/gltf-binary', 'application/octet-stream', 'text/plain']
);

CREATE POLICY "Users can upload their own 3D models" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'models3d' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own 3D models" ON storage.objects
  FOR SELECT USING (bucket_id = 'models3d' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own 3D models" ON storage.objects
  FOR DELETE USING (bucket_id = 'models3d' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- 7. TRIGGERS & FUNCTIONS
-- ============================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Daily credit refill function
CREATE OR REPLACE FUNCTION public.refill_daily_credits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_refill_date < CURRENT_DATE THEN
    NEW.daily_credits = 5;
    NEW.last_refill_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_credit_refill
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.refill_daily_credits();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
