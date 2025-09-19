require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function testPaywallLogic() {
  console.log('🧪 Testando lógica específica do paywall...');
  
  const testDeviceId = `paywall-logic-${Date.now()}`;
  const testEmail = `paywall-logic-${Date.now()}@example.com`;
  
  try {
    // Limpar dados anteriores
    console.log('🧹 Limpando dados de teste...');
    await supabase.from('user_creations').delete().eq('device_id', testDeviceId);
    await supabase.from('user_creations').delete().eq('email', testEmail);
    
    console.log('\n📱 PASSO 1: Criar usuário anônimo com 1 música usada');
    const { data: guestUser, error: guestError } = await supabase
      .from('user_creations')
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
    
    console.log('👤 Usuário anônimo criado:', {
      id: guestUser.id,
      device_id: guestUser.device_id,
      freesongsused: guestUser.freesongsused,
      status: guestUser.status
    });
    
    console.log('\n🚫 PASSO 2: Testar paywall para usuário anônimo (deve bloquear)');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/creation-status`, {
        params: { deviceId: testDeviceId }
      });
      
      console.log('📊 Resposta do paywall (anônimo):', {
        isFree: response.data.isFree,
        freeSongsUsed: response.data.freeSongsUsed,
        message: response.data.message,
        userType: response.data.userType
      });
      
      if (!response.data.isFree) {
        console.log('✅ CORRETO: Usuário anônimo com freesongsused=1 foi bloqueado');
      } else {
        console.log('❌ ERRO: Usuário anônimo com freesongsused=1 NÃO foi bloqueado!');
      }
    } catch (error) {
      console.log('⚠️  API não disponível para teste anônimo');
    }
    
    console.log('\n🔐 PASSO 3: Criar usuário autenticado');
    const { data: authUser, error: authError } = await supabase
      .from('user_creations')
      .insert({
        email: testEmail,
        status: 0 // autenticado
      })
      .select()
      .single();
    
    if (authError) {
      console.error('❌ Erro ao criar usuário autenticado:', authError);
      return;
    }
    
    console.log('👤 Usuário autenticado criado:', {
      id: authUser.id,
      email: authUser.email,
      freesongsused: authUser.freesongsused,
      status: authUser.status
    });
    
    console.log('\n🔄 PASSO 4: Executar merge');
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('merge_guest_into_user', {
        authenticated_user_id: authUser.id,
        guest_device_id: testDeviceId
      });
    
    if (mergeError) {
      console.error('❌ Erro no merge:', mergeError);
      return;
    }
    
    console.log('✅ Merge executado:', mergeResult);
    
    // Verificar usuário após merge
    const { data: userAfterMerge } = await supabase
      .from('user_creations')
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
    
    console.log('\n🎵 PASSO 5: Testar paywall para usuário autenticado após merge');
    
    // Simular token JWT (para teste, vamos usar o userId diretamente)
    const mockToken = `mock-jwt-${authUser.id}`;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/creation-status`, {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        },
        params: { deviceId: testDeviceId }
      });
      
      console.log('📊 Resposta do paywall (autenticado):', {
        isFree: response.data.isFree,
        freeSongsUsed: response.data.freeSongsUsed,
        message: response.data.message,
        userType: response.data.userType
      });
      
      console.log('\n🔍 ANÁLISE DO RESULTADO:');
      console.log(`- freesongsused após merge: ${userAfterMerge.freesongsused}`);
      console.log(`- status após merge: ${userAfterMerge.status} (${userAfterMerge.status === 0 ? 'autenticado' : 'anônimo'})`);
      console.log(`- isFree retornado pela API: ${response.data.isFree}`);
      console.log(`- Lógica esperada: freesongsused < 1 = ${userAfterMerge.freesongsused < 1}`);
      
      if (userAfterMerge.freesongsused >= 1 && response.data.isFree === false) {
        console.log('✅ CORRETO: Usuário autenticado com freesongsused>=1 foi bloqueado');
      } else if (userAfterMerge.freesongsused >= 1 && response.data.isFree === true) {
        console.log('❌ PROBLEMA CONFIRMADO: Usuário autenticado com freesongsused>=1 NÃO foi bloqueado!');
        console.log('   Isso permite que o usuário crie uma segunda música quando não deveria.');
      } else {
        console.log('ℹ️  Resultado inesperado - verificar lógica');
      }
      
    } catch (error) {
      console.log('⚠️  Erro na API ou token inválido:', error.response?.data || error.message);
      
      // Teste direto da lógica
      console.log('\n🧮 Testando lógica diretamente:');
      const freeSongsUsed = userAfterMerge.freesongsused || 0;
      const isFree = freeSongsUsed < 1;
      
      console.log('📊 Lógica direta:', {
        freeSongsUsed,
        isFree,
        shouldBeBlocked: !isFree
      });
      
      if (!isFree) {
        console.log('✅ LÓGICA CORRETA: Usuário deveria ser bloqueado');
      } else {
        console.log('❌ LÓGICA INCORRETA: Usuário não deveria ser bloqueado');
      }
    }
    
    console.log('\n🧹 Limpando dados de teste...');
    await supabase.from('user_creations').delete().eq('id', authUser.id);
    
    console.log('\n🎯 RESUMO:');
    console.log('1. Usuário anônimo com freesongsused=1 deve ser bloqueado');
    console.log('2. Após merge, usuário autenticado herda freesongsused=1');
    console.log('3. Usuário autenticado com freesongsused=1 também deve ser bloqueado');
    console.log('4. A lógica do paywall não deve fazer distinção entre anônimo e autenticado');
    console.log('5. O campo status não deve afetar a lógica de bloqueio, apenas freesongsused');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testPaywallLogic();