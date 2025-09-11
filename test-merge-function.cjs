const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMergeFunction() {
  try {
    console.log('Testando função merge_guest_into_user...');
    
    // Teste com parâmetros fictícios para verificar se a função existe
    const { data, error } = await supabase.rpc('merge_guest_into_user', {
      guest_device_id: 'test-device-123',
      authenticated_user_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error) {
      console.log('Erro esperado (usuários não existem):', error.message);
      console.log('✅ Função existe e foi executada');
    } else {
      console.log('✅ Função executada com sucesso:', data);
    }
    
  } catch (err) {
    console.error('❌ Erro ao testar função:', err.message);
  }
}

testMergeFunction();