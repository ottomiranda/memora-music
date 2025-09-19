-- Verificar se a correção de duplicação de usuários funcionou

-- 1. Verificar se ainda existem duplicados por device_id
SELECT 
    'duplicates_check' as check_type,
    device_id,
    COUNT(*) as count,
    array_agg(id ORDER BY created_at) as user_ids,
    array_agg(email ORDER BY created_at) as emails
FROM user_creations 
WHERE device_id IS NOT NULL
GROUP BY device_id
HAVING COUNT(*) > 1;

-- 2. Verificar estado atual da tabela user_creations
SELECT 
    'current_state' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as authenticated_users,
    COUNT(CASE WHEN email IS NULL AND device_id IS NOT NULL THEN 1 END) as guest_users,
    COUNT(DISTINCT device_id) as unique_devices
FROM user_creations;

-- 3. Verificar se o índice único foi criado corretamente
SELECT 
    'index_check' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_creations' 
AND indexname = 'idx_user_creations_device_id_unique';

-- 4. Verificar se a função merge_guest_into_user foi atualizada
SELECT 
    'function_check' as check_type,
    proname as function_name,
    LENGTH(prosrc) as function_size_chars
FROM pg_proc 
WHERE proname = 'merge_guest_into_user';

-- 5. Verificar distribuição de freesongsused
SELECT 
    'freesongsused_distribution' as check_type,
    freesongsused,
    COUNT(*) as user_count,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as authenticated_count,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as guest_count
FROM user_creations
GROUP BY freesongsused
ORDER BY freesongsused;

-- 6. Verificar músicas órfãs (sem user_id válido)
SELECT 
    'orphan_songs_check' as check_type,
    COUNT(*) as total_songs,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as songs_with_user,
    COUNT(CASE WHEN guest_id IS NOT NULL THEN 1 END) as songs_with_guest,
    COUNT(CASE WHEN user_id IS NULL AND guest_id IS NULL THEN 1 END) as orphan_songs
FROM songs;

-- 7. Verificar integridade: músicas que referenciam usuários inexistentes
SELECT 
    'integrity_check' as check_type,
    COUNT(s.id) as songs_with_invalid_user_id
FROM songs s
LEFT JOIN user_creations u ON s.user_id = u.id
WHERE s.user_id IS NOT NULL AND u.id IS NULL;