import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = 'http://localhost:3002';
const deviceId = uuidv4();

console.log('🧪 Testando API com Device ID:', deviceId);

async function testGeneratePreview() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId
      },
      body: JSON.stringify({
        occasion: 'aniversário',
        recipientName: 'Maria',
        relationship: 'amiga',
        senderName: 'João',
        hobbies: 'música, dança',
        qualities: 'alegre, carinhosa',
        mood: 'feliz',
        lyricsOnly: true
      })
    });

    const data = await response.json();
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📋 Dados da resposta:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Teste bem-sucedido! Device ID foi processado corretamente.');
    } else {
      console.log('❌ Teste falhou:', data.message || data.error);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testGeneratePreview();