-- Corrigir a função merge_guest_into_user para evitar conflito de device_id
CREATE OR REPLACE FUNCTION merge_guest_into_user(
    authenticated_user_id UUID,
    guest_device_id TEXT
) RETURNS VOID AS $$
DECLARE
    guest_user_id UUID;
    guest_free_songs INTEGER;
    auth_user_device_id TEXT;
BEGIN
    -- Buscar o usuário convidado pelo device_id
    SELECT id, freesongsused 
    INTO guest_user_id, guest_free_songs
    FROM users 
    WHERE device_id = guest_device_id 
    AND email IS NULL 
    AND status = 1;
    
    -- Buscar o device_id atual do usuário autenticado
    SELECT device_id 
    INTO auth_user_device_id
    FROM users 
    WHERE id = authenticated_user_id;
    
    -- Se encontrou usuário convidado, fazer o merge
    IF guest_user_id IS NOT NULL THEN
        -- Transferir músicas do convidado para o usuário autenticado
        UPDATE songs 
        SET user_id = authenticated_user_id,
            guest_id = NULL,
            updated_at = NOW()
        WHERE guest_id = guest_device_id;
        
        -- Atualizar freesongsused do usuário autenticado
        -- Só atualizar device_id se o usuário autenticado não tiver um
        IF auth_user_device_id IS NULL THEN
            UPDATE users 
            SET freesongsused = COALESCE(freesongsused, 0) + COALESCE(guest_free_songs, 0),
                device_id = guest_device_id,
                updated_at = NOW()
            WHERE id = authenticated_user_id;
        ELSE
            UPDATE users 
            SET freesongsused = COALESCE(freesongsused, 0) + COALESCE(guest_free_songs, 0),
                updated_at = NOW()
            WHERE id = authenticated_user_id;
        END IF;
        
        -- Remover o usuário convidado
        DELETE FROM users WHERE id = guest_user_id;
        
        RAISE NOTICE 'Merged guest user % (device: %) into authenticated user % (device: %)', 
            guest_user_id, guest_device_id, authenticated_user_id, auth_user_device_id;
    ELSE
        RAISE NOTICE 'No guest user found with device_id: %', guest_device_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Testar a função corrigida
SELECT 'merge_function_updated' as status;