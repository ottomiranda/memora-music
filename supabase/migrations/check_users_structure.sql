-- Verificar estrutura atual da tabela user_creations
-- Verificar se existe campo status ou similar

-- 1. Verificar todos os campos da tabela user_creations
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_creations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar alguns registros existentes
SELECT 
    id,
    email,
    name,
    freesongsused,
    device_id,
    last_used_ip,
    created_at,
    updated_at
FROM user_creations 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Verificar se há usuários duplicados por device_id
SELECT 
    device_id,
    COUNT(*) as count,
    array_agg(id) as user_ids,
    array_agg(email) as emails,
    array_agg(freesongsused) as free_songs_counts
FROM user_creations 
WHERE device_id IS NOT NULL
GROUP BY device_id
HAVING COUNT(*) > 1;

-- 4. Verificar usuários anônimos vs autenticados
SELECT 
    'Usuários Autenticados' as tipo,
    COUNT(*) as quantidade
FROM user_creations 
WHERE email IS NOT NULL
UNION ALL
SELECT 
    'Usuários Anônimos' as tipo,
    COUNT(*) as quantidade
FROM user_creations 
WHERE email IS NULL;

-- 5. Verificar se há índices únicos
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_creations' AND schemaname = 'public';

-- 6. Verificar constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.user_creations'::regclass;