-- Script para investigar por que músicas desaparecem quando user_creations é limpa
-- Problema: músicas existem na tabela songs mas não aparecem no frontend

-- 1. Verificar músicas do Otto Miranda na tabela songs
SELECT 
    'Músicas na tabela songs' as tipo,
    COUNT(*) as total,
    user_id,
    guest_id
FROM public.songs 
WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' -- Otto Miranda
GROUP BY user_id, guest_id;

-- 2. Verificar registros na user_creations para Otto Miranda
SELECT 
    'Registros em user_creations' as tipo,
    user_id,
    device_id,
    creations,
    freesongsused,
    created_at
FROM public.user_creations 
WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
   OR device_id LIKE '%f47ac10b-58cc-4372-a567-0e02b2c3d479%';

-- 3. Verificar se há músicas órfãs (sem registro em user_creations)
SELECT 
    s.id,
    s.title,
    s.user_id,
    s.guest_id,
    s.created_at,
    CASE 
        WHEN uc.user_id IS NOT NULL THEN 'Tem registro em user_creations'
        ELSE 'SEM registro em user_creations'
    END as status_user_creations
FROM public.songs s
LEFT JOIN public.user_creations uc ON (
    s.user_id = uc.user_id OR 
    s.guest_id = uc.device_id OR
    (s.user_id IS NOT NULL AND uc.device_id = 'user-' || s.user_id)
)
WHERE s.user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
ORDER BY s.created_at DESC;

-- 4. Verificar se o frontend depende de user_creations para mostrar músicas
-- (Esta é uma hipótese - vamos verificar o código depois)

-- 5. Verificar políticas RLS na tabela songs
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
WHERE tablename = 'songs';

-- 6. Verificar se há alguma dependência entre songs e user_creations nas políticas
SELECT 
    'Política RLS songs' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'songs' AND qual LIKE '%user_creations%';

-- 7. Testar query que simula o que o frontend faz
-- Assumindo que o frontend usa apenas user_id para filtrar
SELECT 
    'Simulação query frontend' as tipo,
    id,
    title,
    user_id,
    guest_id,
    generation_status,
    created_at
FROM public.songs
WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
ORDER BY created_at DESC
LIMIT 20;

-- 8. Verificar se há alguma função ou trigger que afeta a visibilidade
SELECT 
    'Triggers na tabela songs' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'songs';

-- 9. Verificar permissões da tabela songs
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'songs' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 10. Resumo do problema
SELECT 
    'RESUMO' as tipo,
    'Se músicas existem em songs mas não aparecem no frontend,' as observacao1,
    'pode ser problema de RLS, permissões ou lógica do frontend' as observacao2;