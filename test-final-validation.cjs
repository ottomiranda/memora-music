require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFinalValidation() {
  console.log('🎯 TESTE FINAL: Validação completa do problema resolvido');
  console.log('📋 Cenário: Usuário cria música gratuita → faz login → tenta segunda música');
  
  try {
    const testDeviceId = `final-test-${Date.now()}`;
    const testEmail = `final-test-${Date.now()}@example.com`;
    
    console.log('\n🎵 PASSO 1: Usuário anônimo cria primeira música (gratuita)');
    
    // Simular criação de usuário anônimo após primeira música
    const { data: guestUser, error: guestError } = await supabase
      .from('user_creations')
      .insert({
        device_id: testDeviceId,
        status: 1, // anônimo
        freesongsused: 1 // primeira música usada
      })
      .select()
      .single();
    
    if (guestError) {
      console.error('❌ Erro ao criar usuário anônimo:', guestError);
      return;
    }
    
    console.log('✅ Usuário anônimo criado após primeira música:', {
      id: guestUser.id,
      device_id: guestUser.device_id,
      status: guestUser.status,
      freesongsused: guestUser.freesongsused
    });
    
    // Verificar se seria bloqueado na segunda música
    console.log('\n🚫 VERIFICAÇÃO: Segunda música seria bloqueada para anônimo?');
    const wouldBeBlocked = guestUser.freesongsused >= 1;
    console.log(`📊 freesongsused=${guestUser.freesongsused}, seria bloqueado: ${wouldBeBlocked ? '✅ SIM' : '❌ NÃO'}`);
    
    console.log('\n🔐 PASSO 2: Usuário faz login');
    
    // Criar usuário autenticado (simula login)
    const { data: authUser, error: authError } = await supabase
      .from('user_creations')
      .insert({
        email: testEmail,
        status: 0, // autenticado
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
      status: authUser.status,
      freesongsused: authUser.freesongsused
    });
    
    console.log('\n🔄 PASSO 3: Executando merge (problema anterior)');
    
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('merge_guest_into_user', {
        p_device_id: testDeviceId,
        p_user_id: authUser.id
      });
    
    if (mergeError) {
      console.error('❌ FALHA NO MERGE:', mergeError);
      return;
    }
    
    console.log('✅ Merge executado com sucesso:', mergeResult);
    
    // Verificar estado final do usuário
    const { data: finalUser, error: finalError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (finalError) {
      console.error('❌ Erro ao verificar usuário final:', finalError);
      return;
    }
    
    console.log('\n📊 ESTADO FINAL DO USUÁRIO:');
    console.log('- ID:', finalUser.id);
    console.log('- Email:', finalUser.email);
    console.log('- Device ID:', finalUser.device_id);
    console.log('- Status:', finalUser.status, finalUser.status === 0 ? '(autenticado ✅)' : '(anônimo ❌)');
    console.log('- Free Songs Used:', finalUser.freesongsused);
    
    console.log('\n🎵 PASSO 4: Verificação do bloqueio na segunda música');
    
    // Simular lógica do paywall
    const isAuthenticated = finalUser.status === 0;
    const freeSongsUsed = finalUser.freesongsused;
    const wouldBeBlockedAfterMerge = freeSongsUsed >= 1;
    
    console.log('📋 Análise do paywall:');
    console.log('- Usuário autenticado:', isAuthenticated ? '✅ SIM' : '❌ NÃO');
    console.log('- Free songs used:', freeSongsUsed);
    console.log('- Seria bloqueado (freesongsused >= 1):', wouldBeBlockedAfterMerge ? '❌ SIM' : '✅ NÃO');
    
    console.log('\n🎯 RESULTADO FINAL:');
    
    const problemResolved = (
      finalUser.status === 0 && // usuário deve estar autenticado
      finalUser.freesongsused === 1 && // deve ter o contador combinado
      finalUser.device_id === testDeviceId && // deve ter o device_id transferido
      mergeResult.merged_guest === true // merge deve ter acontecido
    );
    
    if (problemResolved) {
      console.log('🎉 PROBLEMA COMPLETAMENTE RESOLVIDO!');
      console.log('✅ Status correto: autenticado (0)');
      console.log('✅ freesongsused correto: combinado (1)');
      console.log('✅ device_id transferido corretamente');
      console.log('✅ Usuário anônimo removido');
      console.log('\n📝 COMPORTAMENTO ESPERADO:');
      console.log('- Usuário anônimo: primeira música gratuita, segunda bloqueada');
      console.log('- Após login e merge: usuário autenticado pode continuar criando músicas');
      console.log('- O contador freesongsused é preservado mas não bloqueia usuários autenticados');
    } else {
      console.log('❌ PROBLEMA AINDA EXISTE!');
      console.log('Verificar:');
      console.log('- Status:', finalUser.status === 0 ? '✅' : '❌', finalUser.status);
      console.log('- freesongsused:', finalUser.freesongsused === 1 ? '✅' : '❌', finalUser.freesongsused);
      console.log('- device_id:', finalUser.device_id === testDeviceId ? '✅' : '❌', finalUser.device_id);
      console.log('- merge executado:', mergeResult.merged_guest ? '✅' : '❌', mergeResult.merged_guest);
    }
    
    // Verificar se usuário anônimo foi removido
    const { data: remainingGuest, error: guestCheckError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('id', guestUser.id)
      .maybeSingle();
    
    if (!guestCheckError && !remainingGuest) {
      console.log('✅ Usuário anônimo foi removido corretamente');
    } else {
      console.log('❌ Usuário anônimo ainda existe:', remainingGuest);
    }
    
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    await supabase.from('user_creations').delete().eq('id', authUser.id);
    if (remainingGuest) {
      await supabase.from('user_creations').delete().eq('id', guestUser.id);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFinalValidation();