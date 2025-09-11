const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteFlow() {
  try {
    console.log('🧪 Iniciando teste do fluxo completo...');
    
    // 1. Limpar dados de teste anteriores
    const testDeviceId = 'test-device-' + Date.now();
    const testEmail = 'test-' + Date.now() + '@example.com';
    
    console.log('🧹 Limpando dados de teste anteriores...');
    await supabase.from('users').delete().eq('device_id', testDeviceId);
    await supabase.from('users').delete().eq('email', testEmail);
    
    // 2. Criar usuário anônimo (simulando primeira música)
    console.log('👤 Criando usuário anônimo...');
    const { data: guestUser, error: guestError } = await supabase
      .from('users')
      .insert({
        device_id: testDeviceId,
        freesongsused: 1,
        status: 1 // anônimo
      })
      .select()
      .single();
    
    if (guestError) {
      console.error('❌ Erro ao criar usuário anônimo:', guestError);
      return;
    }
    
    console.log('✅ Usuário anônimo criado:', {
      id: guestUser.id,
      device_id: guestUser.device_id,
      freesongsused: guestUser.freesongsused,
      status: guestUser.status
    });
    
    // 3. Criar usuário autenticado (simulando registro)
    console.log('🔐 Criando usuário autenticado...');
    const { data: authUser, error: authError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        name: 'Test User',
        freesongsused: 0,
        status: 0 // autenticado
      })
      .select()
      .single();
    
    if (authError) {
      console.error('❌ Erro ao criar usuário autenticado:', authError);
      return;
    }
    
    console.log('✅ Usuário autenticado criado:', {
      id: authUser.id,
      email: authUser.email,
      freesongsused: authUser.freesongsused,
      status: authUser.status
    });
    
    // 4. Executar merge (simulando login)
    console.log('🔄 Executando merge_guest_into_user...');
    const { data: mergeResult, error: mergeError } = await supabase.rpc('merge_guest_into_user', {
      p_device_id: testDeviceId,
      p_user_id: authUser.id
    });
    
    if (mergeError) {
      console.error('❌ Erro no merge:', mergeError);
      return;
    }
    
    console.log('✅ Merge executado:', mergeResult);
    
    // 5. Verificar resultado do merge
    console.log('🔍 Verificando resultado do merge...');
    
    // Verificar se usuário anônimo foi removido
    const { data: remainingGuest } = await supabase
      .from('users')
      .select('*')
      .eq('device_id', testDeviceId);
    
    console.log('👻 Usuários anônimos restantes:', remainingGuest?.length || 0);
    
    // Verificar usuário autenticado após merge
    const { data: updatedAuthUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    console.log('🔐 Usuário autenticado após merge:', {
      id: updatedAuthUser.id,
      email: updatedAuthUser.email,
      device_id: updatedAuthUser.device_id,
      freesongsused: updatedAuthUser.freesongsused,
      status: updatedAuthUser.status
    });
    
    // 6. Verificar lógica de bloqueio
    console.log('🚫 Testando lógica de bloqueio...');
    const shouldBeBlocked = updatedAuthUser.freesongsused >= 1;
    console.log('Deveria ser bloqueado?', shouldBeBlocked);
    console.log('Status correto (0=auth)?', updatedAuthUser.status === 0);
    
    // 7. Limpar dados de teste
    console.log('🧹 Limpando dados de teste...');
    await supabase.from('users').delete().eq('id', authUser.id);
    
    console.log('\n🎉 Teste completo finalizado!');
    console.log('📊 Resumo:');
    console.log('- Usuário anônimo removido:', (remainingGuest?.length || 0) === 0);
    console.log('- Device_id migrado:', updatedAuthUser.device_id === testDeviceId);
    console.log('- FreeSongsUsed somado:', updatedAuthUser.freesongsused === 1);
    console.log('- Status atualizado para autenticado:', updatedAuthUser.status === 0);
    console.log('- Lógica de bloqueio funcionando:', shouldBeBlocked);
    
  } catch (err) {
    console.error('❌ Erro no teste:', err);
  }
}

testCompleteFlow();