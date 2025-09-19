require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMergeDetailed() {
  console.log('🔍 Debug detalhado da função merge_guest_into_user...');
  
  try {
    const testDeviceId = `debug-merge-${Date.now()}`;
    const testEmail = `debug-${Date.now()}@example.com`;
    
    console.log('\n📝 1. Criando usuário anônimo...');
    const { data: guestUser, error: guestError } = await supabase
      .from('user_creations')
      .insert({
        device_id: testDeviceId,
        status: 1,
        freesongsused: 1
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
      status: guestUser.status,
      freesongsused: guestUser.freesongsused
    });
    
    console.log('\n📝 2. Criando usuário autenticado...');
    const { data: authUser, error: authError } = await supabase
      .from('user_creations')
      .insert({
        email: testEmail,
        status: 0,
        freesongsused: 0
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
      device_id: authUser.device_id,
      status: authUser.status,
      freesongsused: authUser.freesongsused
    });
    
    console.log('\n📝 3. Verificando estado antes do merge...');
    const { data: beforeUsers, error: beforeError } = await supabase
      .from('user_creations')
      .select('*')
      .or(`id.eq.${guestUser.id},id.eq.${authUser.id}`);
    
    if (beforeError) {
      console.error('❌ Erro ao verificar usuários:', beforeError);
    } else {
      console.log('👥 Usuários antes do merge:', beforeUsers);
    }
    
    console.log('\n🔧 4. Executando merge...');
    console.log(`Parâmetros: device_id=${testDeviceId}, user_id=${authUser.id}`);
    
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('merge_guest_into_user', {
        p_device_id: testDeviceId,
        p_user_id: authUser.id
      });
    
    if (mergeError) {
      console.error('❌ Erro no merge:', mergeError);
      console.error('Detalhes do erro:', {
        code: mergeError.code,
        message: mergeError.message,
        details: mergeError.details,
        hint: mergeError.hint
      });
    } else {
      console.log('✅ Merge executado com sucesso:', mergeResult);
      
      console.log('\n📝 5. Verificando estado após o merge...');
      const { data: afterUsers, error: afterError } = await supabase
        .from('user_creations')
        .select('*')
        .or(`id.eq.${guestUser.id},id.eq.${authUser.id}`);
      
      if (afterError) {
        console.error('❌ Erro ao verificar usuários após merge:', afterError);
      } else {
        console.log('👥 Usuários após o merge:', afterUsers);
        
        const remainingUser = afterUsers.find(u => u.id === authUser.id);
        if (remainingUser) {
          console.log('\n📊 Resultado final do usuário autenticado:');
          console.log('- ID:', remainingUser.id);
          console.log('- Email:', remainingUser.email);
          console.log('- Device ID:', remainingUser.device_id);
          console.log('- Status:', remainingUser.status);
          console.log('- Free Songs Used:', remainingUser.freesongsused);
          
          if (remainingUser.device_id === testDeviceId && 
              remainingUser.status === 0 && 
              remainingUser.freesongsused === 1) {
            console.log('\n✅ MERGE FUNCIONOU CORRETAMENTE!');
          } else {
            console.log('\n❌ MERGE NÃO FUNCIONOU COMO ESPERADO!');
          }
        }
      }
    }
    
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    await supabase.from('user_creations').delete().or(`id.eq.${guestUser.id},id.eq.${authUser.id}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugMergeDetailed();