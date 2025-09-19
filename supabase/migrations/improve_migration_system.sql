-- Função melhorada para migrar músicas órfãs para usuários logados
-- Detecta padrões comuns de guest_id e migra automaticamente

CREATE OR REPLACE FUNCTION migrate_orphan_songs_to_user(
  p_user_id UUID,
  p_guest_ids TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_migrated_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_guest_id TEXT;
  v_result JSON;
  v_current_songs INTEGER := 0;
BEGIN
  -- Se guest_ids não fornecidos, buscar padrões comuns órfãos
  IF p_guest_ids IS NULL THEN
    -- Buscar todos os guest_ids únicos que têm músicas órfãs
    SELECT ARRAY_AGG(DISTINCT guest_id) INTO p_guest_ids
    FROM songs 
    WHERE user_id IS NULL 
      AND guest_id IS NOT NULL
      AND (guest_id LIKE 'demo_guest%' 
           OR guest_id LIKE 'autosave-guest%' 
           OR guest_id LIKE 'guest-%');
    
    -- Se não encontrou nenhum padrão, usar lista padrão
    IF p_guest_ids IS NULL OR array_length(p_guest_ids, 1) = 0 THEN
      p_guest_ids := ARRAY['demo_guest', 'autosave-guest'];
    END IF;
  END IF;

  RAISE NOTICE 'Processando guest_ids: %', p_guest_ids;

  -- Migrar músicas órfãs para o usuário
  FOREACH v_guest_id IN ARRAY p_guest_ids
  LOOP
    -- Atualizar músicas com guest_id específico (usando LIKE para pegar variações)
    UPDATE songs 
    SET 
      user_id = p_user_id,
      guest_id = NULL,
      updated_at = NOW()
    WHERE 
      (guest_id = v_guest_id OR guest_id LIKE v_guest_id || '%')
      AND user_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    v_migrated_count := v_migrated_count + v_updated_count;
    
    IF v_updated_count > 0 THEN
      RAISE NOTICE 'Migradas % músicas do guest_id: %', v_updated_count, v_guest_id;
    END IF;
  END LOOP;

  -- Contar músicas atuais do usuário
  SELECT COUNT(*) INTO v_current_songs
  FROM songs
  WHERE user_id = p_user_id;

  -- Atualizar contador na tabela user_creations
  INSERT INTO user_creations (id, freesongsused, updated_at)
  VALUES (p_user_id, v_current_songs, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    freesongsused = v_current_songs,
    updated_at = NOW();

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'migrated_count', v_migrated_count,
    'total_user_songs', v_current_songs,
    'user_id', p_user_id,
    'guest_ids_processed', p_guest_ids
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'migrated_count', 0,
      'user_id', p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION migrate_orphan_songs_to_user(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_orphan_songs_to_user(UUID, TEXT[]) TO anon;

-- Função auxiliar para detectar músicas órfãs automaticamente
CREATE OR REPLACE FUNCTION detect_orphan_songs()
RETURNS JSON AS $$
DECLARE
  v_orphan_count INTEGER := 0;
  v_guest_ids TEXT[];
  v_result JSON;
BEGIN
  -- Contar músicas órfãs
  SELECT COUNT(*) INTO v_orphan_count
  FROM songs 
  WHERE user_id IS NULL AND guest_id IS NOT NULL;

  -- Buscar guest_ids únicos com músicas órfãs
  SELECT ARRAY_AGG(DISTINCT guest_id) INTO v_guest_ids
  FROM songs 
  WHERE user_id IS NULL AND guest_id IS NOT NULL;

  v_result := json_build_object(
    'orphan_count', v_orphan_count,
    'guest_ids', COALESCE(v_guest_ids, ARRAY[]::TEXT[]),
    'has_orphans', v_orphan_count > 0
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION detect_orphan_songs() TO authenticated;
GRANT EXECUTE ON FUNCTION detect_orphan_songs() TO anon;

-- Criar tabela de logs de migração para auditoria
CREATE TABLE IF NOT EXISTS migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  guest_ids TEXT[],
  migrated_count INTEGER DEFAULT 0,
  migration_type VARCHAR(50) DEFAULT 'auto',
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de logs
ALTER TABLE migration_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados verem apenas seus próprios logs
CREATE POLICY "Users can view own migration logs" ON migration_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Política para inserção de logs (qualquer usuário autenticado)
CREATE POLICY "Users can insert migration logs" ON migration_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Conceder permissões na tabela
GRANT SELECT, INSERT ON migration_logs TO authenticated;
GRANT SELECT, INSERT ON migration_logs TO anon;

-- Função para registrar log de migração
CREATE OR REPLACE FUNCTION log_migration(
  p_user_id UUID,
  p_guest_ids TEXT[],
  p_migrated_count INTEGER,
  p_migration_type VARCHAR(50) DEFAULT 'manual',
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO migration_logs (
    user_id, guest_ids, migrated_count, migration_type, 
    success, error_message, created_at
  )
  VALUES (
    p_user_id, p_guest_ids, p_migrated_count, p_migration_type,
    p_success, p_error_message, NOW()
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION log_migration(UUID, TEXT[], INTEGER, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_migration(UUID, TEXT[], INTEGER, VARCHAR, BOOLEAN, TEXT) TO anon;