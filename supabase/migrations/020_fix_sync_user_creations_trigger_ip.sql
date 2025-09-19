-- Migração: Corrigir trigger sync_user_creations para usar last_used_ip em vez de ip
-- Data: 2025-01-15
-- Justificativa: A coluna 'ip' foi removida da tabela user_creations na migração 019
-- O trigger ainda estava tentando inserir na coluna 'ip' inexistente

BEGIN;

-- Remover o trigger existente
DROP TRIGGER IF EXISTS trigger_sync_user_creations ON public.songs;

-- Remover a função existente
DROP FUNCTION IF EXISTS public.sync_user_creations();

-- Criar nova função corrigida usando last_used_ip
CREATE OR REPLACE FUNCTION public.sync_user_creations()
RETURNS TRIGGER AS $$
DECLARE
  computed_device_id TEXT;
BEGIN
  -- Calcular device_id usando chave exclusiva por usuário/dispositivo
  -- Para usuários autenticados: usar user_id como string
  -- Para usuários anônimos: usar guest_id
  computed_device_id := COALESCE(NEW.guest_id, NEW.user_id::text);
  
  -- Validar se temos um identificador válido
  IF computed_device_id IS NULL OR computed_device_id = '' THEN
    RAISE WARNING 'sync_user_creations: Nem guest_id nem user_id fornecidos para a música ID %. Pulando sincronização.', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Log para debug
  RAISE NOTICE 'sync_user_creations: Processando música ID % com device_id % (user_id: %, guest_id: %)', 
    NEW.id, computed_device_id, NEW.user_id, NEW.guest_id;
  
  -- Inserir ou atualizar registro na tabela user_creations
  INSERT INTO public.user_creations (
    device_id,
    last_used_ip,
    creations,
    user_id,
    created_at,
    updated_at
  )
  VALUES (
    computed_device_id,
    '0.0.0.0', -- IP padrão já que não temos acesso ao IP real no trigger
    1,
    NEW.user_id, -- Manter user_id original (pode ser NULL para anônimos)
    NOW(),
    NOW()
  )
  ON CONFLICT (device_id) 
  DO UPDATE SET 
    creations = user_creations.creations + 1,
    updated_at = NOW(),
    -- Atualizar user_id apenas se o registro atual não tem user_id e o novo tem
    user_id = CASE 
      WHEN user_creations.user_id IS NULL AND NEW.user_id IS NOT NULL THEN NEW.user_id
      ELSE user_creations.user_id
    END;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar novo trigger
CREATE TRIGGER trigger_sync_user_creations
  AFTER INSERT ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_creations();

-- Atualizar comentários
COMMENT ON FUNCTION public.sync_user_creations() IS 'Função trigger para sincronizar contagem de criações usando chaves exclusivas por usuário/dispositivo (usando last_used_ip)';
COMMENT ON TRIGGER trigger_sync_user_creations ON public.songs IS 'Trigger que atualiza user_creations com chaves exclusivas quando uma nova música é criada';

-- Verificação pós-migração
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_sync_user_creations'
        AND event_object_table = 'songs'
    ) THEN
        RAISE NOTICE 'SUCESSO: Trigger sync_user_creations recriado com sucesso';
    ELSE
        RAISE EXCEPTION 'ERRO: Falha ao recriar trigger sync_user_creations';
    END IF;
END $$;

COMMIT;