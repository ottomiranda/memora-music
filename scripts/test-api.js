import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🧪 Testando API /api/generate-preview...');
    
    const response = await fetch('http://localhost:3002/api/generate-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': 'test-device-123'
      },
      body: JSON.stringify({
        occasion: 'aniversário',
        recipientName: 'Maria',
        relationship: 'amiga',
        senderName: 'João',
        hobbies: 'tocar piano, ler livros',
        qualities: 'carinhosa, inteligente',
        genre: 'classical',
        mood: 'relaxante',
        lyricsOnly: false
      })
    });
    
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers));
    
    const data = await response.text();
    console.log('📄 Response:', data);
    
    if (response.ok) {
      console.log('✅ API funcionando corretamente!');
    } else {
      console.log('❌ Erro na API');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testAPI();