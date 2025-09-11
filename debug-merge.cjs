const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMerge() {
  try {
    console.log('🔍 Debug do merge...');
    
    const testDeviceId = 'debug-test-' + Date.now();
    const testEmail = 'debug-test-' + Date.now() + '@example.com';
    
    // Limpar dados anteriores
    await supabase.from('users').delete().eq('device_id', testDeviceId);
    await supabase.from('users').delete().eq('email', testEmail);
    
    // Criar usuário anônimo
    const { data: guestUser } = await supabase
      .from('users')
      .insert({
        device_id: testDeviceId,
        freesongsused: 1,
        status: 1
      })
      .select()
      .single();
    
    console.log('👤 Usuário anônimo:', {
      id: guestUser.id,
      device_id: guestUser.device_id,
      freesongsused: guestUser.freesongsused,
      status: guestUser.status
    });
    
    // Criar usuário autenticado
    const { data: authUser } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        name: 'Test User',
        freesongsused: 0,
        status: 0
      })
      .select()
      .single();
    
    console.log('🔐 Usuário autenticado ANTES do merge:', {
      id: authUser.id,
      email: authUser.email,
      device_id: authUser.device_id, // Deve ser null
      freesongsused: authUser.freesongsused,
      status: authUser.status
    });
    
    // Verificar se já existe algum usuário com esse device_id
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .eq('device_id', testDeviceId);
    
    console.log('📋 Usuários com device_id', testDeviceId, ':', existingUsers?.length || 0);
    existingUsers?.forEach(user => {
      console.log('  -', user.id, user.email || 'sem email', 'status:', user.status);
    });
    
    // Tentar executar merge
    console.log('🔄 Executando merge...');
    const { data: mergeResult, error: mergeError } = await supabase.rpc('merge_guest_into_user', {
      p_device_id: testDeviceId,
      p_user_id: authUser.id
    });
    
    if (mergeError) {
      console.error('❌ Erro no merge:', mergeError);
      
      // Verificar estado após erro
      const { data: usersAfterError } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${authUser.id},device_id.eq.${testDeviceId}`);
      
      console.log('📋 Usuários após erro:', usersAfterError?.length || 0);
      usersAfterError?.forEach(user => {
        console.log('  -', user.id, user.email || 'sem email', 'device_id:', user.device_id, 'status:', user.status);
      });
    } else {
      console.log('✅ Merge executado:', mergeResult);
    }
    
    // Limpar
    await supabase.from('users').delete().eq('device_id', testDeviceId);
    await supabase.from('users').delete().eq('email', testEmail);
    
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

debugMerge();