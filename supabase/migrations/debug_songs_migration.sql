-- Consulta para verificar o estado atual das músicas e usuários
SELECT 
    'songs_status' as query_type,
    s.id, 
    s.title, 
    s.user_id, 
    s.guest_id, 
    s.created_at,
    uc.device_id, 
    uc.user_id as uc_user_id, 
    uc.freesongsused
FROM songs s 
LEFT JOIN user_creations uc ON (s.user_id = uc.user_id OR s.guest_id = uc.device_id) 
ORDER BY s.created_at DESC 
LIMIT 10;

-- Verificar usuários com nome Otto Miranda
SELECT 
    'otto_miranda_users' as query_type,
    uc.*,
    au.email,
    au.raw_user_meta_data
FROM user_creations uc
LEFT JOIN auth.users au ON uc.user_id = au.id
WHERE uc.user_id IS NOT NULL
ORDER BY uc.updated_at DESC;

-- Verificar músicas recentes (últimas 24 horas)
SELECT 
    'recent_songs' as query_type,
    s.*
FROM songs s
WHERE s.created_at > NOW() - INTERVAL '24 hours'
ORDER BY s.created_at DESC;

-- Verificar usuários guest recentes (sem user_id)
SELECT 
    'recent_guests' as query_type,
    uc.*
FROM user_creations uc
WHERE uc.user_id IS NULL -- guest users
AND uc.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY uc.updated_at DESC;