const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const testDeviceId = 'guest-debug-flow-123';
const testEmail = `debug-test-${Date.now()}@example.com`;
const testGuestId = 'guest-debug-flow-123';

async function debugCompleteFlow() {
  console.log('🔍 === DEBUG COMPLETO DO FLUXO ===\n');
  
  try {
    
    // 1. LIMPEZA INICIAL
    console.log('🧹 1. Limpando dados de teste anteriores...');
    
    try {
      await supabase.from('songs').delete().eq('guest_id', testGuestId);
      await supabase.from('user_creations').delete().eq('device_id', testDeviceId);
      // Limpar usuários de teste anteriores
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      for (const user of existingUsers.users || []) {
        if (user.email && user.email.includes('debug-test')) {
          await supabase.auth.admin.deleteUser(user.id);
        }
      }
      console.log('✅ Limpeza concluída\n');
      
    } catch (cleanupError) {
      console.log('⚠️ Erro na limpeza (pode ser normal):', cleanupError.message);
    }
    
    // 2. SIMULAR CRIAÇÃO DE MÚSICA COMO GUEST
    console.log('🎵 2. Criando música como guest...');
    const { data: songData, error: songError } = await supabase
      .from('songs')
      .insert({
        title: 'Música de Teste - Guest',
        guest_id: testGuestId,
        user_id: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (songError) {
      console.error('❌ Erro ao criar música:', songError);
      return;
    }
    
    console.log('✅ Música criada:', songData.id);
    
    // 3. VERIFICAR SE O TRIGGER FUNCIONOU
    console.log('\n🔍 3. Verificando se o trigger sync_user_creations funcionou...');
    const { data: userCreationsAfterSong, error: ucError1 } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testGuestId);
    
    if (ucError1) {
      console.error('❌ Erro ao verificar user_creations:', ucError1);
    } else {
      console.log('📊 Registros em user_creations após criação da música:', userCreationsAfterSong.length);
      if (userCreationsAfterSong.length > 0) {
        console.log('✅ Trigger funcionou! Registro:', userCreationsAfterSong[0]);
      } else {
        console.log('❌ Trigger NÃO funcionou! Nenhum registro criado.');
      }
    }
    
    // 4. SIMULAR LOGIN (CRIAR USUÁRIO AUTENTICADO)
    console.log('\n👤 4. Simulando login - criando usuário autenticado...');
    
    // Primeiro criar o usuário na tabela auth.users
    const { data: authUserData, error: createUserError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: true
    });
    
    if (createUserError) {
      console.log('❌ Erro ao criar usuário na auth:', createUserError);
      return;
    }
    
    const actualUserId = authUserData.user.id;
    console.log('✅ Usuário criado na auth:', actualUserId);
    
    // Agora criar/atualizar na user_creations
    const { data: authUser, error: authError } = await supabase
      .from('user_creations')
      .upsert({
        device_id: actualUserId,
        user_id: actualUserId,
        freesongsused: 0,
        creations: 0,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (authError) {
      console.error('❌ Erro ao criar usuário autenticado:', authError);
      return;
    }
    
    console.log('✅ Usuário autenticado criado:', authUser.device_id);
    
    // 5. VERIFICAR ESTADO ANTES DO MERGE
    console.log('\n📊 5. Estado ANTES do merge_guest_into_user:');
    const { data: beforeMerge } = await supabase
      .from('user_creations')
      .select('*')
      .or(`device_id.eq.${testGuestId},device_id.eq.${actualUserId}`);
    
    console.log('Registros encontrados:', beforeMerge?.length || 0);
    beforeMerge?.forEach(record => {
      console.log(`  - device_id: ${record.device_id}, user_id: ${record.user_id}, creations: ${record.creations}, freesongsused: ${record.freesongsused}`);
    });
    
    // 6. EXECUTAR MERGE_GUEST_INTO_USER
    console.log('\n🔄 6. Executando merge_guest_into_user...');
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('merge_guest_into_user', {
        p_device_id: testDeviceId,
        p_user_id: actualUserId
      });
    
    if (mergeError) {
      console.error('❌ Erro no merge:', mergeError);
    } else {
      console.log('✅ Merge executado:', mergeResult);
    }
    
    // 7. VERIFICAR ESTADO APÓS O MERGE
    console.log('\n📊 7. Estado APÓS o merge_guest_into_user:');
    const { data: afterMerge } = await supabase
      .from('user_creations')
      .select('*')
      .or(`device_id.eq.${testGuestId},device_id.eq.${actualUserId},user_id.eq.${actualUserId}`);
    
    console.log('Registros encontrados:', afterMerge?.length || 0);
    afterMerge?.forEach(record => {
      console.log(`  - device_id: ${record.device_id}, user_id: ${record.user_id}, creations: ${record.creations}, freesongsused: ${record.freesongsused}`);
    });
    
    // 8. SIMULAR PAGAMENTO (RESETAR FREESONGSUSED)
    console.log('\n💳 8. Simulando pagamento bem-sucedido...');
    const { data: paymentUpdate, error: paymentError } = await supabase
      .from('user_creations')
      .update({ freesongsused: 0 })
      .eq('user_id', actualUserId)
      .select();
    
    if (paymentError) {
      console.error('❌ Erro ao simular pagamento:', paymentError);
    } else {
      console.log('✅ Pagamento simulado. Registros atualizados:', paymentUpdate?.length || 0);
    }
    
    // 9. VERIFICAR ESTADO FINAL
    console.log('\n📊 9. Estado FINAL após pagamento:');
    const { data: finalState } = await supabase
      .from('user_creations')
      .select('*')
      .or(`device_id.eq.${testGuestId},device_id.eq.${actualUserId},user_id.eq.${actualUserId}`);
    
    console.log('Registros encontrados:', finalState?.length || 0);
    if (finalState && finalState.length > 0) {
      finalState.forEach(record => {
        console.log(`  - device_id: ${record.device_id}, user_id: ${record.user_id}, creations: ${record.creations}, freesongsused: ${record.freesongsused}`);
      });
    } else {
      console.log('❌ PROBLEMA CRÍTICO: Nenhum registro encontrado após o fluxo completo!');
    }
    
    // 10. VERIFICAR SE A MÚSICA AINDA EXISTE
    console.log('\n🎵 10. Verificando se a música ainda existe:');
    const { data: finalSong } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songData.id)
      .single();
    
    if (finalSong) {
      console.log(`✅ Música ainda existe: ${finalSong.title} (guest_id: ${finalSong.guest_id}, user_id: ${finalSong.user_id})`);
    } else {
      console.log('❌ Música foi deletada!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
  }
}

// Executar o debug
debugCompleteFlow().then(() => {
  console.log('\n🏁 Debug completo finalizado.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});