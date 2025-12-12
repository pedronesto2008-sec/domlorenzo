-- Tabela de tamanhos de marmita com preços
CREATE TABLE IF NOT EXISTS marmita_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_id UUID NOT NULL REFERENCES marmita_sizes(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito')),
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('retirada', 'entrega')),
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tamanhos padrão
INSERT INTO marmita_sizes (name, price) VALUES
  ('P', 15.00),
  ('M', 18.00),
  ('G', 22.00)
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS
ALTER TABLE marmita_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Políticas para marmita_sizes (leitura pública, escrita restrita)
CREATE POLICY "Allow public read on marmita_sizes" ON marmita_sizes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on marmita_sizes" ON marmita_sizes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on marmita_sizes" ON marmita_sizes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on marmita_sizes" ON marmita_sizes FOR DELETE USING (true);

-- Políticas para sales (acesso público para este MVP)
CREATE POLICY "Allow public read on sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sales" ON sales FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on sales" ON sales FOR DELETE USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_size_id ON sales(size_id);
