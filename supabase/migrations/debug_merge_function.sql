-- Debug: Verificar se a função merge_guest_into_user está funcionando corretamente
-- e identificar o problema de duplicação de usuários

-- 1. Verificar se a função merge_guest_into_user existe
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'merge_guest_into_user';

-- 2. Verificar registros atuais na tabela user_creations
SELECT 
    id,
    email,
    device_id,
    freesongsused,
    last_used_ip,
    created_at,
    updated_at,
    CASE 
        WHEN email IS NOT NULL THEN 'authenticated'
        WHEN device_id IS NOT NULL THEN 'guest'
        ELSE 'unknown'
    END as user_type
FROM user_creations 
ORDER BY created_at DESC
LIMIT 20;

-- 3. Verificar duplicados por device_id (problema principal)
SELECT 
    device_id,
    COUNT(*) as count,
    array_agg(id ORDER BY created_at) as user_ids,
    array_agg(email ORDER BY created_at) as emails,
    array_agg(freesongsused ORDER BY created_at) as free_songs_counts
FROM user_creations 
WHERE device_id IS NOT NULL
GROUP BY device_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 4. Verificar se há usuários com mesmo email
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id ORDER BY created_at) as user_ids,
    array_agg(device_id ORDER BY created_at) as device_ids
FROM user_creations 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- 5. Verificar músicas associadas aos usuários duplicados
SELECT 
    s.user_id,
    s.guest_id,
    u.email,
    u.device_id,
    u.freesongsused,
    COUNT(s.id) as song_count
FROM songs s
LEFT JOIN user_creations u ON s.user_id = u.id
WHERE s.user_id IS NOT NULL
GROUP BY s.user_id, s.guest_id, u.email, u.device_id, u.freesongsused
ORDER BY song_count DESC;

-- 6. Verificar se há device_ids que aparecem tanto em user_creations quanto em songs.guest_id
SELECT 
    'device_id_conflict' as issue_type,
    u.device_id,
    u.id as user_id,
    u.email,
    u.freesongsused,
    COUNT(s.id) as songs_with_guest_id
FROM user_creations u
LEFT JOIN songs s ON s.guest_id = u.device_id
WHERE u.device_id IS NOT NULL
GROUP BY u.device_id, u.id, u.email, u.freesongsused
HAVING COUNT(s.id) > 0
ORDER BY songs_with_guest_id DESC;

-- 7. Testar a função merge_guest_into_user com dados fictícios (apenas para verificar se funciona)
-- NOTA: Esta query não será executada, apenas mostra como deveria ser chamada
/*
SELECT merge_guest_into_user(
    'test-device-id',
    'test-user-uuid'::uuid,
    '127.0.0.1'
);
*/