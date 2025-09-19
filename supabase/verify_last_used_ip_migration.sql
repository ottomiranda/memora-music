-- Script de Verificação: Coluna last_used_ip na tabela user_creations
-- Execute este script primeiro para verificar se a migração já foi aplicada

-- 1. Verificar se a coluna last_used_ip existe
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_creations' 
    AND column_name = 'last_used_ip';

-- 2. Verificar se os índices existem
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_creations' 
    AND (indexname LIKE '%last_used_ip%' OR indexname LIKE '%device_ip_security%');

-- 3. Verificar estrutura completa da tabela user_creations (opcional)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'user_creations' 
-- ORDER BY ordinal_position;