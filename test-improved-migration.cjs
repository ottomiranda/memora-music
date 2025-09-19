#!/usr/bin/env node

/**
 * Script para testar o sistema de migração melhorado
 * Testa as novas funções RPC criadas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Função para testar detecção de músicas órfãs
 */
async function testOrphanDetection() {
  console.log('🔍 Testando detecção de músicas órfãs...');
  
  try {
    const { data: orphanData, error } = await supabase
      .rpc('detect_orphan_songs');

    if (error) {
      console.error('❌ Erro ao detectar órfãs:', error);
      return null;
    }

    console.log('📊 Resultado da detecção:', orphanData);
    return orphanData;
  } catch (err) {
    console.error('❌ Erro na detecção:', err);
    return null;
  }
}

/**
 * Função para testar migração melhorada
 */
async function testImprovedMigration() {
  console.log('🧪 Testando migração melhorada...');
  
  try {
    // Buscar Otto Miranda
    const { data: users, error: userError } = await supabase
      .rpc('get_users_by_email_or_name', { search_term: 'Otto Miranda' });
    
    const ottoUser = users && users.length > 0 ? users[0] : null;

    if (userError || !ottoUser) {
      console.error('❌ Erro ao buscar Otto Miranda:', userError);
      return;
    }

    console.log(`👤 Usuário encontrado: ${ottoUser.name} (${ottoUser.id})`);

    // Testar a função de migração melhorada (sem guest_ids específicos para detectar automaticamente)
    const { data: migrationResult, error: migrationError } = await supabase
      .rpc('migrate_orphan_songs_to_user', {
        p_user_id: ottoUser.id
        // p_guest_ids será null, então a função detectará automaticamente
      });

    if (migrationError) {
      console.error('❌ Erro na migração:', migrationError);
      return;
    }

    console.log('📊 Resultado da migração:', migrationResult);

    // Registrar log da migração
    if (migrationResult.success) {
      const { data: logId, error: logError } = await supabase
        .rpc('log_migration', {
          p_user_id: ottoUser.id,
          p_guest_ids: migrationResult.guest_ids_processed || [],
          p_migrated_count: migrationResult.migrated_count,
          p_migration_type: 'test_auto',
          p_success: true
        });

      if (logError) {
        console.warn('⚠️ Erro ao registrar log:', logError);
      } else {
        console.log('📝 Log de migração registrado:', logId);
      }
    }

    return migrationResult;
  } catch (err) {
    console.error('❌ Erro no teste:', err);
    return null;
  }
}

/**
 * Função para verificar logs de migração
 */
async function checkMigrationLogs() {
  console.log('📋 Verificando logs de migração...');
  
  try {
    const { data: logs, error } = await supabase
      .from('migration_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar logs:', error);
      return;
    }

    console.log(`📊 Encontrados ${logs.length} logs de migração:`);
    logs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.created_at} - Usuário: ${log.user_id}`);
      console.log(`     Tipo: ${log.migration_type}, Migradas: ${log.migrated_count}, Sucesso: ${log.success}`);
      if (log.guest_ids && log.guest_ids.length > 0) {
        console.log(`     Guest IDs: ${log.guest_ids.join(', ')}`);
      }
      if (log.error_message) {
        console.log(`     Erro: ${log.error_message}`);
      }
      console.log('');
    });
  } catch (err) {
    console.error('❌ Erro ao verificar logs:', err);
  }
}

/**
 * Função para verificar status atual do Otto
 */
async function checkOttoStatus() {
  console.log('👤 Verificando status atual do Otto...');
  
  try {
    // Buscar todas as músicas e agrupar por user_id para encontrar Otto
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('user_id')
      .not('user_id', 'is', null);

    if (songsError) {
      console.error('❌ Erro ao buscar músicas:', songsError);
      return;
    }
    
    // Contar músicas por user_id
    const userSongCounts = {};
    songs.forEach(song => {
      if (song.user_id) {
        userSongCounts[song.user_id] = (userSongCounts[song.user_id] || 0) + 1;
      }
    });
    
    // Encontrar o user_id com mais músicas (provavelmente Otto)
    let ottoUserId = null;
    let maxSongs = 0;
    
    for (const [userId, count] of Object.entries(userSongCounts)) {
      if (count > maxSongs) {
        maxSongs = count;
        ottoUserId = userId;
      }
    }
    
    if (!ottoUserId) {
      console.log('❌ Nenhum usuário com músicas encontrado');
      return;
    }
    
    console.log(`👤 Usuário com mais músicas encontrado: ${ottoUserId} (${maxSongs} músicas)`);

    // Contar músicas do usuário
    const { data: userSongs, error: userSongsError } = await supabase
      .from('songs')
      .select('id, title, created_at')
      .eq('user_id', ottoUserId)
      .order('created_at', { ascending: false });

    if (userSongsError) {
      console.error('❌ Erro ao buscar músicas do usuário:', userSongsError);
      return;
    }

    console.log(`🎵 Usuário tem ${userSongs.length} músicas:`);
    userSongs.slice(0, 5).forEach((song, index) => {
      const title = song.title || 'Sem título';
      const date = new Date(song.created_at).toLocaleString('pt-BR');
      console.log(`   ${index + 1}. ${title} (${date})`);
    });
    
    if (userSongs.length > 5) {
      console.log(`  ... e mais ${userSongs.length - 5} músicas`);
    }

    // Verificar user_creations
    const { data: creationsData, error: creationsError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('user_id', ottoUserId)
      .single();

    if (creationsError) {
      console.warn('⚠️ Erro ao buscar user_creations:', creationsError);
    } else {
      console.log(`📊 Contador de criações: ${creationsData.freesongsused || 0}`);
    }

  } catch (err) {
    console.error('❌ Erro ao verificar status:', err);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Testando sistema de migração melhorado...');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar status atual do Otto
    await checkOttoStatus();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // 2. Detectar músicas órfãs
    const orphanData = await testOrphanDetection();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // 3. Testar migração melhorada (só se houver órfãs)
    if (orphanData && orphanData.has_orphans) {
      await testImprovedMigration();
    } else {
      console.log('ℹ️ Nenhuma música órfã encontrada. Pulando teste de migração.');
    }
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // 4. Verificar logs de migração
    await checkMigrationLogs();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Teste do sistema melhorado concluído!');
    
  } catch (error) {
    console.error('❌ Erro no processo:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  testOrphanDetection,
  testImprovedMigration,
  checkMigrationLogs,
  checkOttoStatus
};