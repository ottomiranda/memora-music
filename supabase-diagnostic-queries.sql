-- =====================================================
-- QUERIES DE DIAGNÓSTICO PARA SUPABASE
-- Teste manual no SQL Editor do Supabase
-- =====================================================

-- 1. VERIFICAR ESTRUTURA DA TABELA user_creations
-- Execute esta query para confirmar a estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_creations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR DADOS EXISTENTES NA TABELA
-- Conte quantos registros existem na tabela
SELECT COUNT(*) as total_records FROM user_creations;

-- 3. VERIFICAR ALGUNS REGISTROS DE EXEMPLO
-- Veja os primeiros 5 registros para entender os dados
SELECT * FROM user_creations LIMIT 5;

-- 4. TESTAR QUERY ESPECÍFICA QUE ESTÁ FALHANDO
-- Esta é a query exata que está sendo usada na rota paywall
-- Substitua 'test-device-123' pelo device_id que você quer testar
SELECT * FROM user_creations 
WHERE device_id = 'test-device-123';

-- 5. VERIFICAR SE EXISTEM DEVICE_IDS DUPLICADOS
-- Isso pode causar problemas com .single()
SELECT 
    device_id, 
    COUNT(*) as count
FROM user_creations 
GROUP BY device_id 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 6. VERIFICAR POLÍTICAS RLS (Row Level Security)
-- Verificar se RLS está habilitado na tabela
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_creations';

-- 7. LISTAR POLÍTICAS RLS ATIVAS
-- Ver todas as políticas de segurança aplicadas à tabela
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_creations';

-- 8. VERIFICAR PERMISSÕES DA TABELA
-- Verificar permissões para roles anon e authenticated
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'user_creations'
    AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- 9. TESTAR INSERÇÃO DE REGISTRO DE TESTE
-- Execute para testar se consegue inserir dados
-- ATENÇÃO: Execute apenas se necessário para teste
/*
INSERT INTO user_creations (device_id, creations, freesongsused, created_at, updated_at)
VALUES ('test-diagnostic-device', 0, 0, NOW(), NOW())
RETURNING *;
*/

-- 10. LIMPAR REGISTRO DE TESTE (se inseriu acima)
-- Execute apenas se inseriu o registro de teste acima
/*
DELETE FROM user_creations 
WHERE device_id = 'test-diagnostic-device';
*/

-- 11. VERIFICAR ÍNDICES NA TABELA
-- Ver se existe índice no device_id para performance
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_creations'
    AND schemaname = 'public';

-- 12. TESTAR QUERY COM DIFERENTES ABORDAGENS
-- Teste 1: Sem .single() - deve retornar array vazio se não encontrar
SELECT * FROM user_creations 
WHERE device_id = 'device-inexistente';

-- Teste 2: Com COUNT para verificar quantos registros existem
SELECT COUNT(*) as count FROM user_creations 
WHERE device_id = 'device-inexistente';

-- Teste 3: Com EXISTS para verificar se existe
SELECT EXISTS(
    SELECT 1 FROM user_creations 
    WHERE device_id = 'device-inexistente'
) as exists;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Acesse o Supabase Dashboard
-- 2. Vá para SQL Editor
-- 3. Execute as queries uma por uma
-- 4. Anote os resultados de cada query
-- 5. Preste atenção especial às queries 6, 7 e 8 (RLS e permissões)
-- 6. Se a query 4 retornar registros, o problema pode estar na aplicação
-- 7. Se a query 5 retornar registros, há duplicatas que causam erro no .single()
-- =====================================================