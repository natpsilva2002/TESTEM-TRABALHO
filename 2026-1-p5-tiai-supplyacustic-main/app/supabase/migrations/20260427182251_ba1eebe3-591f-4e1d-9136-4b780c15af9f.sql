-- Catálogo de itens de mobiliário/ocupação com absorção em Sabins (m² equivalentes) por frequência
CREATE TABLE public.furniture_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'assento', 'mesa', 'pessoa', 'tecido', 'decoracao', 'divisoria', 'eletronico'
  description TEXT,
  -- Sabins (m² equivalentes) por banda de frequência
  sabins_125hz NUMERIC NOT NULL DEFAULT 0,
  sabins_250hz NUMERIC NOT NULL DEFAULT 0,
  sabins_500hz NUMERIC NOT NULL DEFAULT 0,
  sabins_1000hz NUMERIC NOT NULL DEFAULT 0,
  sabins_2000hz NUMERIC NOT NULL DEFAULT 0,
  sabins_4000hz NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.furniture_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Furniture items viewable by authenticated users"
ON public.furniture_items FOR SELECT TO authenticated USING (true);

-- Adicionar colunas no projects para mobiliário detalhado e preset
ALTER TABLE public.projects
  ADD COLUMN occupancy_preset TEXT DEFAULT 'empty', -- 'empty', 'lightly', 'furnished', 'crowded'
  ADD COLUMN furniture_inventory JSONB DEFAULT '[]'::jsonb; -- [{item_id, quantity}]

-- Seed com 25 itens (valores de referência: Vér Beranek/Cox & D'Antonio/handbooks acústicos)
INSERT INTO public.furniture_items (name, category, description, sabins_125hz, sabins_250hz, sabins_500hz, sabins_1000hz, sabins_2000hz, sabins_4000hz) VALUES
('Pessoa em pé', 'pessoa', 'Adulto em pé, roupa comum', 0.25, 0.35, 0.42, 0.46, 0.50, 0.50),
('Pessoa sentada', 'pessoa', 'Adulto sentado em cadeira', 0.20, 0.30, 0.38, 0.42, 0.45, 0.45),
('Cadeira de madeira vazia', 'assento', 'Cadeira simples de madeira', 0.01, 0.02, 0.02, 0.04, 0.04, 0.03),
('Cadeira metálica vazia', 'assento', 'Cadeira tubular metálica', 0.01, 0.01, 0.02, 0.02, 0.03, 0.03),
('Cadeira estofada vazia', 'assento', 'Cadeira com assento e encosto estofados', 0.15, 0.25, 0.35, 0.40, 0.45, 0.45),
('Cadeira de plateia (vazia)', 'assento', 'Poltrona de auditório vazia', 0.20, 0.30, 0.40, 0.45, 0.50, 0.50),
('Cadeira de plateia (ocupada)', 'assento', 'Poltrona de auditório com pessoa', 0.30, 0.45, 0.55, 0.60, 0.62, 0.60),
('Poltrona de couro', 'assento', 'Poltrona estofada em couro', 0.20, 0.30, 0.40, 0.45, 0.45, 0.40),
('Sofá de tecido', 'assento', 'Sofá 3 lugares estofado em tecido', 0.40, 0.65, 0.90, 1.10, 1.20, 1.20),
('Mesa de madeira', 'mesa', 'Mesa retangular de madeira maciça', 0.05, 0.08, 0.10, 0.10, 0.10, 0.10),
('Mesa de vidro', 'mesa', 'Mesa com tampo de vidro', 0.02, 0.02, 0.03, 0.04, 0.05, 0.05),
('Estante cheia de livros', 'decoracao', 'Estante 2x1m totalmente preenchida', 0.30, 0.40, 0.45, 0.50, 0.50, 0.45),
('Armário fechado', 'decoracao', 'Armário de madeira fechado', 0.10, 0.10, 0.10, 0.10, 0.10, 0.10),
('Cama de casal', 'decoracao', 'Cama com colchão e roupas', 0.45, 0.65, 0.85, 1.00, 1.05, 1.05),
('Cortina pesada (m²)', 'tecido', 'Cortina veludo franzida (por m²)', 0.15, 0.35, 0.55, 0.70, 0.70, 0.65),
('Cortina leve (m²)', 'tecido', 'Cortina algodão fina (por m²)', 0.05, 0.10, 0.20, 0.30, 0.40, 0.45),
('Tapete grosso (m²)', 'tecido', 'Tapete felpudo sobre concreto (por m²)', 0.10, 0.20, 0.30, 0.45, 0.55, 0.65),
('Tapete fino (m²)', 'tecido', 'Tapete liso sobre piso duro (por m²)', 0.05, 0.10, 0.15, 0.25, 0.30, 0.35),
('Painel acústico móvel (m²)', 'decoracao', 'Painel absorvedor portátil (por m²)', 0.20, 0.55, 0.85, 0.95, 0.90, 0.85),
('Divisória de tecido (m²)', 'divisoria', 'Biombo com revestimento absorvente (por m²)', 0.10, 0.30, 0.55, 0.70, 0.70, 0.65),
('Planta grande', 'decoracao', 'Vaso com folhagem densa', 0.05, 0.08, 0.12, 0.15, 0.15, 0.15),
('Quadro/Tela emoldurada', 'decoracao', 'Quadro com vidro (efeito desprezível)', 0.02, 0.02, 0.02, 0.02, 0.02, 0.02),
('Computador desktop', 'eletronico', 'CPU + monitor sobre mesa', 0.05, 0.05, 0.05, 0.05, 0.05, 0.05),
('Caixa acústica/Monitor de áudio', 'eletronico', 'Caixa de som de estúdio', 0.05, 0.08, 0.10, 0.10, 0.10, 0.10),
('Bancada/balcão', 'mesa', 'Balcão de madeira ou MDF', 0.05, 0.08, 0.10, 0.12, 0.12, 0.12);