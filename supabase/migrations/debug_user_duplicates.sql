-- Debug: Verificar duplicação de usuários
-- Executar queries para entender o problema de dois usuários sendo criados

-- 1. Verificar todos os usuários na tabela
SELECT 
    id,
    email,
    device_id,
    freesongsused,
    last_used_ip,
    created_at,
    updated_at
FROM users 
ORDER BY created_at DESC;

-- 2. Verificar usuários com mesmo device_id (se houver duplicatas)
SELECT 
    device_id,
    COUNT(*) as count,
    array_agg(id) as user_ids,
    array_agg(email) as emails,
    array_agg(freesongsused) as free_songs_counts
FROM users 
WHERE device_id IS NOT NULL
GROUP BY device_id
HAVING COUNT(*) > 1;

-- 3. Verificar usuários sem email (anônimos) vs com email (autenticados)
SELECT 
    'anonymous' as user_type,
    COUNT(*) as count,
    SUM(freesongsused) as total_free_songs
FROM users 
WHERE email IS NULL
UNION ALL
SELECT 
    'authenticated' as user_type,
    COUNT(*) as count,
    SUM(freesongsused) as total_free_songs
FROM users 
WHERE email IS NOT NULL;

-- 4. Verificar músicas por usuário para entender a distribuição
SELECT 
    u.id,
    u.email,
    u.device_id,
    u.freesongsused,
    COUNT(s.id) as songs_count
FROM users u
LEFT JOIN songs s ON (s.user_id = u.id OR s.guest_id = u.id::text)
GROUP BY u.id, u.email, u.device_id, u.freesongsused
ORDER BY u.created_at DESC;

-- 5. Verificar se há constraint violations ou problemas com o índice único
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' AND indexname LIKE '%device_id%';