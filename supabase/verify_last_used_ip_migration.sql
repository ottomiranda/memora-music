-- Script de Verificação: Coluna last_used_ip na tabela users
-- Execute este script primeiro para verificar se a migração já foi aplicada

-- 1. Verificar se a coluna last_used_ip existe
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'last_used_ip';

-- 2. Verificar se os índices existem
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
    AND (indexname LIKE '%last_used_ip%' OR indexname LIKE '%device_ip_security%');

-- 3. Verificar estrutura completa da tabela users (opcional)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'users' 
-- ORDER BY ordinal_position;