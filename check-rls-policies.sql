-- =====================================================
-- VERIFICAÇÃO DE POLÍTICAS RLS - user_creations
-- Execute no SQL Editor do Supabase
-- =====================================================

-- 1. VERIFICAR STATUS DO RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS ATIVO ✅'
        ELSE 'RLS DESABILITADO ❌'
    END as status
FROM pg_tables 
WHERE tablename = 'user_creations' AND schemaname = 'public';

-- 2. LISTAR TODAS AS POLÍTICAS RLS DA TABELA
SELECT 
    policyname as "Nome da Política",
    cmd as "Comando",
    permissive as "Permissiva",
    roles as "Roles",
    qual as "Condição WHERE",
    with_check as "Condição WITH CHECK"
FROM pg_policies 
WHERE tablename = 'user_creations' AND schemaname = 'public'
ORDER BY policyname;

-- 3. VERIFICAR PERMISSÕES DIRETAS NA TABELA
SELECT 
    grantee as "Role",
    privilege_type as "Permissão",
    is_grantable as "Pode Conceder"
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'user_creations'
    AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY 
    CASE grantee 
        WHEN 'service_role' THEN 1
        WHEN 'authenticated' THEN 2 
        WHEN 'anon' THEN 3
        ELSE 4
    END,
    privilege_type;

-- 4. TESTAR ACESSO COMO SERVICE_ROLE
-- Esta query simula o que o backend faz
SELECT 
    'SERVICE_ROLE TEST' as test_type,
    COUNT(*) as total_records
FROM user_creations;

-- 5. VERIFICAR SE EXISTEM REGISTROS COM DEVICE_IDS ESPECÍFICOS
SELECT 
    device_id,
    creations,
    freesongsused,
    created_at,
    user_id
FROM user_creations 
WHERE device_id IN (
    'test-device-123',
    'device-novo-456',
    'guest_1234567890123',
    'user_abcd1234-5678-90ab-cdef-123456789012'
)
ORDER BY created_at DESC;

-- 6. VERIFICAR REGISTROS RECENTES
SELECT 
    device_id,
    creations,
    freesongsused,
    created_at,
    updated_at,
    CASE 
        WHEN user_id IS NULL THEN 'GUEST'
        ELSE 'AUTHENTICATED'
    END as user_type
FROM user_creations 
ORDER BY updated_at DESC 
LIMIT 10;

-- 7. VERIFICAR DUPLICATAS DE DEVICE_ID (CRÍTICO PARA .single())
SELECT 
    device_id,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 1 THEN '⚠️  DUPLICATA ENCONTRADA'
        ELSE '✅ OK'
    END as status
FROM user_creations 
GROUP BY device_id 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 8. ESTATÍSTICAS GERAIS DA TABELA
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT device_id) as unique_devices,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as guest_records,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM user_creations;

-- 9. VERIFICAR ÍNDICES (PERFORMANCE)
SELECT 
    indexname as "Nome do Índice",
    indexdef as "Definição"
FROM pg_indexes 
WHERE tablename = 'user_creations' AND schemaname = 'public'
ORDER BY indexname;

-- =====================================================
-- DIAGNÓSTICO ESPERADO:
-- =====================================================
-- ✅ RLS deve estar ATIVO
-- ✅ service_role deve ter ALL PRIVILEGES
-- ✅ NÃO deve haver duplicatas de device_id
-- ✅ Deve existir índice na coluna device_id (PRIMARY KEY)
-- ⚠️  Se houver duplicatas, isso explica o erro PGRST116
-- ⚠️  Se service_role não tiver permissões, isso explica falhas de acesso
-- =====================================================

-- 10. QUERY DE TESTE FINAL - SIMULA EXATAMENTE O QUE A API FAZ
-- Substitua 'SEU_DEVICE_ID_AQUI' por um device_id real para testar
/*
SELECT * FROM user_creations 
WHERE device_id = 'SEU_DEVICE_ID_AQUI';
*/