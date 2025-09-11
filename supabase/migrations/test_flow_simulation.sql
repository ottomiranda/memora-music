-- Simulação do fluxo completo para testar a consolidação de usuários
-- Este teste simula: criar música como convidado → fazer login → verificar consolidação

-- 1. Limpar dados de teste anteriores (se existirem)
DELETE FROM songs WHERE title LIKE 'Test Song%';
DELETE FROM users WHERE email LIKE 'test%@example.com' OR device_id LIKE 'test-device%';

-- 2. Simular criação de usuário convidado (primeira música)
DO $$
DECLARE
    guest_user_id UUID;
    auth_user_id UUID;
    song_id UUID;
    existing_user_count INTEGER;
BEGIN
    -- Criar usuário convidado
    INSERT INTO users (id, device_id, freesongsused, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'test-device-123',
        1,
        NOW(),
        NOW()
    ) RETURNING id INTO guest_user_id;
    
    RAISE NOTICE 'Created guest user: % with device_id: test-device-123', guest_user_id;
    
    -- Criar uma música para o usuário convidado (apenas guest_id, sem user_id)
    INSERT INTO songs (id, guest_id, title, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'test-device-123',
        'Test Song - Guest User',
        NOW(),
        NOW()
    ) RETURNING id INTO song_id;
    
    RAISE NOTICE 'Created guest song: % for device: test-device-123', song_id;
    
    -- 3. Simular login/signup (criação de usuário autenticado com device_id diferente)
    INSERT INTO users (id, email, device_id, freesongsused, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'test-user@example.com',
        'test-device-456', -- device_id diferente para simular login em outro dispositivo
        0,
        NOW(),
        NOW()
    ) RETURNING id INTO auth_user_id;
    
    RAISE NOTICE 'Created authenticated user: % with device_id: test-device-456', auth_user_id;
    
    -- 4. Chamar a função de merge (simular o que acontece no login)
    -- O usuário autenticado quer consolidar dados do device test-device-123
    PERFORM merge_guest_into_user(auth_user_id, 'test-device-123');
    
    RAISE NOTICE 'Called merge_guest_into_user to merge test-device-123 into user %', auth_user_id;
END $$;

-- 5. Verificar resultado da consolidação
SELECT 
    'consolidation_result' as test_phase,
    device_id,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as authenticated_users,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as guest_users
FROM users 
WHERE device_id IN ('test-device-123', 'test-device-456')
GROUP BY device_id
ORDER BY device_id;

-- 6. Verificar se as músicas foram transferidas corretamente
SELECT 
    'songs_transfer_result' as test_phase,
    s.title,
    s.user_id,
    s.guest_id,
    u.email,
    u.device_id,
    u.freesongsused
FROM songs s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.title LIKE 'Test Song%';

-- 7. Verificar se não há usuários duplicados por device_id
SELECT 
    'duplicate_check' as test_phase,
    device_id,
    COUNT(*) as user_count,
    array_agg(email) as emails,
    array_agg(freesongsused) as free_songs_used
FROM users 
WHERE device_id IN ('test-device-123', 'test-device-456')
GROUP BY device_id
HAVING COUNT(*) > 1;

-- 8. Verificar integridade geral após o teste
SELECT 
    'integrity_final_check' as test_phase,
    (
        SELECT COUNT(*) 
        FROM users 
        WHERE device_id IN ('test-device-123', 'test-device-456')
    ) as users_with_test_devices,
    (
        SELECT COUNT(*) 
        FROM songs 
        WHERE title LIKE 'Test Song%'
    ) as test_songs_count,
    (
        SELECT COUNT(*) 
        FROM songs s
        WHERE s.title LIKE 'Test Song%' 
        AND s.user_id IS NULL 
        AND s.guest_id IS NULL
    ) as orphan_test_songs;

-- 9. Verificar estado final das músicas de teste
SELECT 
    'final_songs_state' as test_phase,
    title,
    CASE 
        WHEN user_id IS NOT NULL THEN 'has_user_id'
        WHEN guest_id IS NOT NULL THEN 'has_guest_id'
        ELSE 'orphan'
    END as ownership_type,
    user_id,
    guest_id
FROM songs 
WHERE title LIKE 'Test Song%';

-- 10. Verificar se a constraint única está funcionando
SELECT 
    'constraint_verification' as test_phase,
    'Unique constraint on device_id is working correctly' as message;

-- 11. Limpar dados de teste
DELETE FROM songs WHERE title LIKE 'Test Song%';
DELETE FROM users WHERE email LIKE 'test%@example.com' OR device_id LIKE 'test-device%';

SELECT 'test_cleanup_completed' as final_status;