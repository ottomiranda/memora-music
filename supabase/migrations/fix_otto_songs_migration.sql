-- Migração para corrigir músicas órfãs do Otto Miranda
-- Data: 2025-09-19
-- Descrição: Migrar músicas criadas como guest para o usuário Otto Miranda

-- User ID do Otto Miranda: 0315a2fe-220a-401b-b1b9-055a27733360

-- 1. Verificar estado atual das músicas órfãs
SELECT 
    id,
    title,
    user_id,
    guest_id,
    created_at,
    generation_status
FROM songs 
WHERE user_id IS NULL 
    AND guest_id IS NOT NULL 
    AND created_at >= '2025-09-18'::date
ORDER BY created_at DESC;

-- 2. Migrar as músicas órfãs para Otto Miranda
-- Música 1: Música de Teste - Guest
UPDATE songs 
SET user_id = '0315a2fe-220a-401b-b1b9-055a27733360', 
    guest_id = NULL 
WHERE id = '85319ee4-c3c6-4f33-b51b-66c5c69cd53f';

-- Música 2: Teste Trigger
UPDATE songs 
SET user_id = '0315a2fe-220a-401b-b1b9-055a27733360', 
    guest_id = NULL 
WHERE id = '76c397eb-c860-4003-9117-fafe033ddf98';

-- Música 3: Caminhadas ao Amanhecer (esta pode ser uma das 2 músicas do Otto)
UPDATE songs 
SET user_id = '0315a2fe-220a-401b-b1b9-055a27733360', 
    guest_id = NULL 
WHERE id = 'fcef1ed6-794f-4e14-91f0-69085496c852';

-- 3. Verificar se a migração foi bem-sucedida
SELECT 
    COUNT(*) as total_songs,
    COUNT(CASE WHEN user_id = '0315a2fe-220a-401b-b1b9-055a27733360' THEN 1 END) as otto_songs,
    COUNT(CASE WHEN user_id IS NULL AND guest_id IS NOT NULL THEN 1 END) as orphan_songs
FROM songs;

-- 4. Listar todas as músicas do Otto após migração
SELECT 
    id,
    title,
    created_at,
    generation_status
FROM songs 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
ORDER BY created_at DESC;

-- 5. Verificar se ainda existem músicas órfãs recentes
SELECT 
    id,
    title,
    guest_id,
    created_at
FROM songs 
WHERE user_id IS NULL 
    AND guest_id IS NOT NULL 
    AND created_at >= '2025-09-18'::date
ORDER BY created_at DESC;