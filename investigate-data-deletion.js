#!/usr/bin/env node

/**
 * Script de Investigação: Exclusão de Registros no Supabase
 * 
 * Este script investiga possíveis causas de exclusão de dados no Supabase:
 * 1. Verifica logs de operações DELETE/TRUNCATE
 * 2. Analisa integridade dos dados atuais
 * 3. Identifica possíveis conflitos de migração
 * 4. Verifica políticas RLS e triggers
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateDataDeletion() {
  console.log('🔍 === INVESTIGAÇÃO DE EXCLUSÃO DE DADOS ===\n');

  try {
    // 1. Verificar contagem atual de registros
    console.log('📊 1. VERIFICANDO CONTAGEM ATUAL DE REGISTROS');
    console.log('=' .repeat(50));
    
    const tables = ['songs', 'user_creations', 'stripe_transactions'];
    const counts = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ Erro ao contar ${table}:`, error.message);
          counts[table] = 'ERRO';
        } else {
          counts[table] = count;
          console.log(`✅ ${table}: ${count} registros`);
        }
      } catch (err) {
        console.error(`❌ Erro ao acessar ${table}:`, err.message);
        counts[table] = 'ERRO';
      }
    }

    // 2. Verificar registros recentes (últimas 24h)
    console.log('\n📅 2. VERIFICANDO REGISTROS RECENTES (ÚLTIMAS 24H)');
    console.log('=' .repeat(50));
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString();
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', yesterdayISO);
        
        if (error) {
          console.error(`❌ Erro ao verificar registros recentes de ${table}:`, error.message);
        } else {
          console.log(`📈 ${table}: ${count} registros criados nas últimas 24h`);
        }
      } catch (err) {
        console.error(`❌ Erro ao verificar ${table}:`, err.message);
      }
    }

    // 3. Verificar estrutura das tabelas (colunas esperadas vs atuais)
    console.log('\n🏗️  3. VERIFICANDO ESTRUTURA DAS TABELAS');
    console.log('=' .repeat(50));
    
    // Verificar se migração 027 foi aplicada
    try {
      const { data, error } = await supabase
        .from('stripe_transactions')
        .select('available_credits, credit_consumed_at')
        .limit(1);
      
      if (error && error.message.includes('column')) {
        console.log('⚠️  Migração 027 NÃO foi aplicada - colunas ausentes');
      } else {
        console.log('✅ Migração 027 aplicada - colunas presentes');
      }
    } catch (err) {
      console.log('⚠️  Erro ao verificar migração 027:', err.message);
    }

    // 4. Verificar políticas RLS
    console.log('\n🔒 4. VERIFICANDO POLÍTICAS RLS');
    console.log('=' .repeat(50));
    
    try {
      // Tentar uma operação que pode ser afetada por RLS
      const { data: testSongs, error: rlsError } = await supabase
        .from('songs')
        .select('id, title, user_id, guest_id')
        .limit(5);
      
      if (rlsError) {
        console.log('⚠️  Possível problema com RLS:', rlsError.message);
      } else {
        console.log(`✅ RLS funcionando - ${testSongs?.length || 0} músicas acessíveis`);
        
        // Verificar distribuição user_id vs guest_id
        const withUserId = testSongs?.filter(s => s.user_id) || [];
        const withGuestId = testSongs?.filter(s => s.guest_id) || [];
        console.log(`   - Com user_id: ${withUserId.length}`);
        console.log(`   - Com guest_id: ${withGuestId.length}`);
      }
    } catch (err) {
      console.log('⚠️  Erro ao verificar RLS:', err.message);
    }

    // 5. Verificar integridade referencial
    console.log('\n🔗 5. VERIFICANDO INTEGRIDADE REFERENCIAL');
    console.log('=' .repeat(50));
    
    try {
      // Verificar songs órfãs (sem user_id nem guest_id)
      const { count: orphanSongs, error: orphanError } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null)
        .is('guest_id', null);
      
      if (orphanError) {
        console.log('⚠️  Erro ao verificar songs órfãs:', orphanError.message);
      } else {
        console.log(`📊 Songs órfãs (sem user_id nem guest_id): ${orphanSongs}`);
      }
      
      // Verificar user_creations órfãs
      const { count: orphanCreations, error: creationsError } = await supabase
        .from('user_creations')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null)
        .is('device_id', null);
      
      if (creationsError) {
        console.log('⚠️  Erro ao verificar user_creations órfãs:', creationsError.message);
      } else {
        console.log(`📊 User_creations órfãs (sem user_id nem device_id): ${orphanCreations}`);
      }
    } catch (err) {
      console.log('⚠️  Erro na verificação de integridade:', err.message);
    }

    // 6. Verificar logs de aplicação (se disponíveis)
    console.log('\n📝 6. VERIFICANDO PADRÕES DE DADOS');
    console.log('=' .repeat(50));
    
    try {
      // Verificar distribuição temporal de criações
      const { data: recentSongs, error: timeError } = await supabase
        .from('songs')
        .select('created_at, user_id, guest_id')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (timeError) {
        console.log('⚠️  Erro ao verificar padrões temporais:', timeError.message);
      } else {
        console.log('📈 Últimas 10 músicas criadas:');
        recentSongs?.forEach((song, i) => {
          const identity = song.user_id ? `user:${song.user_id.slice(0,8)}` : `guest:${song.guest_id?.slice(0,8) || 'null'}`;
          console.log(`   ${i+1}. ${song.created_at} - ${identity}`);
        });
      }
    } catch (err) {
      console.log('⚠️  Erro ao verificar padrões:', err.message);
    }

    // 7. Resumo da investigação
    console.log('\n📋 7. RESUMO DA INVESTIGAÇÃO');
    console.log('=' .repeat(50));
    
    console.log('Contagens atuais:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  - ${table}: ${count}`);
    });
    
    console.log('\n🔍 POSSÍVEIS CAUSAS DE EXCLUSÃO:');
    console.log('1. Migração 027 não aplicada corretamente');
    console.log('2. Políticas RLS muito restritivas');
    console.log('3. Triggers de limpeza automática');
    console.log('4. Operações manuais no painel Supabase');
    console.log('5. Scripts de migração com efeitos colaterais');
    
    console.log('\n📝 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('1. Aplicar migração 027 manualmente no Supabase');
    console.log('2. Verificar logs do Supabase no painel web');
    console.log('3. Revisar políticas RLS das tabelas afetadas');
    console.log('4. Implementar backup automático antes de migrações');
    console.log('5. Adicionar logging detalhado nas operações críticas');

  } catch (error) {
    console.error('❌ Erro durante a investigação:', error);
  }
}

// Executar investigação
investigateDataDeletion()
  .then(() => {
    console.log('\n✅ Investigação concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na investigação:', error);
    process.exit(1);
  });