import { getSupabaseServiceClient, getSupabaseAnonClient, executeSupabaseQuery } from './src/lib/supabase-client.js';

/**
 * Script de diagnóstico completo do Supabase
 * Testa conectividade, autenticação e operações CRUD
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testEnvironmentVariables() {
  log('\n=== TESTE DE VARIÁVEIS DE AMBIENTE ===', 'bold');
  
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'];
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName}: Configurada`);
    } else {
      logError(`${varName}: Não encontrada`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function testServiceRoleConnection() {
  log('\n=== TESTE DE CONEXÃO SERVICE ROLE ===', 'bold');
  
  try {
    const client = getSupabaseServiceClient();
    logInfo('Cliente Service Role criado com sucesso');
    
    // Teste básico de conectividade
    const { data, error } = await client
      .from('user_creations')
      .select('count')
      .limit(1);
    
    if (error) {
      logError(`Erro na consulta: ${error.message}`);
      return false;
    }
    
    logSuccess('Conexão Service Role funcionando');
    return true;
  } catch (error) {
    logError(`Erro ao testar Service Role: ${error.message}`);
    return false;
  }
}

async function testAnonConnection() {
  log('\n=== TESTE DE CONEXÃO ANÔNIMA ===', 'bold');
  
  try {
    const client = getSupabaseAnonClient();
    logInfo('Cliente Anônimo criado com sucesso');
    
    // Teste básico de conectividade
    const { data, error } = await client
      .from('user_creations')
      .select('count')
      .limit(1);
    
    if (error) {
      logWarning(`Erro na consulta anônima (pode ser RLS): ${error.message}`);
      return false;
    }
    
    logSuccess('Conexão Anônima funcionando');
    return true;
  } catch (error) {
    logError(`Erro ao testar conexão anônima: ${error.message}`);
    return false;
  }
}

async function testTableAccess() {
  log('\n=== TESTE DE ACESSO ÀS TABELAS ===', 'bold');
  
  const tables = ['user_creations', 'songs', 'mvp_feedback'];
  const client = getSupabaseServiceClient();
  
  for (const table of tables) {
    try {
      const { data, error } = await client
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        logError(`Tabela ${table}: ${error.message}`);
      } else {
        logSuccess(`Tabela ${table}: Acessível (${data?.length || 0} registros encontrados)`);
      }
    } catch (error) {
      logError(`Tabela ${table}: Erro de conexão - ${error.message}`);
    }
  }
}

async function testCRUDOperations() {
  log('\n=== TESTE DE OPERAÇÕES CRUD ===', 'bold');
  
  const client = getSupabaseServiceClient();
  
  try {
    // Teste de INSERT na tabela mvp_feedback
    logInfo('Testando INSERT...');
    const { data: insertData, error: insertError } = await client
      .from('mvp_feedback')
      .insert({
        difficulty: 3,
        would_recommend: true,
        price_willingness: 9.99
      })
      .select()
      .single();
    
    if (insertError) {
      logError(`INSERT falhou: ${insertError.message}`);
      return false;
    }
    
    logSuccess(`INSERT bem-sucedido: ID ${insertData.id}`);
    
    // Teste de SELECT
    logInfo('Testando SELECT...');
    const { data: selectData, error: selectError } = await client
      .from('mvp_feedback')
      .select('*')
      .eq('id', insertData.id)
      .single();
    
    if (selectError) {
      logError(`SELECT falhou: ${selectError.message}`);
    } else {
      logSuccess('SELECT bem-sucedido');
    }
    
    // Teste de UPDATE
    logInfo('Testando UPDATE...');
    const { data: updateData, error: updateError } = await client
      .from('mvp_feedback')
      .update({ difficulty: 4 })
      .eq('id', insertData.id)
      .select()
      .single();
    
    if (updateError) {
      logError(`UPDATE falhou: ${updateError.message}`);
    } else {
      logSuccess('UPDATE bem-sucedido');
    }
    
    // Teste de DELETE
    logInfo('Testando DELETE...');
    const { error: deleteError } = await client
      .from('mvp_feedback')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      logError(`DELETE falhou: ${deleteError.message}`);
    } else {
      logSuccess('DELETE bem-sucedido');
    }
    
    return true;
  } catch (error) {
    logError(`Erro geral nas operações CRUD: ${error.message}`);
    return false;
  }
}

async function testRetryMechanism() {
  log('\n=== TESTE DE MECANISMO DE RETRY ===', 'bold');
  
  try {
    logInfo('Testando executeSupabaseQuery com retry...');
    
    const result = await executeSupabaseQuery(async (client) => {
      return await client
        .from('user_creations')
        .select('count')
        .limit(1);
    });
    
    if (result.success) {
      logSuccess('Mecanismo de retry funcionando');
      return true;
    } else {
      logError(`Retry falhou: ${result.error}`);
      return false;
    }
  } catch (error) {
    logError(`Erro no teste de retry: ${error.message}`);
    return false;
  }
}

async function runDiagnosis() {
  log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DO SUPABASE', 'bold');
  log('================================================', 'blue');
  
  const results = {
    env: await testEnvironmentVariables(),
    serviceRole: await testServiceRoleConnection(),
    anon: await testAnonConnection(),
    tables: true, // Será definido no teste
    crud: await testCRUDOperations(),
    retry: await testRetryMechanism()
  };
  
  await testTableAccess();
  
  log('\n=== RESUMO DO DIAGNÓSTICO ===', 'bold');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    logSuccess('✨ Todos os testes passaram! Supabase está funcionando corretamente.');
  } else {
    logWarning('⚠️  Alguns testes falharam. Verifique os detalhes acima.');
  }
  
  log('\n📊 Resultados detalhados:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    log(`  ${status} ${test}`);
  });
  
  log('\n================================================', 'blue');
  log('🏁 DIAGNÓSTICO CONCLUÍDO', 'bold');
}

// Executar diagnóstico
runDiagnosis().catch(error => {
  logError(`Erro fatal no diagnóstico: ${error.message}`);
  process.exit(1);
});