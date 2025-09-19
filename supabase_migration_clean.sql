-- =====================================================
-- SCRIPT DE MIGRAÇÃO LIMPO PARA SUPABASE
-- Memora Music - Adição da coluna last_used_ip
-- =====================================================

-- 1. VERIFICAR SE A COLUNA last_used_ip JÁ EXISTE
-- Execute esta query primeiro para verificar:
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_creations' 
    AND column_name = 'last_used_ip';

-- Se a query acima retornar resultado, a coluna já existe.
-- Se não retornar nada, execute o script abaixo:

-- =====================================================
-- 2. ADICIONAR COLUNA last_used_ip (SE NÃO EXISTIR)
-- =====================================================

-- Adicionar coluna last_used_ip à tabela user_creations
ALTER TABLE user_creations 
ADD COLUMN IF NOT EXISTS last_used_ip TEXT;

-- =====================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para busca por IP
CREATE INDEX IF NOT EXISTS idx_user_creations_last_used_ip 
ON user_creations(last_used_ip);

-- Índice composto para segurança (device_id + IP)
CREATE INDEX IF NOT EXISTS idx_user_creations_device_ip_security 
ON user_creations(device_id, last_used_ip);

-- =====================================================
-- 4. VERIFICAR APLICAÇÃO DA MIGRAÇÃO
-- =====================================================

-- Verificar se a coluna foi criada com sucesso
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_creations' 
    AND column_name = 'last_used_ip';

-- Verificar se os índices foram criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_creations' 
    AND (indexname LIKE '%last_used_ip%' OR indexname LIKE '%device_ip%');

-- =====================================================
-- 5. TESTE BÁSICO (OPCIONAL)
-- =====================================================

-- Contar registros na tabela user_creations
SELECT COUNT(*) as total_users FROM user_creations;

-- Verificar estrutura da tabela user_creations
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_creations'
ORDER BY ordinal_position;