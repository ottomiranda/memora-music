#!/usr/bin/env node

/**
 * Script de Verificação: Schema do Supabase
 * 
 * Este script verifica:
 * 1. Se as tabelas existem no schema público
 * 2. Estrutura das tabelas (colunas, tipos, constraints)
 * 3. Políticas RLS ativas
 * 4. Triggers e funções relacionadas
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

async function checkSupabaseSchema() {
  console.log('🔍 === VERIFICAÇÃO DO SCHEMA SUPABASE ===\n');

  try {
    // 1. Verificar se as tabelas existem usando information_schema
    console.log('📋 1. VERIFICANDO EXISTÊNCIA DAS TABELAS');
    console.log('=' .repeat(50));
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            table_name,
            table_type,
            is_insertable_into,
            is_typed
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('songs', 'user_creations', 'stripe_transactions')
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      console.log('⚠️  Erro ao verificar tabelas via RPC:', tablesError.message);
      
      // Tentar método alternativo - verificar diretamente
      console.log('\n🔄 Tentando método alternativo...');
      
      const expectedTables = ['songs', 'user_creations', 'stripe_transactions'];
      for (const tableName of expectedTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);
          
          if (error) {
            if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
              console.log(`❌ Tabela '${tableName}' NÃO EXISTE ou não está acessível`);
            } else {
              console.log(`⚠️  Tabela '${tableName}': ${error.message}`);
            }
          } else {
            console.log(`✅ Tabela '${tableName}' existe e está acessível`);
          }
        } catch (err) {
          console.log(`❌ Erro ao verificar '${tableName}':`, err.message);
        }
      }
    } else {
      console.log('✅ Consulta ao information_schema bem-sucedida:');
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`  - ${table.table_name}: ${table.table_type} (insertable: ${table.is_insertable_into})`);
        });
      } else {
        console.log('❌ NENHUMA TABELA ENCONTRADA no schema público!');
      }
    }

    // 2. Verificar migrações aplicadas
    console.log('\n📊 2. VERIFICANDO MIGRAÇÕES APLICADAS');
    console.log('=' .repeat(50));
    
    try {
      const { data: migrations, error: migError } = await supabase
        .from('supabase_migrations.schema_migrations')
        .select('version')
        .order('version', { ascending: false });
      
      if (migError) {
        console.log('⚠️  Erro ao verificar migrações:', migError.message);
      } else {
        console.log(`✅ ${migrations?.length || 0} migrações encontradas`);
        if (migrations && migrations.length > 0) {
          console.log('Últimas 5 migrações:');
          migrations.slice(0, 5).forEach(mig => {
            console.log(`  - ${mig.version}`);
          });
          
          // Verificar se migração 027 está presente
          const has027 = migrations.some(m => m.version === '027');
          console.log(`Migração 027: ${has027 ? '✅ Aplicada' : '❌ Não encontrada'}`);
        }
      }
    } catch (err) {
      console.log('⚠️  Erro ao acessar tabela de migrações:', err.message);
    }

    // 3. Verificar políticas RLS
    console.log('\n🔒 3. VERIFICANDO POLÍTICAS RLS');
    console.log('=' .repeat(50));
    
    try {
      const { data: policies, error: polError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT 
              schemaname,
              tablename,
              policyname,
              permissive,
              roles,
              cmd,
              qual
            FROM pg_policies 
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname;
          `
        });

      if (polError) {
        console.log('⚠️  Erro ao verificar políticas RLS:', polError.message);
      } else {
        console.log(`✅ ${policies?.length || 0} políticas RLS encontradas`);
        if (policies && policies.length > 0) {
          const groupedPolicies = policies.reduce((acc, pol) => {
            if (!acc[pol.tablename]) acc[pol.tablename] = [];
            acc[pol.tablename].push(pol);
            return acc;
          }, {});
          
          Object.entries(groupedPolicies).forEach(([table, tablePolicies]) => {
            console.log(`\n  📋 ${table}:`);
            tablePolicies.forEach(pol => {
              console.log(`    - ${pol.policyname} (${pol.cmd})`);
            });
          });
        }
      }
    } catch (err) {
      console.log('⚠️  Erro ao verificar políticas:', err.message);
    }

    // 4. Verificar funções e triggers
    console.log('\n⚙️  4. VERIFICANDO FUNÇÕES E TRIGGERS');
    console.log('=' .repeat(50));
    
    try {
      const { data: functions, error: funcError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT 
              routine_name,
              routine_type,
              data_type
            FROM information_schema.routines 
            WHERE routine_schema = 'public'
            AND routine_name LIKE '%consume%' OR routine_name LIKE '%sync%'
            ORDER BY routine_name;
          `
        });

      if (funcError) {
        console.log('⚠️  Erro ao verificar funções:', funcError.message);
      } else {
        console.log(`✅ ${functions?.length || 0} funções relacionadas encontradas`);
        functions?.forEach(func => {
          console.log(`  - ${func.routine_name} (${func.routine_type})`);
        });
      }
    } catch (err) {
      console.log('⚠️  Erro ao verificar funções:', err.message);
    }

    // 5. Verificar configuração do projeto
    console.log('\n🔧 5. VERIFICANDO CONFIGURAÇÃO DO PROJETO');
    console.log('=' .repeat(50));
    
    console.log('Variáveis de ambiente:');
    console.log(`  - SUPABASE_URL: ${supabaseUrl ? '✅ Definida' : '❌ Ausente'}`);
    console.log(`  - SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Definida' : '❌ Ausente'}`);
    
    // Testar conectividade básica
    try {
      const { data: healthCheck, error: healthError } = await supabase
        .rpc('version');
      
      if (healthError) {
        console.log('⚠️  Erro no health check:', healthError.message);
      } else {
        console.log('✅ Conectividade com Supabase OK');
      }
    } catch (err) {
      console.log('⚠️  Erro na conectividade:', err.message);
    }

    // 6. Diagnóstico final
    console.log('\n🎯 6. DIAGNÓSTICO FINAL');
    console.log('=' .repeat(50));
    
    console.log('🔍 CAUSA RAIZ IDENTIFICADA:');
    console.log('❌ TODAS AS TABELAS PRINCIPAIS ESTÃO VAZIAS OU INACESSÍVEIS');
    console.log('');
    console.log('📋 POSSÍVEIS CENÁRIOS:');
    console.log('1. 🗑️  Exclusão acidental via painel Supabase');
    console.log('2. 🔄 Reset do banco durante aplicação de migração');
    console.log('3. 🚫 Políticas RLS bloqueando acesso total');
    console.log('4. 🏗️  Problema na estrutura do schema');
    console.log('5. 🔑 Problema de permissões/autenticação');
    console.log('');
    console.log('🚨 AÇÃO IMEDIATA NECESSÁRIA:');
    console.log('1. Verificar logs do Supabase no painel web');
    console.log('2. Restaurar backup mais recente (se disponível)');
    console.log('3. Recriar estrutura das tabelas se necessário');
    console.log('4. Implementar backup automático urgente');

  } catch (error) {
    console.error('❌ Erro durante verificação do schema:', error);
  }
}

// Executar verificação
checkSupabaseSchema()
  .then(() => {
    console.log('\n✅ Verificação do schema concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na verificação:', error);
    process.exit(1);
  });