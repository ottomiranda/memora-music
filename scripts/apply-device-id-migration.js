import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDeviceIdMigration() {
  try {
    console.log('🔄 Aplicando migração para adicionar coluna device_id...');
    
    // Testar conectividade básica primeiro
    const { data: testData, error: testError } = await supabase
      .from('user_creations')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro de conectividade:', testError);
      return;
    }
    
    console.log('✅ Conectividade com Supabase OK');
    
    // Tentar aplicar a migração usando SQL direto
    console.log('🔄 Executando SQL de migração...');
    
    // Como não temos acesso direto ao SQL, vamos tentar uma abordagem diferente
    // Primeiro, vamos tentar fazer uma query que falhe se a coluna não existir
    const { data: checkData, error: checkError } = await supabase
      .from('user_creations')
      .select('device_id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Coluna device_id já existe na tabela user_creations');
      return;
    }
    
    if (checkError.code === 'PGRST116' || checkError.message.includes('device_id')) {
      console.log('📋 Coluna device_id não existe. SQL para aplicar manualmente no console do Supabase:');
      console.log('\n--- COPIE E COLE NO CONSOLE DO SUPABASE ---');
      console.log('-- Adicionar coluna device_id na tabela user_creations');
      console.log('ALTER TABLE user_creations ADD COLUMN IF NOT EXISTS device_id TEXT;');
      console.log('');
      console.log('-- Criar índice para melhor performance');
      console.log('CREATE INDEX IF NOT EXISTS idx_user_creations_device_id ON user_creations(device_id);');
      console.log('');
      console.log('-- Adicionar comentário para documentação');
      console.log("COMMENT ON COLUMN user_creations.device_id IS 'Identificador único do dispositivo para rastreamento de usuários anônimos';");
      console.log('--- FIM DO SQL ---\n');
      
      console.log('⚠️  Por favor, execute o SQL acima no console do Supabase para adicionar a coluna device_id.');
      console.log('💡 Acesse: https://supabase.com/dashboard > Seu Projeto > SQL Editor');
    } else {
      console.error('❌ Erro inesperado ao verificar coluna:', checkError);
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar migração
applyDeviceIdMigration()
  .then(() => {
    console.log('🏁 Processo de migração finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });