#!/usr/bin/env node

/**
 * Script de Diagnóstico Completo do Supabase
 * Testa todas as funcionalidades e identifica problemas de conexão
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Cores para output
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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

// Configurações
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

async function checkEnvironmentVariables() {
  logSection('🔧 VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE');
  
  const checks = [
    { name: 'SUPABASE_URL', value: supabaseUrl },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: supabaseServiceKey },
    { name: 'SUPABASE_ANON_KEY', value: supabaseAnonKey },
    { name: 'NODE_ENV', value: process.env.NODE_ENV },
    { name: 'PORT', value: process.env.PORT }
  ];
  
  let allValid = true;
  
  for (const check of checks) {
    if (check.value) {
      log(`✅ ${check.name}: ${check.value.substring(0, 20)}...`, 'green');
    } else {
      log(`❌ ${check.name}: NÃO CONFIGURADA`, 'red');
      allValid = false;
    }
  }
  
  return allValid;
}

async function testNetworkConnectivity() {
  logSection('🌐 TESTE DE CONECTIVIDADE DE REDE');
  
  try {
    log('Testando conectividade com Supabase...', 'blue');
    const response = await fetch(supabaseUrl, {
      method: 'GET',
      timeout: 10000
    });
    
    log(`✅ Status HTTP: ${response.status}`, 'green');
    log(`✅ Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erro de conectividade: ${error.message}`, 'red');
    return false;
  }
}

async function testSupabaseAuth() {
  logSection('🔐 TESTE DE AUTENTICAÇÃO SUPABASE');
  
  // Teste com Service Role Key
  try {
    log('Testando Service Role Key...', 'blue');
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await serviceClient
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      log(`❌ Service Role Error: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ Service Role Key funcionando', 'green');
  } catch (error) {
    log(`❌ Service Role Exception: ${error.message}`, 'red');
    return false;
  }
  
  // Teste com Anon Key
  try {
    log('Testando Anon Key...', 'blue');
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await anonClient
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      log(`⚠️ Anon Key Error (esperado se RLS ativo): ${error.message}`, 'yellow');
    } else {
      log('✅ Anon Key funcionando', 'green');
    }
  } catch (error) {
    log(`❌ Anon Key Exception: ${error.message}`, 'red');
  }
  
  return true;
}

async function checkTableStructure() {
  logSection('📋 VERIFICAÇÃO DE ESTRUTURA DAS TABELAS');
  
  const client = createClient(supabaseUrl, supabaseServiceKey);
  const tables = ['users', 'songs', 'mvp_feedback'];
  
  for (const tableName of tables) {
    try {
      log(`Verificando tabela: ${tableName}`, 'blue');
      
      // Verificar se a tabela existe
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        log(`❌ Erro na tabela ${tableName}: ${error.message}`, 'red');
        continue;
      }
      
      log(`✅ Tabela ${tableName} acessível`, 'green');
      
      // Contar registros
      const { count, error: countError } = await client
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        log(`⚠️ Erro ao contar ${tableName}: ${countError.message}`, 'yellow');
      } else {
        log(`📊 Registros em ${tableName}: ${count}`, 'blue');
      }
      
    } catch (error) {
      log(`❌ Exception na tabela ${tableName}: ${error.message}`, 'red');
    }
  }
}

async function testCRUDOperations() {
  logSection('🔄 TESTE DE OPERAÇÕES CRUD');
  
  const client = createClient(supabaseUrl, supabaseServiceKey);
  const testDeviceId = `test-diagnostic-${Date.now()}`;
  
  try {
    // CREATE - Inserir usuário de teste
    log('Testando INSERT...', 'blue');
    const { data: insertData, error: insertError } = await client
      .from('users')
      .insert({
        device_id: testDeviceId,
        freesongsused: 0,
        last_used_ip: '127.0.0.1'
      })
      .select()
      .single();
    
    if (insertError) {
      log(`❌ Erro no INSERT: ${insertError.message}`, 'red');
      return false;
    }
    
    log(`✅ INSERT bem-sucedido: ID ${insertData.id}`, 'green');
    const testUserId = insertData.id;
    
    // READ - Ler usuário
    log('Testando SELECT...', 'blue');
    const { data: selectData, error: selectError } = await client
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (selectError) {
      log(`❌ Erro no SELECT: ${selectError.message}`, 'red');
    } else {
      log(`✅ SELECT bem-sucedido: ${JSON.stringify(selectData)}`, 'green');
    }
    
    // UPDATE - Atualizar usuário
    log('Testando UPDATE...', 'blue');
    const { data: updateData, error: updateError } = await client
      .from('users')
      .update({ freesongsused: 1 })
      .eq('id', testUserId)
      .select()
      .single();
    
    if (updateError) {
      log(`❌ Erro no UPDATE: ${updateError.message}`, 'red');
    } else {
      log(`✅ UPDATE bem-sucedido: freesongsused = ${updateData.freesongsused}`, 'green');
    }
    
    // DELETE - Remover usuário de teste
    log('Testando DELETE...', 'blue');
    const { error: deleteError } = await client
      .from('users')
      .delete()
      .eq('id', testUserId);
    
    if (deleteError) {
      log(`❌ Erro no DELETE: ${deleteError.message}`, 'red');
    } else {
      log(`✅ DELETE bem-sucedido`, 'green');
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Exception durante CRUD: ${error.message}`, 'red');
    return false;
  }
}

async function checkRLSPolicies() {
  logSection('🛡️ VERIFICAÇÃO DE POLÍTICAS RLS');
  
  const client = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Testar RLS tentando acessar tabelas com cliente anônimo
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    
    log('Testando RLS na tabela users...', 'blue');
    const { data: usersData, error: usersError } = await anonClient
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError && usersError.code === 'PGRST116') {
      log('  users: 🔒 RLS ATIVO (acesso negado para anon)', 'green');
    } else if (usersError) {
      log(`  users: ❓ Erro inesperado: ${usersError.message}`, 'yellow');
    } else {
      log('  users: 🔓 RLS pode estar inativo (acesso permitido)', 'yellow');
    }
    
    log('Testando RLS na tabela songs...', 'blue');
    const { data: songsData, error: songsError } = await anonClient
      .from('songs')
      .select('id')
      .limit(1);
    
    if (songsError && songsError.code === 'PGRST116') {
      log('  songs: 🔒 RLS ATIVO (acesso negado para anon)', 'green');
    } else if (songsError) {
      log(`  songs: ❓ Erro inesperado: ${songsError.message}`, 'yellow');
    } else {
      log('  songs: 🔓 RLS pode estar inativo (acesso permitido)', 'yellow');
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Exception ao verificar RLS: ${error.message}`, 'red');
    return false;
  }
}

async function checkPermissions() {
  logSection('👥 VERIFICAÇÃO DE PERMISSÕES');
  
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    log('Testando permissões do Service Role...', 'blue');
    
    // Testar permissões do service role (deve ter acesso total)
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('users')
      .select('count')
      .limit(1);
    
    if (serviceError) {
      log(`❌ Service Role sem acesso: ${serviceError.message}`, 'red');
      return false;
    } else {
      log('✅ Service Role: Acesso total confirmado', 'green');
    }
    
    log('Testando permissões do Anon Key...', 'blue');
    
    // Testar permissões do anon key
    const { data: anonData, error: anonError } = await anonClient
      .from('users')
      .select('count')
      .limit(1);
    
    if (anonError) {
      if (anonError.code === 'PGRST116') {
        log('✅ Anon Key: Acesso restrito por RLS (comportamento esperado)', 'green');
      } else {
        log(`❌ Anon Key: Erro inesperado: ${anonError.message}`, 'red');
      }
    } else {
      log('⚠️ Anon Key: Acesso permitido (verifique políticas RLS)', 'yellow');
    }
    
    // Testar operações básicas com service role
    log('Testando operações CRUD com Service Role...', 'blue');
    
    const testOperations = [
      { table: 'users', operation: 'SELECT' },
      { table: 'songs', operation: 'SELECT' },
      { table: 'mvp_feedback', operation: 'SELECT' }
    ];
    
    for (const test of testOperations) {
      const { data, error } = await serviceClient
        .from(test.table)
        .select('count')
        .limit(1);
      
      if (error) {
        log(`❌ ${test.table}: ${error.message}`, 'red');
      } else {
        log(`✅ ${test.table}: Acesso confirmado`, 'green');
      }
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Exception ao verificar permissões: ${error.message}`, 'red');
    return false;
  }
}

async function testConnectionStability() {
  logSection('⏱️ TESTE DE ESTABILIDADE DA CONEXÃO');
  
  const client = createClient(supabaseUrl, supabaseServiceKey);
  const iterations = 5;
  let successCount = 0;
  
  for (let i = 1; i <= iterations; i++) {
    try {
      log(`Teste ${i}/${iterations}...`, 'blue');
      
      const start = Date.now();
      const { data, error } = await client
        .from('users')
        .select('count')
        .limit(1);
      const duration = Date.now() - start;
      
      if (error) {
        log(`❌ Teste ${i} falhou: ${error.message}`, 'red');
      } else {
        log(`✅ Teste ${i} sucesso (${duration}ms)`, 'green');
        successCount++;
      }
      
      // Aguardar 1 segundo entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      log(`❌ Teste ${i} exception: ${error.message}`, 'red');
    }
  }
  
  const successRate = (successCount / iterations) * 100;
  log(`📊 Taxa de sucesso: ${successRate}% (${successCount}/${iterations})`, 
      successRate >= 80 ? 'green' : 'red');
  
  return successRate >= 80;
}

async function generateReport() {
  logSection('📊 RELATÓRIO FINAL');
  
  const results = {
    environment: await checkEnvironmentVariables(),
    network: await testNetworkConnectivity(),
    auth: await testSupabaseAuth(),
    tables: await checkTableStructure(),
    crud: await testCRUDOperations(),
    rls: await checkRLSPolicies(),
    permissions: await checkPermissions(),
    stability: await testConnectionStability()
  };
  
  console.log('\n' + '='.repeat(60));
  log('RESUMO DO DIAGNÓSTICO', 'bold');
  console.log('='.repeat(60));
  
  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅ PASSOU' : '❌ FALHOU';
    const color = result ? 'green' : 'red';
    log(`${test.toUpperCase().padEnd(15)}: ${status}`, color);
  }
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const overallScore = (passedTests / totalTests) * 100;
  
  console.log('\n' + '-'.repeat(60));
  log(`SCORE GERAL: ${overallScore.toFixed(1)}% (${passedTests}/${totalTests})`, 
      overallScore >= 80 ? 'green' : 'red');
  
  if (overallScore < 80) {
    log('\n🚨 AÇÃO NECESSÁRIA:', 'red');
    log('- Verifique as configurações que falharam', 'yellow');
    log('- Execute as correções sugeridas', 'yellow');
    log('- Execute este diagnóstico novamente', 'yellow');
  } else {
    log('\n🎉 SUPABASE FUNCIONANDO CORRETAMENTE!', 'green');
  }
  
  return overallScore >= 80;
}

// Executar diagnóstico
async function main() {
  log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DO SUPABASE', 'bold');
  
  try {
    const success = await generateReport();
    process.exit(success ? 0 : 1);
  } catch (error) {
    log(`❌ Erro fatal durante diagnóstico: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();