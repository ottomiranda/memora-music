-- Debug: Por que as políticas RLS não estão funcionando?

-- 1. Verificar se RLS está realmente habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS HABILITADO' 
        ELSE 'RLS DESABILITADO - ESTE É O PROBLEMA!' 
    END as status
FROM pg_tables 
WHERE tablename = 'songs' AND schemaname = 'public';

-- 2. Habilitar RLS se não estiver habilitado
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- 3. Verificar novamente
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS AGORA HABILITADO' 
        ELSE 'AINDA DESABILITADO - PROBLEMA CRÍTICO' 
    END as status
FROM pg_tables 
WHERE tablename = 'songs' AND schemaname = 'public';

-- 4. Listar políticas existentes
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'songs' AND schemaname = 'public';

-- 5. Testar acesso como anon APÓS habilitar RLS
SET ROLE anon;

-- Esta query deve retornar 0 resultados se RLS estiver funcionando
SELECT 
    COUNT(*) as songs_visible_to_anon,
    CASE 
        WHEN COUNT(*) = 0 THEN 'RLS FUNCIONANDO CORRETAMENTE'
        ELSE 'RLS NÃO ESTÁ FUNCIONANDO - PROBLEMA CRÍTICO'
    END as rls_status
FROM songs 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360';

RESET ROLE;

-- 6. Verificar permissões da tabela (podem estar sobrescrevendo RLS)
SELECT 
    grantee,
    privilege_type,
    'PROBLEMA: Permissões muito amplas podem sobrescrever RLS' as warning
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'songs'
    AND grantee IN ('anon', 'public')
    AND privilege_type = 'SELECT';

-- 7. Revogar permissões excessivas se existirem
REVOKE ALL ON songs FROM anon;
REVOKE ALL ON songs FROM public;

-- 8. Conceder apenas as permissões necessárias
-- Anon precisa de SELECT, INSERT, UPDATE, DELETE mas controlado por RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON songs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON songs TO authenticated;

-- 9. Testar novamente após ajustar permissões
SET ROLE anon;

SELECT 
    COUNT(*) as songs_after_permission_fix,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCESSO: RLS + Permissões funcionando'
        ELSE 'FALHA: Ainda há problema de segurança'
    END as final_status
FROM songs 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360';

RESET ROLE;

-- 10. Relatório final
SELECT 'DIAGNÓSTICO COMPLETO' as titulo;

SELECT 
    'RLS Status' as check_type,
    CASE 
        WHEN rowsecurity THEN 'HABILITADO ✅' 
        ELSE 'DESABILITADO ❌' 
    END as status
FROM pg_tables 
WHERE tablename = 'songs';

SELECT 
    'Políticas RLS' as check_type,
    COUNT(*)::text || ' políticas encontradas' as status
FROM pg_policies 
WHERE tablename = 'songs';

SELECT 
    'Teste Final' as check_type,
    'Execute o teste do frontend novamente' as next_action;