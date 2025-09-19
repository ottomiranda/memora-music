-- CORREÇÃO CRÍTICA: O problema está no backend usando SERVICE_ROLE_KEY
-- que bypassa todas as políticas RLS!

-- 1. Verificar o problema atual
SELECT 
    'DIAGNÓSTICO DO PROBLEMA' as titulo,
    'Backend usa SERVICE_ROLE_KEY que bypassa RLS' as problema_identificado,
    'Precisa usar ANON_KEY e autenticação JWT' as solucao;

-- 2. Testar se as políticas RLS funcionam com role correto
-- Simular acesso como usuário autenticado
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "0315a2fe-220a-401b-b1b9-055a27733360", "role": "authenticated"}';

SELECT 
    COUNT(*) as songs_with_auth_role,
    'Usuário autenticado deve ver suas próprias músicas' as expected
FROM songs 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360';

RESET ROLE;

-- 3. Testar como anon (deve ver 0)
SET ROLE anon;

SELECT 
    COUNT(*) as songs_with_anon_role,
    CASE 
        WHEN COUNT(*) = 0 THEN 'RLS FUNCIONANDO - Anon não vê músicas de outros'
        ELSE 'RLS FALHOU - Anon ainda vê músicas de outros'
    END as rls_test_result
FROM songs 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360';

RESET ROLE;

-- 4. Criar função para testar autenticação JWT
CREATE OR REPLACE FUNCTION test_jwt_auth(user_uuid UUID)
RETURNS TABLE(
    song_count BIGINT,
    test_result TEXT
) AS $$
BEGIN
    -- Simular JWT token
    PERFORM set_config('request.jwt.claims', 
        json_build_object(
            'sub', user_uuid::text,
            'role', 'authenticated'
        )::text, 
        true
    );
    
    -- Testar acesso
    RETURN QUERY
    SELECT 
        COUNT(*) as song_count,
        CASE 
            WHEN COUNT(*) > 0 THEN 'JWT Auth funcionando - usuário vê suas músicas'
            ELSE 'JWT Auth pode ter problema'
        END as test_result
    FROM songs 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Testar a função JWT
SELECT * FROM test_jwt_auth('0315a2fe-220a-401b-b1b9-055a27733360');

-- 6. Relatório do problema e solução
SELECT 
    'PROBLEMA IDENTIFICADO' as status,
    'Backend usa SERVICE_ROLE_KEY que bypassa RLS' as problema,
    'Solução: Modificar SongService para usar ANON_KEY + JWT' as solucao_necessaria;

SELECT 
    'PRÓXIMOS PASSOS' as titulo,
    '1. Modificar getSupabaseClient() no SongService' as passo1,
    '2. Implementar autenticação JWT no backend' as passo2,
    '3. Usar SUPABASE_ANON_KEY em vez de SERVICE_ROLE_KEY' as passo3;

-- 7. Limpar função de teste
DROP FUNCTION IF EXISTS test_jwt_auth(UUID);