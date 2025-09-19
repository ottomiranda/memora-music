require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraints() {
  console.log('🔍 Verificando constraints na tabela user_creations...');
  
  try {
    // Tentar inserir dois usuários com o mesmo device_id para testar a constraint
    console.log('\n🧪 Testando constraint única no device_id...');
    
    const testDeviceId = `constraint-test-${Date.now()}`;
    
    // Limpar dados anteriores
    await supabase.from('user_creations').delete().eq('device_id', testDeviceId);
    
    // Inserir primeiro usuário
    console.log('📝 Inserindo primeiro usuário...');
    const { data: user1, error: error1 } = await supabase
      .from('user_creations')
      .insert({
        device_id: testDeviceId,
        status: 1
      })
      .select()
      .single();
    
    if (error1) {
      console.error('❌ Erro ao inserir primeiro usuário:', error1);
      return;
    }
    
    console.log('✅ Primeiro usuário inserido:', user1.id);
    
    // Tentar inserir segundo usuário com mesmo device_id
    console.log('📝 Tentando inserir segundo usuário com mesmo device_id...');
    const { data: user2, error: error2 } = await supabase
      .from('user_creations')
      .insert({
        device_id: testDeviceId,
        status: 1
      })
      .select()
      .single();
    
    if (error2) {
      console.log('✅ CONSTRAINT ATIVA: Erro esperado ao inserir usuário duplicado:', error2.message);
      if (error2.message.includes('ux_user_creations_device_id')) {
        console.log('🔒 Índice único ux_user_creations_device_id ainda está ativo!');
      }
    } else {
      console.log('❌ CONSTRAINT REMOVIDA: Segundo usuário foi inserido sem erro!');
      console.log('📝 Segundo usuário:', user2.id);
    }
    
    // Verificar se a função merge_guest_into_user existe tentando chamá-la
    console.log('\n🔧 Testando função merge_guest_into_user...');
    
    // Criar usuário autenticado para teste
    const { data: authUser, error: authError } = await supabase
      .from('user_creations')
      .insert({
        email: `merge-test-${Date.now()}@example.com`,
        status: 0
      })
      .select()
      .single();
    
    if (authError) {
      console.error('❌ Erro ao criar usuário autenticado:', authError);
      return;
    }
    
    // Tentar executar a função merge
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('merge_guest_into_user', {
        authenticated_user_id: authUser.id,
        guest_device_id: testDeviceId
      });
    
    if (mergeError) {
      console.log('❌ Erro na função merge:', mergeError.message);
      if (mergeError.message.includes('ux_user_creations_device_id')) {
        console.log('🔒 PROBLEMA CONFIRMADO: Constraint única ainda está causando erro no merge!');
      }
    } else {
      console.log('✅ Função merge executada com sucesso:', mergeResult);
    }
    
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    await supabase.from('user_creations').delete().eq('device_id', testDeviceId);
    await supabase.from('user_creations').delete().eq('id', authUser.id);
    
    console.log('\n📋 RESUMO:');
    console.log('- Se a constraint única no device_id ainda existe, ela impede o merge');
    console.log('- A função merge precisa ser corrigida para lidar com essa constraint');
    console.log('- Ou a constraint precisa ser removida se não for mais necessária');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkConstraints();