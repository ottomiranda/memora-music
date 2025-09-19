-- Trigger para sincronizar tabela user_creations quando uma música é criada
-- Este trigger resolve o problema de inconsistência entre as tabelas

BEGIN;

-- Função que será executada pelo trigger
CREATE OR REPLACE FUNCTION public.sync_user_creations()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar registro na tabela user_creations
  INSERT INTO public.user_creations (
    device_id,
    ip,
    creations,
    user_id,
    created_at,
    updated_at
  )
  VALUES (
    COALESCE(NEW.guest_id, 'unknown'),
    '0.0.0.0', -- IP padrão, pode ser atualizado posteriormente
    1,
    NEW.user_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (device_id) 
  DO UPDATE SET 
    creations = user_creations.creations + 1,
    updated_at = NOW(),
    user_id = COALESCE(NEW.user_id, user_creations.user_id);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa após inserção de uma nova música
DROP TRIGGER IF EXISTS trigger_sync_user_creations ON public.songs;
CREATE TRIGGER trigger_sync_user_creations
  AFTER INSERT ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_creations();

-- Habilitar RLS na tabela user_creations para segurança
ALTER TABLE public.user_creations ENABLE ROW LEVEL SECURITY;

-- Política para usuários anônimos (podem ver apenas seus próprios registros por device_id)
CREATE POLICY "anon_can_view_own_creations" ON public.user_creations
  FOR SELECT
  TO anon
  USING (device_id = current_setting('request.headers')::json->>'x-device-id');

-- Política para usuários autenticados (podem ver apenas seus próprios registros)
CREATE POLICY "authenticated_can_view_own_creations" ON public.user_creations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para inserção (apenas sistema pode inserir via trigger)
CREATE POLICY "system_can_insert_creations" ON public.user_creations
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false); -- Bloqueia inserção direta, apenas via trigger

-- Política para atualização (apenas sistema pode atualizar via trigger)
CREATE POLICY "system_can_update_creations" ON public.user_creations
  FOR UPDATE
  TO authenticated, anon
  USING (false); -- Bloqueia atualização direta, apenas via trigger

-- Comentários para documentação
COMMENT ON FUNCTION public.sync_user_creations() IS 'Função trigger para sincronizar contagem de criações na tabela user_creations';
COMMENT ON TRIGGER trigger_sync_user_creations ON public.songs IS 'Trigger que atualiza user_creations quando uma nova música é criada';

COMMIT;

-- Verificar se o trigger foi criado corretamente
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_user_creations';