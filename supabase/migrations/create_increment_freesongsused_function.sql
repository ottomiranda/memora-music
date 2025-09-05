-- Criar função RPC para incrementar contador de músicas gratuitas usadas
CREATE OR REPLACE FUNCTION public.increment_freesongsused(user_device_id TEXT)
RETURNS JSON AS $$
DECLARE
    updated_user RECORD;
BEGIN
    -- Incrementa o contador freesongsused para o usuário com o device_id fornecido
    UPDATE public.users 
    SET freesongsused = freesongsused + 1,
        updated_at = NOW()
    WHERE device_id = user_device_id
    RETURNING * INTO updated_user;
    
    -- Verifica se algum registro foi atualizado
    IF updated_user IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found with device_id: ' || user_device_id
        );
    END IF;
    
    -- Retorna sucesso com os dados atualizados
    RETURN json_build_object(
        'success', true,
        'data', row_to_json(updated_user)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões para roles anon e authenticated
GRANT EXECUTE ON FUNCTION public.increment_freesongsused(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_freesongsused(TEXT) TO authenticated;