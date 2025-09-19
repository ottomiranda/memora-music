-- Fix: Corrigir problema de duplicação de usuários
-- O problema: quando um usuário faz login após criar música como convidado,
-- um novo registro é criado na tabela user_creations ao invés de consolidar com o existente

BEGIN;

-- 1. Primeiro, vamos identificar e consolidar usuários duplicados existentes
-- Criar uma função temporária para consolidar duplicados
CREate OR REPLACE FUNCTION consolidate_duplicate_users()
RETURNS TABLE(consolidated_count INTEGER) AS $$
DECLARE
    duplicate_record RECORD;
    guest_user RECORD;
    auth_user RECORD;
    songs_migrated INTEGER;
BEGIN
    consolidated_count := 0;
    
    -- Encontrar device_ids que têm múltiplos usuários
    FOR duplicate_record IN 
        SELECT device_id, array_agg(id ORDER BY created_at) as user_ids
        FROM user_creations 
        WHERE device_id IS NOT NULL
        GROUP BY device_id
        HAVING COUNT(*) > 1
    LOOP
        -- Para cada device_id duplicado, consolidar os usuários
        SELECT * INTO guest_user 
        FROM user_creations 
        WHERE id = duplicate_record.user_ids[1] -- primeiro usuário (mais antigo)
        LIMIT 1;
        
        SELECT * INTO auth_user 
        FROM user_creations 
        WHERE id = duplicate_record.user_ids[2] -- segundo usuário (mais recente, provavelmente autenticado)
        LIMIT 1;
        
        -- Se temos um usuário convidado e um autenticado
        IF guest_user.email IS NULL AND auth_user.email IS NOT NULL THEN
            -- Migrar músicas do usuário convidado para o autenticado
            UPDATE songs 
            SET user_id = auth_user.id,
                guest_id = NULL,
                updated_at = NOW()
            WHERE user_id = guest_user.id OR guest_id = guest_user.device_id;
            
            GET DIAGNOSTICS songs_migrated = ROW_COUNT;
            
            -- Consolidar contador de músicas gratuitas (pegar o maior valor)
            UPDATE user_creations 
            SET freesongsused = GREATEST(guest_user.freesongsused, auth_user.freesongsused),
                updated_at = NOW()
            WHERE id = auth_user.id;
            
            -- Remover o usuário convidado duplicado
            DELETE FROM user_creations WHERE id = guest_user.id;
            
            consolidated_count := consolidated_count + 1;
            
            RAISE NOTICE 'Consolidado usuário % (% músicas) -> %', 
                guest_user.id, songs_migrated, auth_user.id;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT consolidated_count;
END;
$$ LANGUAGE plpgsql;

-- 2. Executar a consolidação
SELECT * FROM consolidate_duplicate_users();

-- 3. Melhorar a função merge_guest_into_user para ser mais robusta
CREATE OR REPLACE FUNCTION public.merge_guest_into_user(
  p_device_id TEXT,
  p_user_id UUID,
  p_last_ip TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  g RECORD;
  u RECORD;
  combined INTEGER := 0;
  existing_auth_user RECORD;
BEGIN
  -- Guard: require identifiers
  IF p_device_id IS NULL OR p_user_id IS NULL THEN
    RETURN json_build_object('error', 'device_id and user_id are required');
  END IF;

  -- Verificar se já existe um usuário autenticado com este device_id
  SELECT * INTO existing_auth_user
  FROM user_creations 
  WHERE device_id = p_device_id AND email IS NOT NULL
  LIMIT 1;
  
  -- Se já existe um usuário autenticado com este device_id, não criar duplicado
  IF existing_auth_user.id IS NOT NULL AND existing_auth_user.id != p_user_id THEN
    -- Migrar dados para o usuário existente ao invés de criar novo
    UPDATE user_creations 
    SET freesongsused = GREATEST(existing_auth_user.freesongsused, 
                                (SELECT COALESCE(freesongsused, 0) FROM user_creations WHERE id = p_user_id)),
        last_used_ip = COALESCE(p_last_ip, last_used_ip),
        updated_at = NOW()
    WHERE id = existing_auth_user.id;
    
    -- Migrar músicas se necessário
    UPDATE songs 
    SET user_id = existing_auth_user.id,
        guest_id = NULL,
        updated_at = NOW()
    WHERE user_id = p_user_id OR guest_id = p_device_id;
    
    -- Remover o usuário duplicado
    DELETE FROM user_creations WHERE id = p_user_id AND id != existing_auth_user.id;
    
    RETURN json_build_object(
      'user_id', existing_auth_user.id,
      'merged_into_existing', true,
      'combined_freesongsused', existing_auth_user.freesongsused
    );
  END IF;

  -- Lógica original da função
  SELECT * INTO g FROM user_creations WHERE device_id = p_device_id AND email IS NULL LIMIT 1;
  SELECT * INTO u FROM user_creations WHERE id = p_user_id LIMIT 1;

  IF g IS NOT NULL AND u IS NOT NULL THEN
    combined := GREATEST(g.freesongsused, u.freesongsused);
  ELSIF g IS NOT NULL THEN
    combined := g.freesongsused;
  ELSIF u IS NOT NULL THEN
    combined := u.freesongsused;
  END IF;

  -- Migrar músicas do convidado para o usuário autenticado
  UPDATE songs 
  SET user_id = p_user_id, guest_id = NULL, updated_at = NOW()
  WHERE guest_id = p_device_id;

  -- Remover registro de convidado se existir
  DELETE FROM user_creations WHERE device_id = p_device_id AND email IS NULL;

  -- Atualizar/criar registro do usuário autenticado
  INSERT INTO user_creations (id, device_id, freesongsused, last_used_ip, updated_at)
  VALUES (p_user_id, p_device_id, combined, p_last_ip, NOW())
  ON CONFLICT (id) DO UPDATE SET
      device_id = p_device_id,
      freesongsused = GREATEST(user_creations.freesongsused, combined),
      last_used_ip = COALESCE(p_last_ip, user_creations.last_used_ip),
      updated_at = NOW();

  RETURN json_build_object(
    'user_id', p_user_id,
    'merged_guest', g IS NOT NULL,
    'combined_freesongsused', combined
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Adicionar constraint para prevenir duplicação futura
-- Criar índice único parcial para device_id (apenas para registros não-nulos)
DROP INDEX IF EXISTS idx_user_creations_device_id_unique;
CREATE UNIQUE INDEX idx_user_creations_device_id_unique 
ON user_creations (device_id) 
WHERE device_id IS NOT NULL;

-- 5. Remover a função temporária
DROP FUNCTION IF EXISTS consolidate_duplicate_users();

COMMIT;

-- 6. Verificar resultado da correção
SELECT 
    'after_fix' as status,
    COUNT(*) as total_users,
    COUNT(DISTINCT device_id) as unique_devices,
    COUNT(*) - COUNT(DISTINCT device_id) as potential_duplicates
FROM user_creations 
WHERE device_id IS NOT NULL;