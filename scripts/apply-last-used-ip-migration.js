import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase usando service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyLastUsedIpMigration() {
  try {
    console.log('🔄 Aplicando migração para adicionar coluna last_used_ip...');
    
    // Testar conectividade
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro de conectividade:', testError.message);
      process.exit(1);
    }
    
    console.log('✅ Conectividade com Supabase OK');
    
    // Verificar se a coluna já existe tentando fazer uma query
    console.log('🔍 Verificando se a coluna last_used_ip já existe...');
    const { data: columnTest, error: columnTestError } = await supabase
      .from('users')
      .select('last_used_ip')
      .limit(1);
    
    if (!columnTestError) {
      console.log('✅ Coluna last_used_ip já existe na tabela users');
      console.log('🏁 Processo de migração finalizado');
      return;
    }
    
    if (columnTestError.message.includes('column "last_used_ip" does not exist')) {
      console.log('📋 Coluna last_used_ip não existe, será criada...');
      
      // Como não podemos executar DDL diretamente via cliente JS do Supabase,
      // vamos informar ao usuário para executar no console SQL
      console.log('\n🔧 AÇÃO NECESSÁRIA:');
      console.log('Por favor, execute o seguinte SQL no console do Supabase:');
      console.log('\n--- COPIE E COLE NO SQL EDITOR DO SUPABASE ---');
      console.log('-- Adicionar coluna last_used_ip');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_used_ip TEXT;');
      console.log('');
      console.log('-- Criar índices para performance');
      console.log('CREATE INDEX IF NOT EXISTS idx_users_last_used_ip ON users(last_used_ip);');
      console.log('CREATE INDEX IF NOT EXISTS idx_users_device_ip_security ON users(device_id, last_used_ip);');
      console.log('--- FIM DO SQL ---\n');
      
      console.log('📍 Como executar:');
      console.log('1. Acesse https://supabase.com/dashboard');
      console.log('2. Selecione seu projeto');
      console.log('3. Vá para "SQL Editor" no menu lateral');
      console.log('4. Cole o SQL acima e execute');
      console.log('');
      console.log('⚠️ A migração precisa ser aplicada manualmente no console do Supabase.');
      
    } else {
      console.error('❌ Erro inesperado ao verificar coluna:', columnTestError.message);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  }
}

applyLastUsedIpMigration();