-- Correção do contador 'creations' na user_creations
-- Problema: O contador não reflete o total real de músicas
-- Solução: Recalcular baseado nas músicas existentes

BEGIN;

-- 1. Primeiro, vamos sincronizar músicas que não têm registro na user_creations
-- Inserir registros para músicas órfãs (sem user_creations correspondente)
INSERT INTO public.user_creations (
    device_id,
    last_used_ip,
    creations,
    user_id,
    created_at,
    updated_at
)
SELECT DISTINCT
    COALESCE(s.guest_id, s.user_id::text) as device_id,
    '0.0.0.0' as last_used_ip,
    0 as creations, -- Será atualizado na próxima etapa
    s.user_id,
    MIN(s.created_at) as created_at,
    NOW() as updated_at
FROM public.songs s
LEFT JOIN public.user_creations uc ON (
    (s.user_id IS NOT NULL AND uc.user_id = s.user_id) OR
    (s.user_id IS NULL AND uc.device_id = s.guest_id)
)
WHERE uc.device_id IS NULL
  AND COALESCE(s.guest_id, s.user_id::text) IS NOT NULL
GROUP BY COALESCE(s.guest_id, s.user_id::text), s.user_id
ON CONFLICT (device_id) DO NOTHING;

-- 2. Agora recalcular o contador 'creations' para todos os registros
-- baseado no número real de músicas
UPDATE public.user_creations 
SET 
    creations = (
        SELECT COUNT(*)
        FROM public.songs s
        WHERE (
            (user_creations.user_id IS NOT NULL AND s.user_id = user_creations.user_id) OR
            (user_creations.user_id IS NULL AND s.guest_id = user_creations.device_id)
        )
    ),
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1
    FROM public.songs s
    WHERE (
        (user_creations.user_id IS NOT NULL AND s.user_id = user_creations.user_id) OR
        (user_creations.user_id IS NULL AND s.guest_id = user_creations.device_id)
    )
);

-- 3. Remover registros órfãos da user_creations (sem músicas correspondentes)
DELETE FROM public.user_creations uc
WHERE NOT EXISTS (
    SELECT 1
    FROM public.songs s
    WHERE (
        (uc.user_id IS NOT NULL AND s.user_id = uc.user_id) OR
        (uc.user_id IS NULL AND s.guest_id = uc.device_id)
    )
);

-- 4. Verificação final - mostrar resultado da correção
SELECT 
    'Resultado da correção' as status,
    uc.device_id,
    uc.user_id,
    uc.creations as contador_corrigido,
    COUNT(s.id) as total_musicas_verificacao,
    CASE 
        WHEN uc.creations = COUNT(s.id) THEN '✅ CORRETO'
        ELSE '❌ AINDA INCORRETO'
    END as status_verificacao
FROM public.user_creations uc
LEFT JOIN public.songs s ON (
    (uc.user_id IS NOT NULL AND s.user_id = uc.user_id) OR
    (uc.user_id IS NULL AND s.guest_id = uc.device_id)
)
GROUP BY uc.device_id, uc.user_id, uc.creations
ORDER BY uc.creations DESC;

COMMIT;