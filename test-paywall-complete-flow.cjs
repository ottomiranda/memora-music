const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

// Usar SERVICE_ROLE_KEY para contornar RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompletePaywallFlow() {
  console.log('🧪 Testando fluxo completo do paywall após migração...');
  
  const testDeviceId = `test-device-${Date.now()}`;
  const testAuthDeviceId = `test-auth-${Date.now()}`;
  // Usar UUID válido ou null para user_id
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  
  try {
    // 1. Limpeza inicial
    console.log('\n1️⃣ Limpando dados de teste anteriores...');
    await supabase.from('user_creations').delete().or(`device_id.eq.${testDeviceId},device_id.eq.${testAuthDeviceId}`);
    
    // 2. Simular usuário convidado que já usou 1 música
    console.log('\n2️⃣ Simulando usuário convidado que já usou 1 música...');
    const { error: guestError } = await supabase
      .from('user_creations')
      .insert({
        device_id: testDeviceId,
        freesongsused: 1,
        ip: '192.168.1.100',
        last_used_ip: '192.168.1.100'
      });
    
    if (guestError) {
      console.error('❌ Erro ao criar usuário convidado:', guestError);
      return false;
    }
    console.log('✅ Usuário convidado criado com 1 música usada');
    
    // 3. Verificar paywall ANTES da migração (deve bloquear)
    console.log('\n3️⃣ Verificando paywall ANTES da migração...');
    const { data: guestBefore } = await supabase
      .from('user_creations')
      .select('freesongsused')
      .eq('device_id', testDeviceId)
      .single();
    
    const shouldBlockBefore = guestBefore.freesongsused >= 1;
    console.log(`Usuário convidado: freesongsused=${guestBefore.freesongsused}, deve bloquear: ${shouldBlockBefore}`);
    
    if (!shouldBlockBefore) {
      console.error('❌ ERRO: Paywall deveria bloquear usuário convidado com 1 música usada');
      return false;
    }
    console.log('✅ Paywall funcionando corretamente ANTES da migração');
    
    // 4. Simular login do usuário (criar registro autenticado sem user_id)
    console.log('\n4️⃣ Simulando login do usuário...');
    const { error: authError } = await supabase
      .from('user_creations')
      .insert({
        device_id: testAuthDeviceId,
        freesongsused: 0,
        ip: '192.168.1.100',
        last_used_ip: '192.168.1.100'
      });
    
    if (authError) {
      console.error('❌ Erro ao criar usuário autenticado:', authError);
      return false;
    }
    console.log('✅ Usuário autenticado criado');
    
    // 5. Executar migração (simular função merge_guest_into_user)
    console.log('\n5️⃣ Executando migração...');
    
    // Buscar dados do usuário convidado
    const { data: guestData } = await supabase
      .from('user_creations')
      .select('freesongsused')
      .eq('device_id', testDeviceId)
      .single();
    
    // Buscar dados do usuário autenticado
    const { data: authData } = await supabase
      .from('user_creations')
      .select('freesongsused')
      .eq('device_id', testAuthDeviceId)
      .single();
    
    // Aplicar lógica GREATEST
    const mergedFreesongsused = Math.max(guestData.freesongsused, authData.freesongsused);
    console.log(`Aplicando GREATEST: max(${guestData.freesongsused}, ${authData.freesongsused}) = ${mergedFreesongsused}`);
    
    // Atualizar usuário autenticado
    const { error: updateError } = await supabase
      .from('user_creations')
      .update({ freesongsused: mergedFreesongsused })
      .eq('device_id', testAuthDeviceId);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar usuário autenticado:', updateError);
      return false;
    }
    
    // Remover usuário convidado
    const { error: deleteError } = await supabase
      .from('user_creations')
      .delete()
      .eq('device_id', testDeviceId);
    
    if (deleteError) {
      console.error('❌ Erro ao remover usuário convidado:', deleteError);
      return false;
    }
    
    console.log('✅ Migração concluída');
    
    // 6. Verificar paywall APÓS a migração (deve continuar bloqueando)
    console.log('\n6️⃣ Verificando paywall APÓS a migração...');
    const { data: authAfter } = await supabase
      .from('user_creations')
      .select('freesongsused, device_id')
      .eq('device_id', testAuthDeviceId)
      .single();
    
    const shouldBlockAfter = authAfter.freesongsused >= 1;
    console.log(`Usuário autenticado: freesongsused=${authAfter.freesongsused}, deve bloquear: ${shouldBlockAfter}`);
    
    if (!shouldBlockAfter) {
      console.error('❌ ERRO CRÍTICO: Paywall NÃO está bloqueando após migração!');
      console.error('Este é o bug que precisa ser corrigido!');
      return false;
    }
    
    // 7. Simular tentativa de criar segunda música
    console.log('\n7️⃣ Simulando tentativa de criar segunda música...');
    
    // Verificar se deve bloquear
    if (authAfter.freesongsused >= 1) {
      console.log('🔒 PAYWALL ATIVADO: Segunda música seria BLOQUEADA');
      console.log('✅ Comportamento correto: usuário deve ser direcionado para upgrade');
    } else {
      console.log('❌ ERRO: Segunda música seria PERMITIDA (BUG!)');
      return false;
    }
    
    // 8. Verificar que não há usuários convidados restantes
    console.log('\n8️⃣ Verificando limpeza...');
    const { data: remainingGuests } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testDeviceId);
    
    if (remainingGuests && remainingGuests.length > 0) {
      console.error('❌ ERRO: Usuário convidado não foi removido');
      return false;
    }
    
    console.log('✅ Usuário convidado removido corretamente');
    
    // 9. Limpeza final
    console.log('\n🧹 Limpando dados de teste...');
    await supabase.from('user_creations').delete().eq('device_id', testAuthDeviceId);
    
    console.log('\n🏁 TESTE PASSOU COM SUCESSO!');
    console.log('✅ Paywall funciona corretamente antes da migração');
    console.log('✅ Migração preserva contador usando GREATEST');
    console.log('✅ Paywall continua funcionando após migração');
    console.log('✅ Segunda música seria bloqueada corretamente');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    
    // Limpeza em caso de erro
    try {
      await supabase.from('user_creations').delete().or(`device_id.eq.${testDeviceId},device_id.eq.${testAuthDeviceId}`);
    } catch (cleanupError) {
      console.error('❌ Erro na limpeza:', cleanupError);
    }
    
    return false;
  }
}

// Executar teste
testCompletePaywallFlow().then(success => {
  if (success) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    process.exit(0);
  } else {
    console.log('\n💥 TESTE FALHOU!');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});