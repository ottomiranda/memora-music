-- Script para analisar e corrigir problemas com device_id na tabela user_creations
-- Problema: device_id é chave primária mas a aplicação pode tentar inserir NULL

-- 1. Verificar a estrutura atual da tabela user_creations
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_creations'
ORDER BY ordinal_position;

-- 2. Verificar constraints da tabela
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.user_creations'::regclass;

-- 3. Verificar todos os registros atuais
SELECT device_id, user_id, creations, created_at, updated_at
FROM user_creations
ORDER BY created_at DESC;

-- 4. Verificar se existem registros órfãos ou problemáticos
SELECT 
  uc.device_id,
  uc.user_id,
  uc.creations,
  CASE 
    WHEN uc.user_id IS NOT NULL THEN 'authenticated_user'
    ELSE 'guest_user'
  END as user_type,
  COUNT(s.id) as actual_songs_count
FROM user_creations uc
LEFT JOIN songs s ON (s.user_id = uc.user_id OR s.guest_id = uc.device_id)
GROUP BY uc.device_id, uc.user_id, uc.creations
ORDER BY uc.created_at DESC;

-- 5. Criar função para gerar device_id válido quando necessário
CREATE OR REPLACE FUNCTION generate_device_id(p_user_id UUID DEFAULT NULL, p_guest_id TEXT DEFAULT NULL)
RETURNS TEXT AS $$
BEGIN
  -- Se temos user_id, usar ele como device_id
  IF p_user_id IS NOT NULL THEN
    RETURN p_user_id::TEXT;
  END IF;
  
  -- Se temos guest_id, usar ele
  IF p_guest_id IS NOT NULL AND p_guest_id != '' THEN
    RETURN p_guest_id;
  END IF;
  
  -- Caso contrário, gerar um UUID aleatório
  RETURN gen_random_uuid()::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para garantir que device_id nunca seja NULL
CREATE OR REPLACE FUNCTION ensure_device_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Se device_id for NULL ou vazio, gerar um
  IF NEW.device_id IS NULL OR NEW.device_id = '' THEN
    NEW.device_id := generate_device_id(NEW.user_id, NEW.device_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Aplicar o trigger
DROP TRIGGER IF EXISTS trigger_ensure_device_id ON user_creations;
CREATE TRIGGER trigger_ensure_device_id
  BEFORE INSERT OR UPDATE ON user_creations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_device_id();

-- 8. Comentários explicativos
COMMENT ON FUNCTION generate_device_id(UUID, TEXT) IS 'Generates a valid device_id based on user_id or guest_id, ensuring it is never NULL';
COMMENT ON FUNCTION ensure_device_id() IS 'Trigger function to ensure device_id is never NULL before insert/update';

COMMIT;