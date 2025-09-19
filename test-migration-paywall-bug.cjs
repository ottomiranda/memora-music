const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuração
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testMigrationPaywallBug() {
  console.log('🔍 TESTE: Bug do Paywall após Migração');
  console.log('=' .repeat(60));
  
  const deviceId = `test-device-${Date.now()}`;
  const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // UUID fixo para teste
  
  try {
    // PASSO 1: Limpar dados de teste anteriores
    console.log('\n🧹 1. Limpando dados de teste anteriores...');
    await supabase.from('user_creations').delete().eq('device_id', deviceId);
    await supabase.from('user_creations').delete().eq('id', testUserId);
    console.log('✅ Dados limpos');
    
    // PASSO 2: Criar usuário convidado e incrementar contador
    console.log('\n👤 2. Criando usuário convidado...');
    const { error: insertError } = await supabase
      .from('user_creations')
      .insert({
        device_id: deviceId,
        freesongsused: 0,
        status: 1, // convidado
        ip: '127.0.0.1'
      });
    
    if (insertError) {
      console.error('❌ Erro ao criar usuário convidado:', insertError);
      return;
    }
    console.log('✅ Usuário convidado criado');
    
    // PASSO 3: Incrementar contador (simular criação de música)
    console.log('\n🎵 3. Simulando criação de primeira música...');
    const { error: incrementError } = await supabase
      .rpc('increment_freesongsused', { user_device_id: deviceId });
    
    if (incrementError) {
      console.error('❌ Erro ao incrementar contador:', incrementError);
      return;
    }
    console.log('✅ Contador incrementado');
    
    // PASSO 4: Verificar estado antes da migração
    console.log('\n📊 4. Estado ANTES da migração:');
    const { data: beforeMigration } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', deviceId);
    
    console.log('Usuário convidado:', beforeMigration[0]);
    
    // PASSO 5: Verificar API creation-status ANTES da migração
    console.log('\n🌐 5. API creation-status ANTES da migração:');
    const beforeResponse = await axios.get(`${API_BASE_URL}/user/creation-status`, {
      headers: {
        'x-device-id': deviceId,
        'Content-Type': 'application/json'
      }
    });
    console.log('Resposta:', beforeResponse.data);
    
    // PASSO 6: Executar migração
    console.log('\n🔄 6. Executando migração...');
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('merge_guest_into_user', {
        p_device_id: deviceId,
        p_user_id: testUserId,
        p_last_ip: '127.0.0.1'
      });
    
    if (mergeError) {
      console.error('❌ Erro na migração:', mergeError);
      return;
    }
    console.log('✅ Migração executada:', mergeResult);
    
    // PASSO 7: Verificar estado APÓS a migração
    console.log('\n📊 7. Estado APÓS a migração:');
    const { data: afterMigration } = await supabase
      .from('user_creations')
      .select('*')
      .eq('id', testUserId);
    
    console.log('Usuário autenticado:', afterMigration[0]);
    
    // PASSO 8: Verificar API creation-status APÓS a migração
    console.log('\n🌐 8. API creation-status APÓS a migração:');
    const afterResponse = await axios.get(`${API_BASE_URL}/user/creation-status`, {
      headers: {
        'Authorization': `Bearer fake-token-${testUserId}`,
        'x-device-id': deviceId,
        'Content-Type': 'application/json'
      }
    });
    console.log('Resposta:', afterResponse.data);
    
    // ANÁLISE DOS RESULTADOS
    console.log('\n🔍 ANÁLISE DOS RESULTADOS:');
    console.log('=' .repeat(40));
    
    const beforeFreeUsed = beforeMigration[0]?.freesongsused || 0;
    const afterFreeUsed = afterMigration[0]?.freesongsused || 0;
    const beforeIsFree = beforeResponse.data.isFree;
    const afterIsFree = afterResponse.data.isFree;
    
    console.log(`Contador ANTES: ${beforeFreeUsed}`);
    console.log(`Contador APÓS: ${afterFreeUsed}`);
    console.log(`isFree ANTES: ${beforeIsFree}`);
    console.log(`isFree APÓS: ${afterIsFree}`);
    
    // Verificar se há problema
    if (beforeFreeUsed >= 1 && afterIsFree === true) {
      console.log('\n❌ BUG DETECTADO!');
      console.log('- Usuário tinha 1+ música criada ANTES da migração');
      console.log('- API retorna isFree=true APÓS migração (deveria ser false)');
      console.log('- Isso permite criar segunda música gratuitamente');
      
      if (afterFreeUsed !== beforeFreeUsed) {
        console.log(`- Contador foi alterado incorretamente: ${beforeFreeUsed} → ${afterFreeUsed}`);
      }
    } else {
      console.log('\n✅ Comportamento correto!');
      console.log('- Paywall funcionando após migração');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('Resposta da API:', error.response.data);
    }
  } finally {
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    await supabase.from('user_creations').delete().eq('device_id', deviceId);
    await supabase.from('user_creations').delete().eq('id', testUserId);
    console.log('✅ Limpeza concluída');
  }
}

// Executar teste
testMigrationPaywallBug().catch(console.error);