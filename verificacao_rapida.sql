-- =====================================================
-- VERIFICAÇÃO RÁPIDA - MIGRAÇÃO last_used_ip
-- Execute este script para verificar se tudo está OK
-- =====================================================

-- 1. Verificar se a coluna last_used_ip existe
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Coluna last_used_ip existe'
        ELSE '❌ Coluna last_used_ip NÃO existe'
    END as status_coluna
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'last_used_ip';

-- 2. Verificar se os índices existem
SELECT 
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ Índices criados com sucesso'
        WHEN COUNT(*) = 1 THEN '⚠️ Apenas 1 índice encontrado'
        ELSE '❌ Nenhum índice encontrado'
    END as status_indices
FROM pg_indexes 
WHERE tablename = 'users' 
    AND (indexname LIKE '%last_used_ip%' OR indexname LIKE '%device_ip%');

-- 3. Verificar estrutura da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'last_used_ip' THEN '🆕 NOVA COLUNA'
        WHEN column_name = 'device_id' THEN '🔑 DEVICE ID'
        WHEN column_name = 'id' THEN '🆔 PRIMARY KEY'
        ELSE '📄 COLUNA PADRÃO'
    END as tipo
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Contar registros na tabela
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(device_id) as usuarios_com_device_id,
    COUNT(last_used_ip) as usuarios_com_ip
FROM users;

-- 5. Verificar se RLS está ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Ativo'
        ELSE '⚠️ RLS Inativo'
    END as status_rls
FROM pg_tables 
WHERE tablename = 'users';