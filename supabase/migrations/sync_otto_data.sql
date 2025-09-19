-- Script para sincronizar dados existentes para Otto Miranda
-- Baseado no número real de músicas na tabela songs

-- 1. Identificar Otto Miranda
SELECT id, email, raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email LIKE '%otto%' OR raw_user_meta_data->>'full_name' ILIKE '%otto%'
ORDER BY created_at DESC;

-- 2. Contar músicas reais do Otto na tabela songs
SELECT 
  user_id,
  COUNT(*) as total_songs,
  COUNT(CASE WHEN generation_status = 'completed' THEN 1 END) as completed_songs,
  COUNT(CASE WHEN generation_status = 'pending' THEN 1 END) as pending_songs,
  COUNT(CASE WHEN generation_status = 'failed' THEN 1 END) as failed_songs
FROM songs
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360' -- Otto's user_id
GROUP BY user_id;

-- 3. Verificar estado atual na tabela user_creations para Otto
SELECT device_id, user_id, creations, freesongsused, created_at, updated_at
FROM user_creations
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
   OR device_id = '0315a2fe-220a-401b-b1b9-055a27733360';

-- 4. Inserir ou atualizar registro correto para Otto
-- Usar UPSERT (INSERT ... ON CONFLICT) para garantir dados corretos
INSERT INTO user_creations (
  device_id,
  user_id,
  creations,
  freesongsused,
  created_at,
  updated_at
)
VALUES (
  '0315a2fe-220a-401b-b1b9-055a27733360', -- device_id = user_id para usuários autenticados
  '0315a2fe-220a-401b-b1b9-055a27733360', -- user_id do Otto
  (
    SELECT COUNT(*) 
    FROM songs 
    WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
  ), -- creations = número real de músicas
  (
    SELECT COUNT(*) 
    FROM songs 
    WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
      AND ispaid = false
  ), -- freesongsused = número de músicas gratuitas
  NOW(),
  NOW()
)
ON CONFLICT (device_id) 
DO UPDATE SET
  creations = (
    SELECT COUNT(*) 
    FROM songs 
    WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
  ),
  freesongsused = (
    SELECT COUNT(*) 
    FROM songs 
    WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
      AND ispaid = false
  ),
  updated_at = NOW();

-- 5. Verificar o resultado da sincronização
SELECT 
  uc.device_id,
  uc.user_id,
  uc.creations as recorded_creations,
  uc.freesongsused,
  COUNT(s.id) as actual_songs_count,
  COUNT(CASE WHEN s.ispaid = false THEN 1 END) as actual_free_songs,
  CASE 
    WHEN uc.creations = COUNT(s.id) THEN '✅ SINCRONIZADO'
    ELSE '❌ DESSINCRONIZADO'
  END as sync_status
FROM user_creations uc
LEFT JOIN songs s ON s.user_id = uc.user_id
WHERE uc.user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
GROUP BY uc.device_id, uc.user_id, uc.creations, uc.freesongsused;

-- 6. Criar função para manter sincronização automática
CREATE OR REPLACE FUNCTION sync_user_creations_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar contador quando uma música é inserida
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_creations (
      device_id,
      user_id,
      creations,
      freesongsused
    )
    VALUES (
      COALESCE(NEW.user_id::TEXT, NEW.guest_id),
      NEW.user_id,
      1,
      CASE WHEN NEW.ispaid = false THEN 1 ELSE 0 END
    )
    ON CONFLICT (device_id)
    DO UPDATE SET
      creations = user_creations.creations + 1,
      freesongsused = user_creations.freesongsused + CASE WHEN NEW.ispaid = false THEN 1 ELSE 0 END,
      updated_at = NOW();
    
    RETURN NEW;
  END IF;
  
  -- Atualizar contador quando uma música é deletada
  IF TG_OP = 'DELETE' THEN
    UPDATE user_creations
    SET 
      creations = GREATEST(0, creations - 1),
      freesongsused = GREATEST(0, freesongsused - CASE WHEN OLD.ispaid = false THEN 1 ELSE 0 END),
      updated_at = NOW()
    WHERE device_id = COALESCE(OLD.user_id::TEXT, OLD.guest_id);
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Aplicar trigger para manter sincronização
DROP TRIGGER IF EXISTS trigger_sync_user_creations ON songs;
CREATE TRIGGER trigger_sync_user_creations
  AFTER INSERT OR DELETE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_creations_count();

-- 8. Comentários explicativos
COMMENT ON FUNCTION sync_user_creations_count() IS 'Automatically syncs user_creations counters when songs are added or removed';

COMMIT;