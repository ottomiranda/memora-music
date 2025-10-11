// Teste completo de geração de música
const fetch = require('node-fetch').default;

const API_BASE = 'http://localhost:3337';

async function testMusicGeneration() {
  console.log('🎵 Testando geração completa de música...');
  
  // Dados de teste
  const testData = {
  occasion: 'aniversario',
  recipientName: 'João',
  relationship: 'pai',
  senderName: 'Maria',
  hobbies: 'futebol, música',
  qualities: 'carinhoso, engraçado',
  memories: 'nossas viagens juntos',
  musicStyle: 'pop',
  language: 'pt',
  deviceId: 'test-device-' + Date.now() // Usar um deviceId único para cada teste
};

  try {
    // 1. Gerar música
    console.log('\n1. Enviando requisição para gerar música...');
    const generateResponse = await fetch(`${API_BASE}/api/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': 'test-guest-123'
      },
      body: JSON.stringify(testData)
    });

    console.log('Status da geração:', generateResponse.status);
    const generateResult = await generateResponse.json();
    console.log('Resposta da geração:', JSON.stringify(generateResult, null, 2));

    if (!generateResult.success || !generateResult.taskId) {
      console.log('❌ Falha na geração inicial');
      return;
    }

    const taskId = generateResult.taskId;
    console.log(`✅ TaskId gerado: ${taskId}`);

    // 2. Verificar status periodicamente
    console.log('\n2. Verificando status da música...');
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`\nTentativa ${attempts}/${maxAttempts}:`);
      
      const statusResponse = await fetch(`${API_BASE}/api/check-music-status/${taskId}`);
      console.log(`Status da verificação: ${statusResponse.status}`);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Resposta completa:', JSON.stringify(statusData, null, 2));
        console.log(`Status atual: ${statusData.data?.status || statusData.status}`);
        console.log(`Progresso: ${statusData.data?.completedClips || statusData.completedClips}/${statusData.data?.totalExpected || statusData.totalExpected}`);
      
      if (statusData.data?.audioClips && statusData.data.audioClips.length > 0) {
        console.log('\n🎵 URLs de áudio encontrados:');
        statusData.data.audioClips.forEach((clip, index) => {
          console.log(`  ${index + 1}. ${clip.title}: ${clip.audio_url}`);
        });
        break;
      }
      
      if (statusData.data?.status === 'COMPLETED' || statusData.data?.status === 'FAILED') {
        console.log(`\n🏁 Geração finalizada com status: ${statusData.data.status}`);
        if (statusData.data.error) {
          console.log(`❌ Erro: ${statusData.data.error}`);
        }
        break;
      }
    } else {
      console.log('❌ Erro na verificação:', statusResponse.status);
      const errorData = await statusResponse.json();
      console.log('Detalhes do erro:', JSON.stringify(errorData, null, 2));
    }
      
      // Aguardar 5 segundos antes da próxima verificação
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testMusicGeneration();
