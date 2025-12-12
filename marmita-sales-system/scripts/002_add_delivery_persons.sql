-- Tabela de entregadores
CREATE TABLE IF NOT EXISTS delivery_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna de entregador na tabela de vendas
ALTER TABLE sales ADD COLUMN IF NOT EXISTS delivery_person_id UUID REFERENCES delivery_persons(id);

-- Habilitar RLS
ALTER TABLE delivery_persons ENABLE ROW LEVEL SECURITY;

-- Políticas para delivery_persons
CREATE POLICY "Allow public read on delivery_persons" ON delivery_persons FOR SELECT USING (true);
CREATE POLICY "Allow public insert on delivery_persons" ON delivery_persons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on delivery_persons" ON delivery_persons FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on delivery_persons" ON delivery_persons FOR DELETE USING (true);

-- Índice para entregadores ativos
CREATE INDEX IF NOT EXISTS idx_delivery_persons_active ON delivery_persons(active);
CREATE INDEX IF NOT EXISTS idx_sales_delivery_person ON sales(delivery_person_id);
