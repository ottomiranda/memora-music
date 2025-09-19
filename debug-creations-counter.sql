-- Debug do contador 'creations' na user_creations
-- Investigar por que o contador não reflete o total real de músicas

-- 1. Verificar se o trigger existe e está ativo
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_user_creations';

-- 2. Verificar se a função existe
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'sync_user_creations';

-- 3. Comparar dados reais: músicas vs contador
SELECT 
    'Análise de Discrepâncias' as tipo,
    uc.device_id,
    uc.user_id,
    uc.creations as contador_user_creations,
    COUNT(s.id) as total_musicas_reais,
    (uc.creations - COUNT(s.id)) as diferenca
FROM public.user_creations uc
LEFT JOIN public.songs s ON (
    (uc.user_id IS NOT NULL AND s.user_id = uc.user_id) OR
    (uc.user_id IS NULL AND s.guest_id = uc.device_id)
)
GROUP BY uc.device_id, uc.user_id, uc.creations
ORDER BY diferenca DESC;

-- 4. Verificar músicas sem correspondência na user_creations
SELECT 
    'Músicas órfãs (sem user_creations)' as tipo,
    COUNT(*) as total
FROM public.songs s
LEFT JOIN public.user_creations uc ON (
    (s.user_id IS NOT NULL AND uc.user_id = s.user_id) OR
    (s.user_id IS NULL AND uc.device_id = s.guest_id)
)
WHERE uc.device_id IS NULL;

-- 5. Verificar user_creations sem músicas correspondentes
SELECT 
    'user_creations órfãos (sem músicas)' as tipo,
    COUNT(*) as total
FROM public.user_creations uc
LEFT JOIN public.songs s ON (
    (uc.user_id IS NOT NULL AND s.user_id = uc.user_id) OR
    (uc.user_id IS NULL AND s.guest_id = uc.device_id)
)
WHERE s.id IS NULL;

-- 6. Detalhes das músicas por usuário/dispositivo
SELECT 
    'Detalhes por usuário/dispositivo' as tipo,
    COALESCE(s.user_id::text, s.guest_id) as identificador,
    s.user_id,
    s.guest_id,
    COUNT(*) as total_musicas,
    MIN(s.created_at) as primeira_musica,
    MAX(s.created_at) as ultima_musica
FROM public.songs s
GROUP BY s.user_id, s.guest_id
ORDER BY total_musicas DESC;

-- 7. Estado atual da user_creations
SELECT 
    'Estado atual user_creations' as tipo,
    device_id,
    user_id,
    creations,
    freesongsused,
    created_at,
    updated_at
FROM public.user_creations
ORDER BY updated_at DESC;