require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTriggerFunctionality() {
  console.log('🧪 Testando funcionalidade do trigger sync_user_creations...');
  
  const testGuestId = `test-guest-${Date.now()}`;
  const testDeviceId = testGuestId; // Usando guest_id como device_id
  
  try {
    // 1. Verificar estado inicial da tabela user_creations
    console.log('\n1️⃣ Verificando estado inicial...');
    const { data: initialData, error: initialError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testDeviceId);
    
    if (initialError) {
      console.error('❌ Erro ao consultar user_creations:', initialError.message);
      return;
    }
    
    console.log(`📊 Registros iniciais para device_id '${testDeviceId}':`, initialData.length);
    
    // 2. Inserir uma música de teste
    console.log('\n2️⃣ Inserindo música de teste...');
    const { data: songData, error: songError } = await supabase
      .from('songs')
      .insert({
        guest_id: testGuestId,
        title: 'Teste Trigger Song',
        generation_status: 'completed'
      })
      .select();
    
    if (songError) {
      console.error('❌ Erro ao inserir música:', songError.message);
      return;
    }
    
    console.log('✅ Música inserida com sucesso:', songData[0].id);
    
    // 3. Aguardar um pouco para o trigger processar
    console.log('\n3️⃣ Aguardando trigger processar...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Verificar se o trigger atualizou a tabela user_creations
    console.log('\n4️⃣ Verificando se trigger atualizou user_creations...');
    const { data: finalData, error: finalError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testDeviceId);
    
    if (finalError) {
      console.error('❌ Erro ao consultar user_creations final:', finalError.message);
      return;
    }
    
    console.log(`📊 Registros finais para device_id '${testDeviceId}':`, finalData.length);
    
    if (finalData.length > 0) {
      console.log('✅ Trigger funcionando! Dados atualizados:', {
        device_id: finalData[0].device_id,
        creations: finalData[0].creations,
        user_id: finalData[0].user_id,
        ip: finalData[0].ip,
        updated_at: finalData[0].updated_at
      });
    } else {
      console.log('❌ Trigger não funcionou - nenhum registro criado em user_creations');
    }
    
    // 5. Limpar dados de teste
    console.log('\n5️⃣ Limpando dados de teste...');
    await supabase.from('songs').delete().eq('id', songData[0].id);
    await supabase.from('user_creations').delete().eq('device_id', testDeviceId);
    console.log('🧹 Limpeza concluída');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

testTriggerFunctionality();