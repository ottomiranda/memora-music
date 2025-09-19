-- Script de Diagnóstico: Análise da Tabela user_creations
-- Data: 2025-01-15
-- Objetivo: Analisar padrões de dados para colunas ip, user_id e last_used_ip

-- =====================================================
-- ANÁLISE GERAL DOS DADOS
-- =====================================================

-- 1. Contagem geral de registros e padrões de preenchimento
SELECT 
    'RESUMO GERAL' as categoria,
    COUNT(*) as total_registros,
    COUNT(user_id) as registros_com_user_id,
    COUNT(*) - COUNT(user_id) as registros_null_user_id,
    ROUND(COUNT(user_id)::numeric / COUNT(*) * 100, 2) as percentual_autenticados,
    COUNT(ip) as registros_com_ip,
    COUNT(last_used_ip) as registros_com_last_used_ip
FROM user_creations;

-- =====================================================
-- ANÁLISE DAS COLUNAS IP
-- =====================================================

-- 2. Comparação entre colunas ip e last_used_ip
SELECT 
    'COMPARACAO_IPS' as categoria,
    COUNT(*) as total,
    COUNT(CASE WHEN ip IS NOT NULL THEN 1 END) as ip_preenchido,
    COUNT(CASE WHEN last_used_ip IS NOT NULL THEN 1 END) as last_used_ip_preenchido,
    COUNT(CASE WHEN ip IS NOT NULL AND last_used_ip IS NOT NULL THEN 1 END) as ambos_preenchidos,
    COUNT(CASE WHEN ip IS NULL AND last_used_ip IS NULL THEN 1 END) as ambos_null
FROM user_creations;

-- 3. Valores únicos na coluna ip
SELECT 
    'VALORES_IP' as categoria,
    ip,
    COUNT(*) as ocorrencias
FROM user_creations 
WHERE ip IS NOT NULL
GROUP BY ip
ORDER BY COUNT(*) DESC;

-- 4. Valores únicos na coluna last_used_ip (primeiros 10)
SELECT 
    'VALORES_LAST_USED_IP' as categoria,
    last_used_ip,
    COUNT(*) as ocorrencias
FROM user_creations 
WHERE last_used_ip IS NOT NULL
GROUP BY last_used_ip
ORDER BY COUNT(*) DESC
LIMIT 10;

-- =====================================================
-- ANÁLISE DA COLUNA USER_ID
-- =====================================================

-- 5. Padrões de device_id para identificar tipos de usuário
SELECT 
    'TIPOS_USUARIO' as categoria,
    user_type,
    COUNT(*) as count,
    COUNT(user_id) as with_user_id,
    COUNT(ip) as with_ip,
    COUNT(last_used_ip) as with_last_used_ip
FROM (
    SELECT 
        CASE 
            WHEN device_id LIKE 'guest-%' THEN 'Guest User (guest-*)'
            WHEN device_id LIKE 'user-%' THEN 'Fallback User (user-*)'
            WHEN device_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID Device ID'
            WHEN user_id IS NOT NULL THEN 'Authenticated User'
            ELSE 'Unknown Pattern'
        END as user_type,
        user_id,
        ip,
        last_used_ip
    FROM user_creations
) subquery
GROUP BY user_type
ORDER BY count DESC;

-- 6. Análise de consistência: registros com user_id mas sem device_id correspondente
SELECT 
    'CONSISTENCIA_USER_ID' as categoria,
    COUNT(*) as registros_com_user_id,
    COUNT(CASE WHEN device_id = user_id::text THEN 1 END) as device_id_igual_user_id,
    COUNT(CASE WHEN device_id != user_id::text THEN 1 END) as device_id_diferente_user_id
FROM user_creations 
WHERE user_id IS NOT NULL;

-- =====================================================
-- ANÁLISE DE DEPENDÊNCIAS
-- =====================================================

-- 7. Verificar constraints e índices na coluna ip
SELECT 
    'CONSTRAINTS_IP' as categoria,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'user_creations' 
AND ccu.column_name = 'ip';

-- 8. Verificar índices que usam a coluna ip
SELECT 
    'INDICES_IP' as categoria,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_creations' 
AND indexdef LIKE '%ip%';

-- =====================================================
-- ANÁLISE TEMPORAL
-- =====================================================

-- 9. Distribuição temporal dos registros
SELECT 
    'DISTRIBUICAO_TEMPORAL' as categoria,
    DATE(created_at) as data,
    COUNT(*) as total_registros,
    COUNT(user_id) as com_user_id,
    COUNT(ip) as com_ip,
    COUNT(last_used_ip) as com_last_used_ip
FROM user_creations 
WHERE created_at IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY data DESC
LIMIT 7;

-- =====================================================
-- RECOMENDAÇÕES BASEADAS NOS DADOS
-- =====================================================

-- 10. Resumo final com recomendações
SELECT 
    'RECOMENDACOES' as categoria,
    CASE 
        WHEN (SELECT COUNT(*) FROM user_creations WHERE ip IS NOT NULL) = 0 
        THEN 'REMOVER coluna ip - não está sendo utilizada'
        WHEN (SELECT COUNT(*) FROM user_creations WHERE ip IS NOT NULL) < 5 
        THEN 'CONSIDERAR remoção da coluna ip - poucos registros'
        ELSE 'MANTER coluna ip - está sendo utilizada'
    END as recomendacao_ip,
    CASE 
        WHEN (SELECT COUNT(*) FROM user_creations WHERE user_id IS NULL) > 
             (SELECT COUNT(*) FROM user_creations WHERE user_id IS NOT NULL)
        THEN 'Sistema funcionando principalmente com guests - comportamento normal'
        ELSE 'Investigar por que poucos usuários estão autenticados'
    END as recomendacao_user_id;

-- Fim do diagnóstico