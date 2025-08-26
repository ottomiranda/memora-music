-- Criar tabela para armazenar feedback do MVP
CREATE TABLE IF NOT EXISTS mvp_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  would_recommend BOOLEAN NOT NULL,
  price_willingness DECIMAL(10,2) NOT NULL CHECK (price_willingness >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE mvp_feedback ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção para usuários anônimos
CREATE POLICY "Allow anonymous insert" ON mvp_feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Allow authenticated insert" ON mvp_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Conceder permissões para roles anon e authenticated
GRANT INSERT ON mvp_feedback TO anon;
GRANT INSERT ON mvp_feedback TO authenticated;

-- Criar índice para otimizar consultas por data
CREATE INDEX IF NOT EXISTS idx_mvp_feedback_created_at ON mvp_feedback(created_at DESC);