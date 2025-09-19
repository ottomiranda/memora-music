-- Analisar usuários existentes para entender o problema de duplicação

-- 1. Verificar todos os usuários existentes
SELECT 
    'all_users' as analysis_type,
    id,
    email,
    device_id,
    freesongsused,
    created_at,
    CASE 
        WHEN email IS NOT NULL THEN 'authenticated'
        WHEN device_id IS NOT NULL THEN 'guest'
        ELSE 'unknown'
    END as user_type
FROM user_creations 
ORDER BY created_at DESC
LIMIT 20;

-- 2. Verificar duplicados por device_id
SELECT 
    'duplicates_by_device_id' as analysis_type,
    device_id,
    COUNT(*) as user_count,
    array_agg(id) as user_ids,
    array_agg(email) as emails,
    array_agg(freesongsused) as free_songs_used,
    array_agg(created_at ORDER BY created_at) as creation_dates
FROM user_creations 
WHERE device_id IS NOT NULL
GROUP BY device_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 3. Verificar usuários com mesmo email
SELECT 
    'duplicates_by_email' as analysis_type,
    email,
    COUNT(*) as user_count,
    array_agg(id) as user_ids,
    array_agg(device_id) as device_ids,
    array_agg(freesongsused) as free_songs_used
FROM user_creations 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- 4. Verificar músicas e seus proprietários
SELECT 
    'songs_ownership' as analysis_type,
    s.id as song_id,
    s.title,
    s.user_id,
    s.guest_id,
    u.email as user_email,
    u.device_id as user_device_id,
    u.freesongsused
FROM songs s
LEFT JOIN user_creations u ON s.user_id = u.id
WHERE s.created_at > NOW() - INTERVAL '7 days'
ORDER BY s.created_at DESC
LIMIT 10;

-- 5. Verificar conflitos entre user_id e guest_id nas músicas
SELECT 
    'song_conflicts' as analysis_type,
    s.id as song_id,
    s.title,
    s.user_id,
    s.guest_id,
    u.device_id as user_device_id,
    CASE 
        WHEN s.user_id IS NOT NULL AND s.guest_id IS NOT NULL THEN 'both_ids'
        WHEN s.user_id IS NULL AND s.guest_id IS NULL THEN 'no_ids'
        WHEN s.user_id IS NOT NULL THEN 'user_only'
        WHEN s.guest_id IS NOT NULL THEN 'guest_only'
    END as ownership_type
FROM songs s
LEFT JOIN user_creations u ON s.user_id = u.id
WHERE s.guest_id = u.device_id -- Possível conflito
LIMIT 10;

-- 6. Verificar estatísticas gerais
SELECT 
    'general_stats' as analysis_type,
    (
        SELECT COUNT(*) 
        FROM user_creations 
        WHERE email IS NOT NULL
    ) as authenticated_users,
    (
        SELECT COUNT(*) 
        FROM user_creations 
        WHERE email IS NULL AND device_id IS NOT NULL
    ) as guest_users,
    (
        SELECT COUNT(*) 
        FROM user_creations 
        WHERE email IS NULL AND device_id IS NULL
    ) as orphan_users,
    (
        SELECT COUNT(*) 
        FROM songs
    ) as total_songs,
    (
        SELECT COUNT(*) 
        FROM songs 
        WHERE user_id IS NOT NULL
    ) as songs_with_user_id,
    (
        SELECT COUNT(*) 
        FROM songs 
        WHERE guest_id IS NOT NULL
    ) as songs_with_guest_id;