const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSimpleMerge() {
  try {
    console.log('🧪 Teste simples do merge...');
    
    const testDeviceId = 'simple-test-' + Date.now();
    const testEmail = 'simple-test-' + Date.now() + '@example.com';
    
    // 1. Limpar dados anteriores
    console.log('🧹 Limpando dados anteriores...');
    await supabase.from('user_creations').delete().eq('device_id', testDeviceId);
    await supabase.from('user_creations').delete().eq('email', testEmail);
    
    // 2. Criar apenas usuário anônimo
    console.log('👤 Criando usuário anônimo...');
    const { data: guestUser, error: guestError } = await supabase
      .from('user_creations')
      .insert({
        device_id: testDeviceId,
        freesongsused: 1,
        status: 1
      })
      .select()
      .single();
    
    if (guestError) {
      console.error('❌ Erro ao criar usuário anônimo:', guestError);
      return;
    }
    
    console.log('✅ Usuário anônimo criado:', guestUser.id);
    
    // 3. Criar usuário autenticado SEM device_id
    console.log('🔐 Criando usuário autenticado...');
    const { data: authUser, error: authError } = await supabase
      .from('user_creations')
      .insert({
        email: testEmail,
        name: 'Test User',
        freesongsused: 0,
        status: 0
        // Não definir device_id aqui
      })
      .select()
      .single();
    
    if (authError) {
      console.error('❌ Erro ao criar usuário autenticado:', authError);
      return;
    }
    
    console.log('✅ Usuário autenticado criado:', authUser.id);
    
    // 4. Executar merge
    console.log('🔄 Executando merge...');
    const { data: mergeResult, error: mergeError } = await supabase.rpc('merge_guest_into_user', {
      p_device_id: testDeviceId,
      p_user_id: authUser.id
    });
    
    if (mergeError) {
      console.error('❌ Erro no merge:', mergeError);
      return;
    }
    
    console.log('✅ Merge executado:', mergeResult);
    
    // 5. Verificar resultado
    console.log('🔍 Verificando resultado...');
    
    const { data: finalUser } = await supabase
      .from('user_creations')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    console.log('📊 Usuário final:', {
      id: finalUser.id,
      email: finalUser.email,
      device_id: finalUser.device_id,
      freesongsused: finalUser.freesongsused,
      status: finalUser.status
    });
    
    // Verificar se usuário anônimo foi removido
    const { data: remainingGuests } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testDeviceId);
    
    console.log('👻 Usuários anônimos restantes:', remainingGuests?.length || 0);
    
    // 6. Limpar
    console.log('🧹 Limpando...');
    await supabase.from('user_creations').delete().eq('id', authUser.id);
    
    console.log('\n🎉 Teste concluído!');
    console.log('✅ Device_id transferido:', finalUser.device_id === testDeviceId);
    console.log('✅ FreeSongsUsed somado:', finalUser.freesongsused === 1);
    console.log('✅ Status atualizado:', finalUser.status === 0);
    console.log('✅ Usuário anônimo removido:', (remainingGuests?.length || 0) === 0);
    
  } catch (err) {
    console.error('❌ Erro no teste:', err);
  }
}

testSimpleMerge();