-- Verificar constraints da tabela songs

-- 1. Listar todas as constraints da tabela songs
SELECT 
    'constraints_check' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'songs'::regclass;

-- 2. Verificar registros existentes na tabela songs
SELECT 
    'existing_songs_check' as check_type,
    COUNT(*) as total_songs,
    COUNT(CASE WHEN user_id IS NOT NULL AND guest_id IS NULL THEN 1 END) as authenticated_user_songs,
    COUNT(CASE WHEN user_id IS NULL AND guest_id IS NOT NULL THEN 1 END) as guest_only_songs,
    COUNT(CASE WHEN user_id IS NOT NULL AND guest_id IS NOT NULL THEN 1 END) as both_user_and_guest,
    COUNT(CASE WHEN user_id IS NULL AND guest_id IS NULL THEN 1 END) as neither_user_nor_guest
FROM songs;

-- 3. Verificar alguns exemplos de registros
SELECT 
    'sample_songs' as check_type,
    id,
    user_id,
    guest_id,
    title,
    generation_status
FROM songs 
LIMIT 5;

-- 4. Verificar se existe alguma constraint específica sobre user_id e guest_id
SELECT 
    'user_guest_constraint_check' as check_type,
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'songs'::regclass 
AND pg_get_constraintdef(oid) LIKE '%user%' 
OR pg_get_constraintdef(oid) LIKE '%guest%';