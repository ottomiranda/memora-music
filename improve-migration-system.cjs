#!/usr/bin/env node

/**
 * Script para melhorar o sistema de migração automática
 * Detecta e migra músicas órfãs de diferentes guest_ids para usuários logados
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Função para encontrar músicas órfãs por padrões de guest_id
 */
async function findOrphanSongs() {
  console.log('🔍 Buscando músicas órfãs...');
  
  // Buscar músicas com guest_id que não têm user_id
  const { data: orphanSongs, error } = await supabase
    .from('songs')
    .select('id, title, guest_id, created_at')
    .is('user_id', null)
    .not('guest_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar músicas órfãs:', error);
    return [];
  }

  console.log(`📊 Encontradas ${orphanSongs.length} músicas órfãs`);
  
  // Agrupar por guest_id para análise
  const groupedByGuestId = orphanSongs.reduce((acc, song) => {
    if (!acc[song.guest_id]) {
      acc[song.guest_id] = [];
    }
    acc[song.guest_id].push(song);
    return acc;
  }, {});

  console.log('📋 Músicas órfãs agrupadas por guest_id:');
  Object.entries(groupedByGuestId).forEach(([guestId, songs]) => {
    console.log(`  - ${guestId}: ${songs.length} músicas`);
  });

  return orphanSongs;
}

/**
 * Função para criar uma função RPC melhorada no Supabase
 */
async function createImprovedMigrationFunction() {
  console.log('🔧 Criando função RPC melhorada para migração...');
  
  const migrationFunction = `
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
BEGIN
  -- Se guest_ids não fornecidos, buscar padrões comuns
  IF p_guest_ids IS NULL THEN
    p_guest_ids := ARRAY[
      'demo_guest',
      'autosave-guest-' || EXTRACT(EPOCH FROM NOW())::TEXT,
      'guest-' || EXTRACT(EPOCH FROM NOW())::TEXT
    ];
  END IF;

  -- Migrar músicas órfãs para o usuário
  FOREACH v_guest_id IN ARRAY p_guest_ids
  LOOP
    -- Atualizar músicas com guest_id específico
    UPDATE songs 
    SET 
      user_id = p_user_id,
      guest_id = NULL,
      updated_at = NOW()
    WHERE 
      guest_id LIKE v_guest_id || '%'
      AND user_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    v_migrated_count := v_migrated_count + v_updated_count;
    
    IF v_updated_count > 0 THEN
      RAISE NOTICE 'Migradas % músicas do guest_id: %', v_updated_count, v_guest_id;
    END IF;
  END LOOP;

  -- Atualizar contador na tabela user_creations
  INSERT INTO user_creations (id, freesongsused, updated_at)
  VALUES (p_user_id, v_migrated_count, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    freesongsused = COALESCE(user_creations.freesongsused, 0) + v_migrated_count,
    updated_at = NOW();

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'migrated_count', v_migrated_count,
    'user_id', p_user_id,
    'guest_ids_processed', p_guest_ids
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'migrated_count', 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION migrate_orphan_songs_to_user(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_orphan_songs_to_user(UUID, TEXT[]) TO anon;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationFunction });
    if (error) {
      console.error('❌ Erro ao criar função RPC:', error);
      return false;
    }
    console.log('✅ Função RPC criada com sucesso');
    return true;
  } catch (err) {
    console.error('❌ Erro ao executar SQL:', err);
    return false;
  }
}

/**
 * Função para testar a migração melhorada
 */
async function testImprovedMigration() {
  console.log('🧪 Testando migração melhorada...');
  
  // Buscar Otto Miranda
  const { data: ottoUser, error: userError } = await supabase
    .rpc('find_user_by_name', { search_name: 'Otto Miranda' });

  if (userError || !ottoUser) {
    console.error('❌ Erro ao buscar Otto Miranda:', userError);
    return;
  }

  console.log(`👤 Usuário encontrado: ${ottoUser.name} (${ottoUser.id})`);

  // Testar a função de migração melhorada
  const { data: migrationResult, error: migrationError } = await supabase
    .rpc('migrate_orphan_songs_to_user', {
      p_user_id: ottoUser.id,
      p_guest_ids: ['demo_guest', 'autosave-guest']
    });

  if (migrationError) {
    console.error('❌ Erro na migração:', migrationError);
    return;
  }

  console.log('📊 Resultado da migração:', migrationResult);
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando melhoria do sistema de migração...');
  
  try {
    // 1. Analisar músicas órfãs atuais
    const orphanSongs = await findOrphanSongs();
    
    // 2. Criar função RPC melhorada
    const functionCreated = await createImprovedMigrationFunction();
    
    if (!functionCreated) {
      console.error('❌ Falha ao criar função RPC. Abortando.');
      return;
    }
    
    // 3. Testar a migração melhorada
    await testImprovedMigration();
    
    console.log('\n✅ Melhoria do sistema de migração concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Atualizar o frontend para usar a nova função RPC');
    console.log('2. Implementar detecção automática de padrões de guest_id');
    console.log('3. Adicionar logs de migração para auditoria');
    
  } catch (error) {
    console.error('❌ Erro no processo:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  findOrphanSongs,
  createImprovedMigrationFunction,
  testImprovedMigration
};