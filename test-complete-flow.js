// Teste completo do fluxo de geração de música
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Carregar variáveis de ambiente
dotenv.config();

const API_BASE_URL = 'http://localhost:3337';

async function testCompleteFlow() {
  console.log('🧪 [TEST] Iniciando teste completo do fluxo de geração');
  
  try {
    // 1. Gerar uma música
    console.log('\n📝 [TEST] Passo 1: Gerando música...');
    const guestId = 'test-complete-' + Date.now();
    
    const generateResponse = await fetch(`${API_BASE_URL}/api/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-ID': guestId
      },
      body: JSON.stringify({
        recipientName: 'Maria Teste',
        senderName: 'João Teste',
        occasion: 'Teste Completo',
        relationship: 'Amiga',
        emotionalTone: 'Alegre',
        songTitle: 'Música de Teste Completo',
        hobbies: 'Música e dança',
        qualities: 'Carinhosa e divertida',
        guestId: guestId
      })
    });
    
    if (!generateResponse.ok) {
      throw new Error(`Erro na geração: ${generateResponse.status} - ${await generateResponse.text()}`);
    }
    
    const generateData = await generateResponse.json();
    console.log('✅ [TEST] Música iniciada:', generateData);
    
    if (!generateData.success || !generateData.taskId) {
      throw new Error('Falha ao iniciar geração de música');
    }
    
    const taskId = generateData.taskId;
    console.log(`🎵 [TEST] TaskID: ${taskId}`);
    
    // 2. Monitorar o status até completar
    console.log('\n⏳ [TEST] Passo 2: Monitorando status...');
    let attempts = 0;
    const maxAttempts = 60; // 5 minutos
    let finalStatus = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      const statusResponse = await fetch(`${API_BASE_URL}/api/check-music-status/${taskId}`);
      
      if (!statusResponse.ok) {
        console.log(`❌ [TEST] Erro ao verificar status: ${statusResponse.status}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log(`🔍 [TEST] Tentativa ${attempts}: Status = ${statusData.status}, Clipes = ${statusData.completedClips}/${statusData.totalExpected}`);
      
      if (statusData.status === 'COMPLETED') {
        console.log('🎉 [TEST] Música completada!');
        finalStatus = statusData;
        break;
      } else if (statusData.status === 'FAILED') {
        console.log('❌ [TEST] Geração falhou:', statusData.error);
        throw new Error(`Geração falhou: ${statusData.error}`);
      } else if (statusData.status === 'PARTIAL') {
        console.log('⚠️ [TEST] Geração parcial completada');
        finalStatus = statusData;
        break;
      }
      
      // Aguardar 5 segundos antes da próxima verificação
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    if (!finalStatus) {
      throw new Error('Timeout: Música não completou no tempo esperado');
    }
    
    // 3. Verificar se foi salva no banco de dados
    console.log('\n💾 [TEST] Passo 3: Verificando salvamento no banco...');
    
    // Importar SongService para verificar
    const { SongService } = await import('./src/lib/services/songService.js');
    
    // Buscar música por taskId
    const savedSong = await SongService.getSongByTaskId(taskId);
    
    if (savedSong) {
      console.log('✅ [TEST] Música encontrada no banco de dados!');
      console.log('📋 [TEST] Dados salvos:', {
        id: savedSong.id,
        title: savedSong.title,
        guestId: savedSong.guestId,
        sunoTaskId: savedSong.sunoTaskId,
        generationStatus: savedSong.generationStatus,
        createdAt: savedSong.createdAt
      });
    } else {
      console.log('❌ [TEST] Música NÃO encontrada no banco de dados!');
      throw new Error('Música não foi salva no banco de dados');
    }
    
    // 4. Verificar tabela user_creations
    console.log('\n👤 [TEST] Passo 4: Verificando tabela user_creations...');
    
    console.log(`🔍 [TEST] Usando guestId: ${guestId}`);
    
    // Verificar user_creations
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: userCreations, error: userCreationsError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', guestId);
    
    if (userCreationsError) {
      console.log('❌ [TEST] Erro ao verificar user_creations:', userCreationsError.message);
    } else if (userCreations && userCreations.length > 0) {
      console.log('✅ [TEST] Registro encontrado em user_creations!');
      console.log('📊 [TEST] Dados user_creations:', userCreations[0]);
    } else {
      console.log('⚠️ [TEST] Nenhum registro encontrado em user_creations');
    }
    
    console.log('\n🎉 [TEST] Teste completo finalizado com sucesso!');
    
    return {
      success: true,
      taskId,
      finalStatus,
      savedSong,
      userCreations: userCreations?.[0] || null
    };
    
  } catch (error) {
    console.error('❌ [TEST] Erro no teste completo:', error.message);
    throw error;
  }
}

// Executar o teste
testCompleteFlow()
  .then((result) => {
    console.log('\n✅ [TEST] Teste completo concluído com sucesso!');
    console.log('📊 [TEST] Resultado final:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ [TEST] Teste completo falhou:', error.message);
    process.exit(1);
  });