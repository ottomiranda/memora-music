-- Verificar se existe campo status na tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name = 'status';

-- Se não existir, adicionar o campo status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status INTEGER DEFAULT 1;
        COMMENT ON COLUMN users.status IS 'Status do usuário: 0 = autenticado, 1 = convidado';
        RAISE NOTICE 'Campo status adicionado à tabela users';
    ELSE
        RAISE NOTICE 'Campo status já existe na tabela users';
    END IF;
END $$;

-- Criar ou substituir a função merge_guest_into_user
CREATE OR REPLACE FUNCTION merge_guest_into_user(
    authenticated_user_id UUID,
    guest_device_id TEXT
) RETURNS VOID AS $$
DECLARE
    guest_user_id UUID;
    guest_free_songs INTEGER;
BEGIN
    -- Buscar o usuário convidado pelo device_id
    SELECT id, freesongsused 
    INTO guest_user_id, guest_free_songs
    FROM users 
    WHERE device_id = guest_device_id 
    AND email IS NULL 
    AND status = 1;
    
    -- Se encontrou usuário convidado, fazer o merge
    IF guest_user_id IS NOT NULL THEN
        -- Transferir músicas do convidado para o usuário autenticado
        UPDATE songs 
        SET user_id = authenticated_user_id,
            guest_id = NULL,
            updated_at = NOW()
        WHERE guest_id = guest_device_id;
        
        -- Atualizar freesongsused do usuário autenticado
        UPDATE users 
        SET freesongsused = COALESCE(freesongsused, 0) + COALESCE(guest_free_songs, 0),
            device_id = guest_device_id, -- Manter o device_id original
            updated_at = NOW()
        WHERE id = authenticated_user_id;
        
        -- Remover o usuário convidado
        DELETE FROM users WHERE id = guest_user_id;
        
        RAISE NOTICE 'Merged guest user % into authenticated user %', guest_user_id, authenticated_user_id;
    ELSE
        RAISE NOTICE 'No guest user found with device_id: %', guest_device_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Atualizar usuários existentes para definir status correto
UPDATE users 
SET status = CASE 
    WHEN email IS NOT NULL THEN 0  -- Usuário autenticado
    ELSE 1  -- Usuário convidado
END
WHERE status IS NULL;

-- Verificar resultado da atualização
SELECT 
    'status_update_result' as operation,
    status,
    COUNT(*) as user_count,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as without_email
FROM users 
GROUP BY status
ORDER BY status;