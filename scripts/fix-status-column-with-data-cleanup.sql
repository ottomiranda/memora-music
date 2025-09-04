-- Script SQL corrigido para renomear coluna 'status' para 'generation_status'
-- Este script primeiro limpa dados inválidos antes de aplicar o constraint

-- Passo 1: Verificar valores atuais na coluna 'status'
SELECT DISTINCT status, COUNT(*) as count
FROM songs 
GROUP BY status
ORDER BY count DESC;

-- Passo 2: Atualizar valores inválidos para 'completed'
-- Os valores válidos são: 'pending', 'processing', 'completed', 'failed'
UPDATE songs 
SET status = 'completed' 
WHERE status NOT IN ('pending', 'processing', 'completed', 'failed')
   OR status IS NULL;

-- Passo 3: Verificar se ainda existem valores inválidos
SELECT DISTINCT status, COUNT(*) as count
FROM songs 
WHERE status NOT IN ('pending', 'processing', 'completed', 'failed')
GROUP BY status;

-- Passo 4: Renomear a coluna de 'status' para 'generation_status'
ALTER TABLE songs 
RENAME COLUMN status TO generation_status;

-- Passo 5: Adicionar constraint de verificação
ALTER TABLE songs 
ADD CONSTRAINT check_generation_status 
CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed'));

-- Passo 6: Definir valor padrão
ALTER TABLE songs 
ALTER COLUMN generation_status SET DEFAULT 'pending';

-- Passo 7: Verificar a alteração
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'songs' 
AND column_name = 'generation_status';

-- Passo 8: Verificar distribuição final dos valores
SELECT DISTINCT generation_status, COUNT(*) as count
FROM songs 
GROUP BY generation_status
ORDER BY count DESC;