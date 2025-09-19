const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTriggerCounter() {
  console.log('🧪 Testando funcionamento do trigger sync_user_creations...');
  
  try {
    const testGuestId = `test-trigger-${Date.now()}`;
    
    // 1. Verificar estado inicial
    console.log('\n1. Verificando estado inicial...');
    const { data: initialState, error: initialError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testGuestId);
    
    if (initialError) {
      console.log('❌ Erro ao verificar estado inicial:', initialError);
      return;
    }
    
    console.log('📊 Estado inicial:', initialState.length === 0 ? 'Nenhum registro encontrado (esperado)' : initialState);
    
    // 2. Criar primeira música
    console.log('\n2. Criando primeira música de teste...');
    const { data: song1, error: song1Error } = await supabase
      .from('songs')
      .insert({
        guest_id: testGuestId,
        title: 'Teste Trigger 1',
        lyrics: 'Testando o trigger de sincronização',
        prompt: 'Música de teste para verificar trigger',
        genre: 'test',
        mood: 'experimental'
      })
      .select()
      .single();
    
    if (song1Error) {
      console.log('❌ Erro ao criar primeira música:', song1Error);
      return;
    }
    
    console.log('✅ Primeira música criada:', song1.id);
    
    // 3. Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Verificar se user_creations foi criado
    console.log('\n3. Verificando se user_creations foi criado...');
    const { data: afterFirst, error: afterFirstError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testGuestId);
    
    if (afterFirstError) {
      console.log('❌ Erro ao verificar após primeira música:', afterFirstError);
      return;
    }
    
    if (afterFirst.length === 0) {
      console.log('❌ PROBLEMA: user_creations não foi criado pelo trigger!');
      return;
    }
    
    console.log('✅ user_creations criado:', afterFirst[0]);
    console.log(`📊 Contador após primeira música: ${afterFirst[0].creations} (esperado: 1)`);
    
    // 5. Criar segunda música
    console.log('\n4. Criando segunda música de teste...');
    const { data: song2, error: song2Error } = await supabase
      .from('songs')
      .insert({
        guest_id: testGuestId,
        title: 'Teste Trigger 2',
        lyrics: 'Segunda música para testar incremento',
        prompt: 'Segunda música de teste',
        genre: 'test',
        mood: 'experimental'
      })
      .select()
      .single();
    
    if (song2Error) {
      console.log('❌ Erro ao criar segunda música:', song2Error);
      return;
    }
    
    console.log('✅ Segunda música criada:', song2.id);
    
    // 6. Aguardar e verificar incremento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n5. Verificando incremento do contador...');
    const { data: afterSecond, error: afterSecondError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testGuestId);
    
    if (afterSecondError) {
      console.log('❌ Erro ao verificar após segunda música:', afterSecondError);
      return;
    }
    
    console.log('✅ Estado após segunda música:', afterSecond[0]);
    console.log(`📊 Contador após segunda música: ${afterSecond[0].creations} (esperado: 2)`);
    
    // 7. Verificar contagem real de músicas
    console.log('\n6. Verificando contagem real de músicas...');
    const { data: realCount, error: countError } = await supabase
      .from('songs')
      .select('id')
      .eq('guest_id', testGuestId);
    
    if (countError) {
      console.log('❌ Erro ao contar músicas:', countError);
      return;
    }
    
    console.log(`📊 Total real de músicas: ${realCount.length}`);
    
    // 8. Resultado final
    console.log('\n🎯 RESULTADO DO TESTE:');
    const isWorking = afterSecond[0].creations === realCount.length;
    console.log(`Trigger funcionando: ${isWorking ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`Contador: ${afterSecond[0].creations} | Real: ${realCount.length}`);
    
    // 9. Limpeza - remover dados de teste
    console.log('\n7. Limpando dados de teste...');
    await supabase.from('songs').delete().eq('guest_id', testGuestId);
    await supabase.from('user_creations').delete().eq('device_id', testGuestId);
    console.log('✅ Dados de teste removidos');
    
  } catch (error) {
    console.log('❌ Erro durante o teste:', error);
  }
}

testTriggerCounter();