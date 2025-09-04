#!/usr/bin/env node

/**
 * Script para adicionar coluna device_id à tabela users
 * Versão simplificada usando apenas operações básicas do Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  console.log('Verifique seu arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('🔗 Testando conexão com Supabase...');
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Conexão com Supabase OK');
    return true;
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    console.log('Verifique suas credenciais do Supabase no arquivo .env');
    return false;
  }
}

async function checkIfColumnExists() {
  try {
    console.log('🔍 Testando se a coluna device_id já existe...');
    
    // Tentar fazer uma query que usa a coluna device_id
    const { data, error } = await supabase
      .from('users')
      .select('device_id')
      .limit(1);
    
    if (error) {
      // Se der erro, provavelmente a coluna não existe
      if (error.message.includes('column "device_id" does not exist')) {
        console.log('📝 Coluna device_id não existe - precisa ser criada');
        return false;
      }
      throw error;
    }
    
    console.log('✅ Coluna device_id já existe');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao verificar coluna:', error.message);
    return false;
  }
}

async function showManualInstructions() {
  console.log('\n📋 INSTRUÇÕES PARA ADICIONAR A COLUNA MANUALMENTE:');
  console.log('=' .repeat(60));
  
  console.log('\n🌐 OPÇÃO 1: Via Supabase Dashboard (SQL Editor)');
  console.log('1. Acesse: https://supabase.com/dashboard');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá em "SQL Editor" > "New query"');
  console.log('4. Cole e execute este SQL:');
  console.log('\n```sql');
  console.log('ALTER TABLE users ADD COLUMN device_id TEXT;');
  console.log('CREATE INDEX idx_users_device_id ON users(device_id);');
  console.log('```');
  
  console.log('\n🔧 OPÇÃO 2: Via Table Editor (Mais Simples)');
  console.log('1. Vá em "Table Editor" > tabela "users"');
  console.log('2. Clique em "+ Add column"');
  console.log('3. Nome: device_id');
  console.log('4. Tipo: text');
  console.log('5. Nullable: ✅ (marcado)');
  console.log('6. Clique em "Save"');
  
  console.log('\n⚠️  IMPORTANTE:');
  console.log('- Use o SERVICE_ROLE_KEY, não o ANON_KEY');
  console.log('- Se der erro de "snippet", limpe o cache do navegador');
  console.log('- Consulte o arquivo SUPABASE_MIGRATION_GUIDE.md para mais opções');
}

async function testAfterMigration() {
  try {
    console.log('\n🧪 Testando se a migração foi aplicada...');
    
    const { data, error } = await supabase
      .from('users')
      .select('id, device_id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column "device_id" does not exist')) {
        console.log('❌ A coluna device_id ainda não foi criada');
        return false;
      }
      throw error;
    }
    
    console.log('✅ Migração aplicada com sucesso!');
    console.log('✅ A coluna device_id está disponível na tabela users');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Script de Migração: Adicionar coluna device_id');
  console.log('=' .repeat(50));
  
  // Testar conexão primeiro
  const connectionOk = await testConnection();
  if (!connectionOk) {
    process.exit(1);
  }
  
  // Verificar se a coluna já existe
  const columnExists = await checkIfColumnExists();
  
  if (columnExists) {
    console.log('\n🎉 A coluna device_id já existe! Nenhuma ação necessária.');
    process.exit(0);
  }
  
  // Mostrar instruções manuais
  await showManualInstructions();
  
  console.log('\n🔄 Aguardando você aplicar a migração...');
  console.log('Pressione Ctrl+C para sair ou execute novamente após aplicar a migração.');
  
  // Aguardar e testar periodicamente
  let attempts = 0;
  const maxAttempts = 30; // 5 minutos (10 segundos * 30)
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Aguardar 10 segundos
    attempts++;
    
    console.log(`\n🔍 Tentativa ${attempts}/${maxAttempts} - Verificando migração...`);
    
    const migrationApplied = await testAfterMigration();
    
    if (migrationApplied) {
      console.log('\n🎉 Migração detectada e validada com sucesso!');
      console.log('\nPróximos passos:');
      console.log('1. Testar a aplicação');
      console.log('2. Verificar se o frontend está enviando X-Device-ID');
      console.log('3. Confirmar se o backend está salvando device_id');
      process.exit(0);
    }
  }
  
  console.log('\n⏰ Tempo limite atingido. Execute o script novamente após aplicar a migração.');
  process.exit(1);
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  testConnection,
  checkIfColumnExists,
  testAfterMigration
};