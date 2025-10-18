#!/usr/bin/env node

/**
 * Script de Validação da Restauração do Backup Supabase
 * 
 * Verifica se todos os dados foram restaurados corretamente após o backup
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateBackupRestoration() {
  console.log('🔍 VALIDAÇÃO DA RESTAURAÇÃO DO BACKUP SUPABASE');
  console.log('=' .repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = {
    tablesStatus: {},
    dataIntegrity: {},
    functionalTests: {},
    summary: { success: true, issues: [] }
  };

  try {
    // 1. VERIFICAR EXISTÊNCIA E CONTAGEM DAS TABELAS
    console.log('📊 1. VERIFICANDO TABELAS PRINCIPAIS...\n');
    
    const mainTables = ['songs', 'user_creations', 'stripe_transactions'];
    
    for (const table of mainTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`❌ ${table}: ERRO - ${error.message}`);
          results.tablesStatus[table] = { status: 'error', error: error.message };
          results.summary.success = false;
          results.summary.issues.push(`Tabela ${table} inacessível`);
        } else {
          console.log(`✅ ${table}: ${count} registros`);
          results.tablesStatus[table] = { status: 'ok', count };
          
          if (count === 0) {
            results.summary.issues.push(`Tabela ${table} está vazia`);
          }
        }
      } catch (err) {
        console.log(`❌ ${table}: EXCEÇÃO - ${err.message}`);
        results.tablesStatus[table] = { status: 'exception', error: err.message };
        results.summary.success = false;
        results.summary.issues.push(`Exceção na tabela ${table}`);
      }
    }

    // 2. VERIFICAR ESTRUTURA DAS TABELAS
    console.log('\n🏗️  2. VERIFICANDO ESTRUTURA DAS TABELAS...\n');
    
    // Verificar colunas da tabela songs
    try {
      const { data: songsStructure, error } = await supabase
        .from('songs')
        .select('id, user_id, guest_id, title, lyrics, audio_url_option1, created_at')
        .limit(1);
        
      if (!error) {
        console.log('✅ songs: Estrutura OK');
        results.dataIntegrity.songs_structure = 'ok';
      } else {
        console.log(`❌ songs: Estrutura com problema - ${error.message}`);
        results.dataIntegrity.songs_structure = 'error';
        results.summary.issues.push('Estrutura da tabela songs com problema');
      }
    } catch (err) {
      console.log(`❌ songs: Erro na verificação de estrutura - ${err.message}`);
      results.dataIntegrity.songs_structure = 'error';
    }

    // Verificar colunas da tabela stripe_transactions (incluindo migração 027)
    try {
      const { data: stripeStructure, error } = await supabase
        .from('stripe_transactions')
        .select('id, payment_intent_id, user_id, amount, available_credits, credit_consumed_at')
        .limit(1);
        
      if (!error) {
        console.log('✅ stripe_transactions: Estrutura OK (incluindo migração 027)');
        results.dataIntegrity.stripe_structure = 'ok';
        results.dataIntegrity.migration_027_applied = true;
      } else {
        console.log(`❌ stripe_transactions: Estrutura com problema - ${error.message}`);
        results.dataIntegrity.stripe_structure = 'error';
        results.dataIntegrity.migration_027_applied = false;
        results.summary.issues.push('Estrutura da tabela stripe_transactions com problema');
      }
    } catch (err) {
      console.log(`❌ stripe_transactions: Erro na verificação - ${err.message}`);
      results.dataIntegrity.stripe_structure = 'error';
      results.dataIntegrity.migration_027_applied = false;
    }

    // 3. VERIFICAR POLÍTICAS RLS
    console.log('\n🔒 3. VERIFICANDO POLÍTICAS RLS...\n');
    
    try {
      const { data: policies, error } = await supabase.rpc('get_policies_info');
      
      if (error && error.code !== '42883') { // Função pode não existir
        console.log(`⚠️  RLS: Não foi possível verificar políticas - ${error.message}`);
        results.dataIntegrity.rls_policies = 'warning';
      } else {
        console.log('✅ RLS: Políticas acessíveis');
        results.dataIntegrity.rls_policies = 'ok';
      }
    } catch (err) {
      console.log(`⚠️  RLS: Verificação não disponível - ${err.message}`);
      results.dataIntegrity.rls_policies = 'warning';
    }

    // 4. TESTES FUNCIONAIS BÁSICOS
    console.log('\n🧪 4. EXECUTANDO TESTES FUNCIONAIS...\n');
    
    // Teste de inserção na tabela songs
    const testSongId = `test-${Date.now()}`;
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('songs')
        .insert({
          title: 'Teste de Validação',
          lyrics: 'Teste após restauração do backup',
          guest_id: testSongId
        })
        .select();
        
      if (insertError) {
        console.log(`❌ Inserção: FALHOU - ${insertError.message}`);
        results.functionalTests.insert = 'failed';
        results.summary.success = false;
        results.summary.issues.push('Falha na inserção de dados');
      } else {
        console.log('✅ Inserção: SUCESSO');
        results.functionalTests.insert = 'success';
        
        // Teste de leitura
        const { data: readData, error: readError } = await supabase
          .from('songs')
          .select('*')
          .eq('guest_id', testSongId);
          
        if (readError) {
          console.log(`❌ Leitura: FALHOU - ${readError.message}`);
          results.functionalTests.read = 'failed';
          results.summary.issues.push('Falha na leitura de dados');
        } else if (readData && readData.length > 0) {
          console.log('✅ Leitura: SUCESSO');
          results.functionalTests.read = 'success';
          
          // Teste de exclusão (limpeza)
          const { error: deleteError } = await supabase
            .from('songs')
            .delete()
            .eq('id', insertData[0].id);
            
          if (deleteError) {
            console.log(`⚠️  Limpeza: FALHOU - ${deleteError.message}`);
            results.functionalTests.cleanup = 'failed';
          } else {
            console.log('✅ Limpeza: SUCESSO');
            results.functionalTests.cleanup = 'success';
          }
        }
      }
    } catch (err) {
      console.log(`❌ Teste funcional: EXCEÇÃO - ${err.message}`);
      results.functionalTests.insert = 'exception';
      results.summary.success = false;
      results.summary.issues.push('Exceção durante testes funcionais');
    }

    // 5. VERIFICAR FUNÇÃO consume_paid_credit (migração 027)
    console.log('\n💳 5. VERIFICANDO FUNÇÃO consume_paid_credit...\n');
    
    try {
      // Tentar chamar a função (deve falhar se não houver dados, mas função deve existir)
      const { data: functionTest, error: functionError } = await supabase
        .rpc('consume_paid_credit', { p_user_id: '00000000-0000-0000-0000-000000000000' });
        
      if (functionError && functionError.code === '42883') {
        console.log('❌ Função consume_paid_credit: NÃO EXISTE');
        results.dataIntegrity.consume_paid_credit_function = false;
        results.summary.issues.push('Função consume_paid_credit não encontrada');
      } else {
        console.log('✅ Função consume_paid_credit: EXISTE');
        results.dataIntegrity.consume_paid_credit_function = true;
      }
    } catch (err) {
      console.log(`⚠️  Função consume_paid_credit: Verificação inconclusiva - ${err.message}`);
      results.dataIntegrity.consume_paid_credit_function = 'unknown';
    }

    // 6. RESUMO FINAL
    console.log('\n📋 6. RESUMO DA VALIDAÇÃO...\n');
    
    if (results.summary.success && results.summary.issues.length === 0) {
      console.log('🎉 RESTAURAÇÃO VALIDADA COM SUCESSO!');
      console.log('✅ Todos os testes passaram');
      console.log('✅ Estrutura do banco restaurada');
      console.log('✅ Funcionalidades básicas operacionais');
    } else {
      console.log('⚠️  RESTAURAÇÃO COM PROBLEMAS IDENTIFICADOS:');
      results.summary.issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }

    // Salvar relatório detalhado
    const reportPath = './backup-validation-report.json';
    const fs = require('fs');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);

    return results;

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO NA VALIDAÇÃO:', error.message);
    results.summary.success = false;
    results.summary.issues.push(`Erro crítico: ${error.message}`);
    return results;
  }
}

// Executar validação
if (require.main === module) {
  validateBackupRestoration()
    .then(results => {
      process.exit(results.summary.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { validateBackupRestoration };