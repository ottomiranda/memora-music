-- Verificar e corrigir o trigger de sincronização da user_creations
-- PROBLEMA IDENTIFICADO: Músicas são criadas mas user_creations fica vazia

-- 1. Verificar se o trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_user_creations';

-- 2. Verificar se a função existe
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'sync_user_creations'
AND routine_schema = 'public';

-- 3. Recriar a função com logs para debug
CREATE OR REPLACE FUNCTION public.sync_user_creations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log para debug
  RAISE NOTICE 'TRIGGER EXECUTADO: Nova música criada - ID: %, user_id: %, guest_id: %', NEW.id, NEW.user_id, NEW.guest_id;
  
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
    '0.0.0.0', -- IP padrão
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
    
  RAISE NOTICE 'TRIGGER CONCLUÍDO: Registro inserido/atualizado na user_creations';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recriar o trigger
DROP TRIGGER IF EXISTS trigger_sync_user_creations ON public.songs;
CREATE TRIGGER trigger_sync_user_creations
  AFTER INSERT ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_creations();

-- 5. Verificar novamente se foi criado
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_user_creations';

-- 6. Testar o trigger inserindo uma música de teste
INSERT INTO public.songs (
    id,
    title,
    user_id,
    guest_id,
    created_at
) VALUES (
    gen_random_uuid(),
    'Teste Trigger - ' || NOW(),
    NULL,
    'test-device-trigger-' || extract(epoch from now()),
    NOW()
);

-- 7. Verificar se o registro foi criado na user_creations
SELECT 
    'Após inserção de teste' as momento,
    COUNT(*) as total_registros
FROM public.user_creations;

-- 8. Mostrar últimos registros
SELECT 
    device_id,
    creations,
    user_id,
    created_at
FROM public.user_creations
ORDER BY created_at DESC
LIMIT 3;