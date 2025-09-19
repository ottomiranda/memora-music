// Teste simples da integração com a API da Suno usando fetch
const SUNO_API_KEY = '32a5760785b3cf96089add16aae2e263';
const testTaskId = '1234567890';

async function testSunoAPI() {
  console.log('🧪 Testando endpoint da Suno API...');
  console.log('📍 URL:', `https://api.sunoapi.org/v1/music/${testTaskId}`);
  
  try {
    const response = await fetch(`https://api.sunoapi.org/v1/music/${testTaskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Resposta completa:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Dados parseados com sucesso:', data);
        
        if (data.stream_audio_url) {
          console.log('🎵 Stream URL encontrada:', data.stream_audio_url);
        }
        if (data.audio_url) {
          console.log('🎵 Audio URL encontrada:', data.audio_url);
        }
      } catch (parseError) {
        console.log('⚠️ Erro ao parsear JSON:', parseError.message);
      }
    } else {
      console.log('⚠️ Resposta não OK. Isso é esperado para um task_id fictício.');
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
  
  console.log('🎉 Teste concluído!');
}

// Executar o teste
testSunoAPI();