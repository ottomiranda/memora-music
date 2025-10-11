const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase usando service role key para operações administrativas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetCounterForTest() {
  try {
    console.log('🔄 Resetando contadores de músicas gratuitas para testes...');
    
    // Resetar todos os contadores para 0
    const { data, error } = await supabase
      .from('user_creations')
      .update({ 
        freesongsused: 0,
        updated_at: new Date().toISOString()
      })
      .neq('device_id', 'dummy'); // Atualizar todos os registros
    
    if (error) {
      console.error('❌ Erro ao resetar contadores:', error.message);
      return;
    }
    
    console.log('✅ Contadores resetados com sucesso!');
    console.log('🎵 Agora você pode testar a geração de música novamente.');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

resetCounterForTest()
  .then(() => {
    console.log('🎉 Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error.message);
    process.exit(1);
  });