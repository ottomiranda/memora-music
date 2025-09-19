-- Consulta temporária para verificar dados de Otto Miranda na user_creations
-- UUID de Otto Miranda: 0315a2fe-220a-401b-b1b9-055a27733360

-- 1. Verificar registros na user_creations para Otto Miranda
SELECT 
    'user_creations para Otto' as tipo,
    device_id, 
    user_id, 
    creations, 
    freesongsused, 
    created_at, 
    updated_at 
FROM user_creations 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360' 
   OR device_id = '0315a2fe-220a-401b-b1b9-055a27733360';

-- 2. Contar total de músicas de Otto Miranda na tabela songs
SELECT 
    'Total músicas Otto' as tipo,
    COUNT(*) as total_musicas
FROM songs 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360';

-- 3. Verificar se há registros duplicados ou inconsistentes
SELECT 
    'Análise device_id Otto' as tipo,
    device_id,
    COUNT(*) as registros
FROM user_creations 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
GROUP BY device_id;

-- 4. Verificar últimas músicas criadas por Otto
SELECT 
    'Últimas músicas Otto' as tipo,
    id,
    title,
    user_id,
    guest_id,
    created_at
FROM songs 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar todos os registros na user_creations (para debug)
SELECT 
    'Todos registros user_creations' as tipo,
    device_id,
    user_id,
    creations,
    freesongsused
FROM user_creations
ORDER BY updated_at DESC
LIMIT 10;