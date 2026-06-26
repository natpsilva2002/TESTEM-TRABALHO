-- Add thickness override per surface in projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS wall_thickness_mm numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS floor_thickness_mm numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ceiling_thickness_mm numeric DEFAULT NULL;

-- Add STC and material_type to materials
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS stc integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS material_type text DEFAULT 'absorvente';

-- Update existing materials with approximate STC and type
UPDATE public.materials SET material_type = 'reflexivo', stc = 45 WHERE category = 'Parede' AND nrc < 0.15;
UPDATE public.materials SET material_type = 'absorvente', stc = 20 WHERE category IN ('Parede', 'Teto') AND nrc >= 0.15;
UPDATE public.materials SET material_type = 'reflexivo', stc = 50 WHERE category = 'Piso' AND nrc < 0.15;
UPDATE public.materials SET material_type = 'absorvente', stc = 15 WHERE category = 'Piso' AND nrc >= 0.15;
UPDATE public.materials SET material_type = 'absorvente', stc = 18 WHERE category = 'Tratamento';
UPDATE public.materials SET material_type = 'reflexivo' WHERE material_type IS NULL;