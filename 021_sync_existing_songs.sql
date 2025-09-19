-- Sincronizar músicas existentes que não foram processadas pelo trigger
-- PROBLEMA: Músicas criadas antes da correção do trigger não têm registros na user_creations

-- 1. Verificar quantas músicas não têm correspondência na user_creations
SELECT 
    'Músicas sem registro na user_creations' as status,
    COUNT(*) as total
FROM public.songs s
LEFT JOIN public.user_creations uc ON (
    (s.guest_id IS NOT NULL AND uc.device_id = s.guest_id) OR
    (s.user_id IS NOT NULL AND uc.user_id = s.user_id)
)
WHERE uc.device_id IS NULL;

-- 2. Mostrar algumas músicas sem correspondência
SELECT 
    s.id,
    s.title,
    s.user_id,
    s.guest_id,
    s.created_at
FROM public.songs s
LEFT JOIN public.user_creations uc ON (
    (s.guest_id IS NOT NULL AND uc.device_id = s.guest_id) OR
    (s.user_id IS NOT NULL AND uc.user_id = s.user_id)
)
WHERE uc.device_id IS NULL
ORDER BY s.created_at DESC
LIMIT 10;

-- 3. Sincronizar músicas de guests (agrupando por guest_id)
INSERT INTO public.user_creations (
    device_id,
    ip,
    creations,
    user_id,
    created_at,
    updated_at
)
SELECT 
    s.guest_id as device_id,
    '0.0.0.0' as ip,
    COUNT(*) as creations,
    (
        SELECT s2.user_id 
        FROM public.songs s2 
        WHERE s2.guest_id = s.guest_id 
        AND s2.user_id IS NOT NULL 
        LIMIT 1
    ) as user_id, -- Pega o user_id se houver migração
    MIN(s.created_at) as created_at,
    MAX(s.created_at) as updated_at
FROM public.songs s
LEFT JOIN public.user_creations uc ON uc.device_id = s.guest_id
WHERE s.guest_id IS NOT NULL
AND uc.device_id IS NULL
GROUP BY s.guest_id
ON CONFLICT (device_id) 
DO UPDATE SET 
    creations = user_creations.creations + EXCLUDED.creations,
    updated_at = NOW(),
    user_id = COALESCE(EXCLUDED.user_id, user_creations.user_id);

-- 4. Sincronizar músicas de usuários autenticados sem guest_id
INSERT INTO public.user_creations (
    device_id,
    ip,
    creations,
    user_id,
    created_at,
    updated_at
)
SELECT 
    'user-' || s.user_id as device_id,
    '0.0.0.0' as ip,
    COUNT(*) as creations,
    s.user_id,
    MIN(s.created_at) as created_at,
    MAX(s.created_at) as updated_at
FROM public.songs s
LEFT JOIN public.user_creations uc ON (
    uc.user_id = s.user_id OR 
    uc.device_id = 'user-' || s.user_id
)
WHERE s.user_id IS NOT NULL 
AND s.guest_id IS NULL
AND uc.device_id IS NULL
GROUP BY s.user_id
ON CONFLICT (device_id) 
DO UPDATE SET 
    creations = user_creations.creations + EXCLUDED.creations,
    updated_at = NOW();

-- 5. Verificar resultado da sincronização
SELECT 
    'Após sincronização' as status,
    COUNT(*) as total_user_creations
FROM public.user_creations;

-- 6. Mostrar registros criados/atualizados
SELECT 
    device_id,
    creations,
    user_id,
    created_at,
    updated_at
FROM public.user_creations
ORDER BY updated_at DESC
LIMIT 10;

-- 7. Verificar se ainda há músicas sem correspondência
SELECT 
    'Músicas ainda sem registro' as status,
    COUNT(*) as total
FROM public.songs s
LEFT JOIN public.user_creations uc ON (
    (s.guest_id IS NOT NULL AND uc.device_id = s.guest_id) OR
    (s.user_id IS NOT NULL AND uc.user_id = s.user_id) OR
    (s.user_id IS NOT NULL AND s.guest_id IS NULL AND uc.device_id = 'user-' || s.user_id)
)
WHERE uc.device_id IS NULL;

-- 8. Mostrar estatísticas finais
SELECT 
    'Estatísticas finais' as status,
    COUNT(DISTINCT s.id) as total_songs,
    COUNT(DISTINCT uc.device_id) as total_user_creations,
    COUNT(DISTINCT s.guest_id) as unique_guests,
    COUNT(DISTINCT s.user_id) as unique_users
FROM public.songs s
LEFT JOIN public.user_creations uc ON (
    (s.guest_id IS NOT NULL AND uc.device_id = s.guest_id) OR
    (s.user_id IS NOT NULL AND uc.user_id = s.user_id) OR
    (s.user_id IS NOT NULL AND s.guest_id IS NULL AND uc.device_id = 'user-' || s.user_id)
);