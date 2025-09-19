require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteFlow() {
  console.log('🧪 Testando fluxo completo de geração de música...');
  
  const testCases = [
    {
      name: 'Usuário Anônimo (guest_id)',
      data: {
        guest_id: `test-guest-${Date.now()}`,
        user_id: null,
        title: 'Teste Música Anônima',
        generation_status: 'completed'
      }
    },
    {
      name: 'Usuário Autenticado (user_id)',
      data: {
        guest_id: null,
        user_id: '550e8400-e29b-41d4-a716-446655440000', // UUID fictício
        title: 'Teste Música Autenticada',
        generation_status: 'completed'
      }
    },
    {
      name: 'Caso Inválido (sem identificadores)',
      data: {
        guest_id: null,
        user_id: null,
        title: 'Teste Música Inválida',
        generation_status: 'completed'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testando: ${testCase.name}`);
    
    const expectedDeviceId = testCase.data.guest_id || testCase.data.user_id;
    
    try {
      // 1. Verificar estado inicial
      if (expectedDeviceId) {
        const { data: initialData } = await supabase
          .from('user_creations')
          .select('*')
          .eq('device_id', expectedDeviceId);
        
        console.log(`   📊 Registros iniciais: ${initialData?.length || 0}`);
      }
      
      // 2. Inserir música
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .insert(testCase.data)
        .select();
      
      if (songError) {
        console.log(`   ❌ Erro esperado ao inserir: ${songError.message}`);
        continue;
      }
      
      console.log(`   ✅ Música inserida: ${songData[0].id}`);
      
      // 3. Aguardar trigger
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 4. Verificar user_creations
      if (expectedDeviceId) {
        const { data: finalData } = await supabase
          .from('user_creations')
          .select('*')
          .eq('device_id', expectedDeviceId);
        
        if (finalData && finalData.length > 0) {
          console.log(`   ✅ Trigger atualizou user_creations:`, {
            device_id: finalData[0].device_id,
            creations: finalData[0].creations,
            user_id: finalData[0].user_id
          });
        } else {
          console.log(`   ❌ Trigger não atualizou user_creations`);
        }
        
        // 5. Limpar dados
        await supabase.from('songs').delete().eq('id', songData[0].id);
        await supabase.from('user_creations').delete().eq('device_id', expectedDeviceId);
      } else {
        console.log(`   ⚠️  Sem device_id para verificar user_creations`);
        await supabase.from('songs').delete().eq('id', songData[0].id);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro inesperado: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Teste de constraint songs_user_or_guest_check...');
  
  try {
    const { error } = await supabase
      .from('songs')
      .insert({
        title: 'Teste Constraint',
        generation_status: 'completed'
        // Sem user_id nem guest_id - deve falhar
      });
    
    if (error && error.message.includes('songs_user_or_guest_check')) {
      console.log('✅ Constraint funcionando corretamente - inserção rejeitada');
    } else if (error) {
      console.log(`⚠️  Erro diferente do esperado: ${error.message}`);
    } else {
      console.log('❌ Constraint não funcionou - inserção permitida incorretamente');
    }
  } catch (error) {
    console.log(`❌ Erro no teste de constraint: ${error.message}`);
  }
  
  console.log('\n✅ Teste completo finalizado!');
}

testCompleteFlow();