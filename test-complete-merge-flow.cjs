const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteMergeFlow() {
  try {
    console.log('🧪 Testando fluxo completo de merge...');
    
    const testDeviceId = 'complete-test-' + Date.now();
    const testEmail = 'complete-test-' + Date.now() + '@example.com';
    
    // Limpar dados anteriores
    await supabase.from('users').delete().eq('device_id', testDeviceId);
    await supabase.from('users').delete().eq('email', testEmail);
    
    console.log('\n📱 PASSO 1: Usuário anônimo usa uma música grátis');
    
    // Criar usuário anônimo com 1 música usada
    const { data: guestUser } = await supabase
      .from('users')
      .insert({
        device_id: testDeviceId,
        freesongsused: 1,
        status: 1 // anônimo
      })
      .select()
      .single();
    
    console.log('👤 Usuário anônimo criado:', {
      id: guestUser.id,
      device_id: guestUser.device_id,
      freesongsused: guestUser.freesongsused,
      status: guestUser.status,
      status_desc: guestUser.status === 1 ? 'anônimo' : 'autenticado'
    });
    
    // Simular verificação de bloqueio para usuário anônimo
    const shouldBlockAnonymous = guestUser.freesongsused >= 1 && guestUser.status === 1;
    console.log('🚫 Usuário anônimo seria bloqueado na 2ª música?', shouldBlockAnonymous ? 'SIM' : 'NÃO');
    
    console.log('\n🔐 PASSO 2: Usuário faz login');
    
    // Criar usuário autenticado
    const { data: authUser } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        name: 'Test User',
        freesongsused: 0,
        status: 0 // autenticado
      })
      .select()
      .single();
    
    console.log('🔐 Usuário autenticado criado:', {
      id: authUser.id,
      email: authUser.email,
      device_id: authUser.device_id,
      freesongsused: authUser.freesongsused,
      status: authUser.status,
      status_desc: authUser.status === 0 ? 'autenticado' : 'anônimo'
    });
    
    console.log('\n🔄 PASSO 3: Executando merge');
    
    // Executar merge
    const { data: mergeResult, error: mergeError } = await supabase.rpc('merge_guest_into_user', {
      p_device_id: testDeviceId,
      p_user_id: authUser.id
    });
    
    if (mergeError) {
      console.error('❌ Erro no merge:', mergeError);
      return;
    }
    
    console.log('✅ Merge executado com sucesso:', mergeResult);
    
    console.log('\n📊 PASSO 4: Verificando resultado do merge');
    
    // Verificar usuário após merge
    const { data: userAfterMerge } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    console.log('👤 Usuário após merge:', {
      id: userAfterMerge.id,
      email: userAfterMerge.email,
      device_id: userAfterMerge.device_id,
      freesongsused: userAfterMerge.freesongsused,
      status: userAfterMerge.status,
      status_desc: userAfterMerge.status === 0 ? 'autenticado' : 'anônimo'
    });
    
    // Verificar se usuário anônimo foi removido
    const { data: remainingGuests } = await supabase
      .from('users')
      .select('*')
      .eq('device_id', testDeviceId)
      .neq('id', authUser.id);
    
    console.log('👻 Usuários anônimos restantes:', remainingGuests?.length || 0);
    
    console.log('\n🧮 PASSO 5: Testando lógica de bloqueio');
    
    // Testar lógica de bloqueio para usuário autenticado
    const shouldBlockAuthenticated = userAfterMerge.freesongsused >= 1 && userAfterMerge.status === 1;
    console.log('🚫 Usuário autenticado seria bloqueado na 2ª música?', shouldBlockAuthenticated ? 'SIM' : 'NÃO');
    
    console.log('\n📋 RESUMO DOS RESULTADOS:');
    console.log('✅ Merge executado:', mergeResult.merged_guest);
    console.log('✅ freesongsused combinado:', mergeResult.combined_freesongsused);
    console.log('✅ device_id transferido:', userAfterMerge.device_id === testDeviceId);
    console.log('✅ Status atualizado para autenticado:', userAfterMerge.status === 0);
    console.log('✅ Usuário anônimo removido:', (remainingGuests?.length || 0) === 0);
    
    // Verificar se a lógica de bloqueio está correta
    const correctBlocking = userAfterMerge.status === 0; // Usuário autenticado não deve ser bloqueado
    console.log('✅ Lógica de bloqueio correta:', correctBlocking ? 'SIM' : 'NÃO');
    
    if (correctBlocking) {
      console.log('\n🎉 SUCESSO: Usuário autenticado com freesongsused=1 NÃO será bloqueado!');
    } else {
      console.log('\n❌ PROBLEMA: Usuário ainda tem status=1, será bloqueado incorretamente!');
    }
    
    // Limpar
    await supabase.from('users').delete().eq('id', authUser.id);
    
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

testCompleteMergeFlow();