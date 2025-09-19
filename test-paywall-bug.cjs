const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPaywallBug() {
  console.log('🔍 Testando bug do paywall após migração...');
  
  const testDeviceId = `test-device-${Date.now()}`;
  const testUserId = uuidv4();
  
  try {
    // 1. Simular usuário convidado criando primeira música
    console.log('\n📱 1. Criando usuário convidado...');
    const { data: guestUser, error: guestError } = await supabase
      .from('user_creations')
      .insert({
        device_id: testDeviceId,
        user_id: null,
        freesongsused: 0,
        creations: 0,
        ip: '127.0.0.1'
      })
      .select()
      .single();
    
    if (guestError) {
      console.error('❌ Erro ao criar usuário convidado:', guestError);
      return;
    }
    
    console.log('✅ Usuário convidado criado:', guestUser);
    
    // 2. Incrementar contador após primeira música
    console.log('\n🎵 2. Simulando criação da primeira música...');
    const { data: incrementResult, error: incrementError } = await supabase
      .rpc('increment_freesongsused', {
        user_device_id: testDeviceId
      });
    
    if (incrementError) {
      console.error('❌ Erro ao incrementar contador:', incrementError);
      return;
    }
    
    console.log('✅ Contador incrementado:', incrementResult);
    
    // 3. Verificar status após primeira música
    console.log('\n🔍 3. Verificando status após primeira música...');
    const { data: statusAfterFirst, error: statusError1 } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testDeviceId)
      .single();
    
    if (statusError1) {
      console.error('❌ Erro ao verificar status:', statusError1);
      return;
    }
    
    console.log('📊 Status após primeira música:', statusAfterFirst);
    console.log(`🎯 freesongsused = ${statusAfterFirst.freesongsused} (deveria ser 1)`);
    
    // 4. Simular login e migração
    console.log('\n🔐 4. Simulando login e migração...');
    
    // Criar usuário autenticado fictício
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'test123456',
      user_metadata: { name: 'Test User' }
    });
    
    if (authError) {
      console.error('❌ Erro ao criar usuário auth:', authError);
      return;
    }
    
    const realUserId = authUser.user.id;
    console.log('✅ Usuário auth criado:', realUserId);
    
    // 5. Executar migração
    console.log('\n🔄 5. Executando migração...');
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('merge_guest_into_user', {
        p_device_id: testDeviceId,
        p_user_id: realUserId
      });
    
    if (mergeError) {
      console.error('❌ Erro na migração:', mergeError);
      return;
    }
    
    console.log('✅ Migração concluída:', mergeResult);
    
    // 6. Verificar status após migração
    console.log('\n📊 6. Verificando status após migração...');
    const { data: statusAfterMigration, error: statusError2 } = await supabase
      .from('user_creations')
      .select('*')
      .eq('user_id', realUserId)
      .single();
    
    if (statusError2) {
      console.error('❌ Erro ao verificar status após migração:', statusError2);
      return;
    }
    
    console.log('📊 Status após migração:', statusAfterMigration);
    console.log(`🎯 freesongsused = ${statusAfterMigration.freesongsused} (deveria ser 1)`);
    
    // 7. Testar API de creation-status
    console.log('\n🌐 7. Testando API /creation-status...');
    
    // Simular chamada da API
    const mockReq = {
      user: { id: realUserId },
      headers: { 'x-device-id': testDeviceId },
      ip: '127.0.0.1'
    };
    
    // Buscar status como a API faria
    const { data: apiStatus, error: apiError } = await supabase
      .from('user_creations')
      .select('freesongsused')
      .eq('user_id', realUserId)
      .maybeSingle();
    
    if (apiError && apiError.code !== 'PGRST116') {
      console.error('❌ Erro na API:', apiError);
      return;
    }
    
    const freeSongsUsed = apiStatus?.freesongsused || 0;
    const isFree = freeSongsUsed < 1;
    
    console.log('📊 Resultado da API:');
    console.log(`   - freeSongsUsed: ${freeSongsUsed}`);
    console.log(`   - isFree: ${isFree}`);
    console.log(`   - Deveria bloquear: ${!isFree}`);
    
    // 8. Análise do problema
    console.log('\n🔍 8. Análise do problema:');
    
    if (isFree && freeSongsUsed >= 1) {
      console.log('❌ BUG CONFIRMADO: API retorna isFree=true mesmo com freesongsused >= 1');
    } else if (!isFree && freeSongsUsed >= 1) {
      console.log('✅ PAYWALL FUNCIONANDO: API corretamente bloqueia quando freesongsused >= 1');
    } else if (freeSongsUsed === 0) {
      console.log('⚠️ POSSÍVEL PROBLEMA: Contador foi resetado durante a migração');
    } else {
      console.log('🤔 SITUAÇÃO INESPERADA: Verificar lógica');
    }
    
    // 9. Limpeza
    console.log('\n🧹 9. Limpando dados de teste...');
    
    // Deletar usuário auth
    await supabase.auth.admin.deleteUser(realUserId);
    
    // Deletar registros de user_creations
    await supabase
      .from('user_creations')
      .delete()
      .eq('user_id', realUserId);
    
    await supabase
      .from('user_creations')
      .delete()
      .eq('device_id', testDeviceId);
    
    console.log('✅ Limpeza concluída');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testPaywallBug().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});