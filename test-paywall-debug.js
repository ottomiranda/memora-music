// Usando fetch nativo do Node.js 18+

// Configurações
const BASE_URL = 'http://localhost:5173';
const API_URL = `${BASE_URL}/api`;

// Simular um deviceId único para este teste
const testDeviceId = `test-device-${Date.now()}`;

async function testPaywallFlow() {
  console.log('🧪 Iniciando teste do fluxo de paywall...');
  console.log('📱 Device ID de teste:', testDeviceId);
  
  try {
    // Teste 1: Verificar status inicial (deve ser isFree: true)
    console.log('\n=== TESTE 1: Status inicial ===');
    const initialStatus = await fetch(`${API_URL}/user/creation-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': testDeviceId
      }
    });
    
    const initialData = await initialStatus.json();
    console.log('📊 Status inicial:', JSON.stringify(initialData, null, 2));
    
    if (!initialData.isFree) {
      console.log('❌ ERRO: Status inicial deveria ser isFree: true');
      return;
    }
    
    // Teste 2: Primeira criação de música (deve funcionar)
    console.log('\n=== TESTE 2: Primeira criação ===');
    const firstCreation = await fetch(`${API_URL}/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': testDeviceId
      },
      body: JSON.stringify({
        songTitle: 'Teste 1',
        recipientName: 'João',
        senderName: 'Maria',
        occasion: 'aniversário',
        relationship: 'amigo',
        genre: 'pop',
        mood: 'alegre',
        emotionalTone: 'feliz',
        duration: 'short',
        tempo: 'medium',
        vocalPreference: 'male',
        hobbies: 'música, esportes',
        qualities: 'carinhoso, engraçado',
        lyricsOnly: true
      })
    });
    
    const firstData = await firstCreation.json();
    console.log('🎵 Primeira criação:', JSON.stringify(firstData, null, 2));
    
    if (!firstData.success) {
      console.log('❌ ERRO: Primeira criação deveria ter sucesso');
      return;
    }
    
    // Teste 3: Verificar status após primeira criação (deve ser isFree: false)
    console.log('\n=== TESTE 3: Status após primeira criação ===');
    const afterFirstStatus = await fetch(`${API_URL}/user/creation-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': testDeviceId
      }
    });
    
    const afterFirstData = await afterFirstStatus.json();
    console.log('📊 Status após primeira:', JSON.stringify(afterFirstData, null, 2));
    
    if (afterFirstData.isFree) {
      console.log('❌ ERRO CRÍTICO: Status após primeira criação deveria ser isFree: false');
      console.log('🔍 Isso indica que o contador não foi incrementado corretamente!');
      return;
    }
    
    // Teste 4: Segunda criação de música (deve ser bloqueada)
    console.log('\n=== TESTE 4: Segunda criação (deve ser bloqueada) ===');
    const secondCreation = await fetch(`${API_URL}/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': testDeviceId
      },
      body: JSON.stringify({
        songTitle: 'Teste 2',
        recipientName: 'Pedro',
        senderName: 'Ana',
        occasion: 'casamento',
        relationship: 'irmão',
        genre: 'rock',
        mood: 'energético',
        emotionalTone: 'empolgado',
        duration: 'medium',
        tempo: 'fast',
        vocalPreference: 'female',
        hobbies: 'dança, culinária',
        qualities: 'dedicado, leal',
        lyricsOnly: true
      })
    });
    
    const secondData = await secondCreation.json();
    console.log('🚫 Segunda criação:', JSON.stringify(secondData, null, 2));
    
    if (secondData.success) {
      console.log('❌ ERRO CRÍTICO: Segunda criação deveria ter sido bloqueada!');
      console.log('🔍 O paywall não está funcionando corretamente!');
      return;
    }
    
    if (secondData.error !== 'PAYMENT_REQUIRED') {
      console.log('❌ ERRO: Segunda criação deveria retornar erro PAYMENT_REQUIRED');
      return;
    }
    
    console.log('\n✅ SUCESSO: Todos os testes passaram!');
    console.log('✅ O paywall está funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testPaywallFlow();