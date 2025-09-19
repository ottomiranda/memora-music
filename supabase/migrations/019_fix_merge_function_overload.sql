-- Remove versões antigas da função merge_guest_into_user para resolver conflito de sobrecarga

-- Remove todas as versões existentes da função
DROP FUNCTION IF EXISTS merge_guest_into_user(TEXT, UUID);
DROP FUNCTION IF EXISTS merge_guest_into_user(TEXT, UUID, TEXT);

-- Recria apenas a versão correta da função
CREATE OR REPLACE FUNCTION merge_guest_into_user(
    p_device_id TEXT,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    guest_record user_creations%ROWTYPE;
    user_record user_creations%ROWTYPE;
    result JSON;
BEGIN
    -- Validar se o usuário existe na auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found in auth.users',
            'user_id', p_user_id
        );
    END IF;

    -- Usar advisory lock para evitar condições de corrida
    PERFORM pg_advisory_lock(hashtext(p_device_id || p_user_id::text));

    BEGIN
        -- Buscar registro do guest
        SELECT * INTO guest_record 
        FROM user_creations 
        WHERE device_id = p_device_id AND user_id IS NULL;

        -- Buscar registro do usuário autenticado
        SELECT * INTO user_record 
        FROM user_creations 
        WHERE user_id = p_user_id;

        IF guest_record.device_id IS NOT NULL THEN
            IF user_record.user_id IS NOT NULL THEN
                -- Merge: somar creations e freesongsused
                UPDATE user_creations 
                SET 
                    creations = user_record.creations + guest_record.creations,
                    freesongsused = user_record.freesongsused + guest_record.freesongsused,
                    updated_at = NOW()
                WHERE user_id = p_user_id;

                -- Deletar registro do guest
                DELETE FROM user_creations WHERE device_id = p_device_id AND user_id IS NULL;

                result := json_build_object(
                    'success', true,
                    'action', 'merged',
                    'guest_creations', guest_record.creations,
                    'guest_freesongsused', guest_record.freesongsused,
                    'final_creations', user_record.creations + guest_record.creations,
                    'final_freesongsused', user_record.freesongsused + guest_record.freesongsused
                );
            ELSE
                -- Converter registro do guest para usuário autenticado
                -- Primeiro, alterar device_id temporariamente para evitar conflito
                UPDATE user_creations 
                SET device_id = 'temp_' || p_device_id || '_' || extract(epoch from now())::text
                WHERE device_id = p_device_id AND user_id IS NULL;

                -- Depois, definir o user_id e restaurar device_id
                UPDATE user_creations 
                SET 
                    user_id = p_user_id,
                    device_id = p_user_id::text,
                    updated_at = NOW()
                WHERE device_id LIKE 'temp_' || p_device_id || '%' AND user_id IS NULL;

                result := json_build_object(
                    'success', true,
                    'action', 'converted',
                    'creations', guest_record.creations,
                    'freesongsused', guest_record.freesongsused
                );
            END IF;
        ELSE
            result := json_build_object(
                'success', false,
                'error', 'Guest record not found',
                'device_id', p_device_id
            );
        END IF;

        -- Liberar o lock
        PERFORM pg_advisory_unlock(hashtext(p_device_id || p_user_id::text));

        RETURN result;

    EXCEPTION WHEN OTHERS THEN
        -- Liberar o lock em caso de erro
        PERFORM pg_advisory_unlock(hashtext(p_device_id || p_user_id::text));
        RAISE;
    END;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION merge_guest_into_user(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION merge_guest_into_user(TEXT, UUID) TO anon;