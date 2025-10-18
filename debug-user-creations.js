#!/usr/bin/env node

/**
 * Script para monitorar e debugar problemas na tabela user_creations
 * Monitora logs em tempo real e identifica padrões de falha
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseState() {
  console.log('🔍 Verificando estado atual do banco de dados...\n');
  
  try {
    // 1. Verificar se a tabela user_creations existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_creations');
    
    if (tablesError) {
      console.log('⚠️ Erro ao verificar tabelas:', tablesError.message);
    } else {
      console.log('✅ Tabela user_creations existe:', tables.length > 0);
    }

    // 2. Verificar estrutura da tabela user_creations
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_creations');
    
    if (columnsError) {
      console.log('⚠️ Erro ao verificar colunas:', columnsError.message);
    } else {
      console.log('📋 Estrutura da tabela user_creations:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 3. Verificar registros recentes na tabela user_creations
    const { data: recentCreations, error: creationsError } = await supabase
      .from('user_creations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (creationsError) {
      console.log('⚠️ Erro ao buscar user_creations:', creationsError.message);
    } else {
      console.log(`\n📊 Últimos ${recentCreations.length} registros em user_creations:`);
      recentCreations.forEach((creation, index) => {
        console.log(`  ${index + 1}. ID: ${creation.id}, User: ${creation.user_id || 'N/A'}, Guest: ${creation.guest_id || 'N/A'}, Criações: ${creation.creations_count}, Atualizado: ${creation.updated_at}`);
      });
    }

    // 4. Verificar registros recentes na tabela songs
    const { data: recentSongs, error: songsError } = await supabase
      .from('songs')
      .select('id, user_id, guest_id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (songsError) {
      console.log('⚠️ Erro ao buscar songs:', songsError.message);
    } else {
      console.log(`\n🎵 Últimas ${recentSongs.length} músicas criadas:`);
      recentSongs.forEach((song, index) => {
        console.log(`  ${index + 1}. ID: ${song.id}, User: ${song.user_id || 'N/A'}, Guest: ${song.guest_id || 'N/A'}, Título: ${song.title}, Criado: ${song.created_at}`);
      });
    }

    // 5. Verificar se há músicas sem correspondência em user_creations
    console.log('\n🔍 Verificando inconsistências...');
    
    for (const song of recentSongs) {
      const { data: userCreation, error } = await supabase
        .from('user_creations')
        .select('*')
        .or(`user_id.eq.${song.user_id || 'null'},device_id.eq.${song.guest_id || 'null'}`)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.log(`  ⚠️ Erro ao verificar user_creation para música ${song.id}:`, error.message);
      } else if (!userCreation) {
        console.log(`  ❌ Música ${song.id} não tem correspondência em user_creations (User: ${song.user_id}, Guest: ${song.guest_id})`);
      } else {
        console.log(`  ✅ Música ${song.id} tem correspondência em user_creations (ID: ${userCreation.id})`);
      }
    }

    // 6. Verificar se o trigger está ativo
    let triggers, triggersError;
    
    try {
      const result = await supabase.rpc('exec_sql', {
        sql: `
          SELECT trigger_name 
          FROM information_schema.triggers 
          WHERE trigger_name = 'trigger_sync_user_creations'
        `
      });
      triggers = result.data;
      triggersError = result.error;
    } catch (error) {
      // Se RPC não funcionar, tentar query direta
      const result = await supabase
        .from('pg_trigger')
        .select('tgname')
        .eq('tgname', 'trigger_sync_user_creations');
      triggers = result.data;
      triggersError = result.error;
    }

    if (triggersError) {
      console.log('⚠️ Não foi possível verificar triggers:', triggersError.message);
    } else if (triggers && triggers.data) {
      console.log('\n🔧 Status do trigger sync_user_creations:');
      if (triggers.data.length > 0) {
        console.log('  ✅ Trigger está ativo');
        triggers.data.forEach(trigger => {
          console.log(`    - Nome: ${trigger.trigger_name || trigger.tgname}`);
          if (trigger.event_manipulation) console.log(`    - Evento: ${trigger.event_manipulation}`);
          if (trigger.action_timing) console.log(`    - Timing: ${trigger.action_timing}`);
        });
      } else {
        console.log('  ❌ Trigger não encontrado');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function monitorRealTimeActivity() {
  console.log('\n🔄 Iniciando monitoramento em tempo real...');
  console.log('Pressione Ctrl+C para parar\n');

  // Monitorar inserções na tabela songs
  const songsSubscription = supabase
    .channel('songs-changes')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'songs' },
      (payload) => {
        console.log('🎵 Nova música inserida:', {
          id: payload.new.id,
          user_id: payload.new.user_id,
          guest_id: payload.new.guest_id,
          title: payload.new.title,
          timestamp: new Date().toISOString()
        });
        
        // Verificar se user_creations foi atualizada após um pequeno delay
        setTimeout(async () => {
          const { data: userCreation, error } = await supabase
            .from('user_creations')
            .select('*')
            .or(`user_id.eq.${payload.new.user_id || 'null'},guest_id.eq.${payload.new.guest_id || 'null'}`)
            .single();
          
          if (error) {
            console.log('  ❌ Erro ao verificar user_creations após inserção:', error.message);
          } else if (userCreation) {
            console.log('  ✅ user_creations atualizada:', {
              id: userCreation.id,
              creations_count: userCreation.creations_count,
              updated_at: userCreation.updated_at
            });
          } else {
            console.log('  ❌ user_creations NÃO foi atualizada após inserção da música');
          }
        }, 1000);
      }
    )
    .subscribe();

  // Monitorar mudanças na tabela user_creations
  const userCreationsSubscription = supabase
    .channel('user-creations-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'user_creations' },
      (payload) => {
        console.log('👤 Mudança em user_creations:', {
          event: payload.eventType,
          id: payload.new?.id || payload.old?.id,
          user_id: payload.new?.user_id || payload.old?.user_id,
          guest_id: payload.new?.guest_id || payload.old?.guest_id,
          creations_count: payload.new?.creations_count || payload.old?.creations_count,
          timestamp: new Date().toISOString()
        });
      }
    )
    .subscribe();

  // Manter o script rodando
  process.on('SIGINT', () => {
    console.log('\n🛑 Parando monitoramento...');
    songsSubscription.unsubscribe();
    userCreationsSubscription.unsubscribe();
    process.exit(0);
  });

  // Manter o processo vivo
  setInterval(() => {
    // Apenas para manter o processo rodando
  }, 1000);
}

async function main() {
  console.log('🚀 Iniciando debug da tabela user_creations...\n');
  
  await checkDatabaseState();
  
  console.log('\n' + '='.repeat(60));
  
  const args = process.argv.slice(2);
  if (args.includes('--monitor')) {
    await monitorRealTimeActivity();
  } else {
    console.log('\n💡 Para monitorar em tempo real, execute: node debug-user-creations.js --monitor');
    process.exit(0);
  }
}

main().catch(console.error);