-- Correção específica para o contador de criações de Otto Miranda
-- UUID: 0315a2fe-220a-401b-b1b9-055a27733360
-- PROBLEMA: Campo 'creations' mostra 1 quando deveria mostrar o total de músicas

BEGIN;

-- 1. Verificar situação atual de Otto Miranda
SELECT 
    'ANTES DA CORREÇÃO - Otto Miranda' as status,
    uc.device_id,
    uc.user_id,
    uc.creations as creations_atual,
    (SELECT COUNT(*) FROM songs WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360') as total_musicas_real
FROM user_creations uc
WHERE uc.user_id = '0315a2fe-220a-401b-b1b9-055a27733360';

-- 2. Contar total real de músicas de Otto Miranda
WITH otto_stats AS (
    SELECT 
        COUNT(*) as total_musicas,
        MIN(created_at) as primeira_musica,
        MAX(created_at) as ultima_musica
    FROM songs 
    WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
)
SELECT 
    'ESTATÍSTICAS OTTO' as status,
    total_musicas,
    primeira_musica,
    ultima_musica
FROM otto_stats;

-- 3. Corrigir ou criar registro correto para Otto Miranda
-- Usar user_id como device_id para usuários autenticados
INSERT INTO user_creations (
    device_id,
    last_used_ip,
    creations,
    user_id,
    created_at,
    updated_at
)
SELECT 
    '0315a2fe-220a-401b-b1b9-055a27733360' as device_id,
    '0.0.0.0' as last_used_ip,
    COUNT(*) as creations,
    '0315a2fe-220a-401b-b1b9-055a27733360'::uuid as user_id,
    MIN(created_at) as created_at,
    NOW() as updated_at
FROM songs 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
ON CONFLICT (device_id) 
DO UPDATE SET 
    creations = (
        SELECT COUNT(*) 
        FROM songs 
        WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
    ),
    updated_at = NOW(),
    user_id = '0315a2fe-220a-401b-b1b9-055a27733360'::uuid;

-- 4. Verificar resultado da correção
SELECT 
    'APÓS CORREÇÃO - Otto Miranda' as status,
    uc.device_id,
    uc.user_id,
    uc.creations as creations_corrigido,
    (SELECT COUNT(*) FROM songs WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360') as total_musicas_real,
    CASE 
        WHEN uc.creations = (SELECT COUNT(*) FROM songs WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360') 
        THEN '✅ CORRETO' 
        ELSE '❌ AINDA INCORRETO' 
    END as status_correcao
FROM user_creations uc
WHERE uc.user_id = '0315a2fe-220a-401b-b1b9-055a27733360';

-- 5. Verificar se há registros duplicados para Otto
SELECT 
    'VERIFICAÇÃO DUPLICATAS OTTO' as status,
    device_id,
    user_id,
    creations,
    COUNT(*) as registros_duplicados
FROM user_creations
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
   OR device_id LIKE '%0315a2fe-220a-401b-b1b9-055a27733360%'
GROUP BY device_id, user_id, creations
HAVING COUNT(*) > 1;

COMMIT;

-- Log final
SELECT 'CORREÇÃO CONCLUÍDA PARA OTTO MIRANDA' as resultado;