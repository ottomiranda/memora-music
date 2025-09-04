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
    AND table_name = 'users' 
    AND column_name = 'last_used_ip';

-- Se a query acima retornar resultado, a coluna já existe.
-- Se não retornar nada, execute o script abaixo:

-- =====================================================
-- 2. ADICIONAR COLUNA last_used_ip (SE NÃO EXISTIR)
-- =====================================================

-- Adicionar coluna last_used_ip à tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_used_ip TEXT;

-- =====================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para busca por IP
CREATE INDEX IF NOT EXISTS idx_users_last_used_ip 
ON users(last_used_ip);

-- Índice composto para segurança (device_id + IP)
CREATE INDEX IF NOT EXISTS idx_users_device_ip_security 
ON users(device_id, last_used_ip);

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
    AND table_name = 'users' 
    AND column_name = 'last_used_ip';

-- Verificar se os índices foram criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
    AND (indexname LIKE '%last_used_ip%' OR indexname LIKE '%device_ip%');

-- =====================================================
-- 5. TESTE BÁSICO (OPCIONAL)
-- =====================================================

-- Contar registros na tabela users
SELECT COUNT(*) as total_users FROM users;

-- Verificar estrutura da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;