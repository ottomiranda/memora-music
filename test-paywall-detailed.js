// Teste detalhado do paywall - verificar busca e incremento

const BASE_URL = 'http://localhost:3337/api';

// Função para fazer requisições HTTP
const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Erro na requisição para ${url}:`, error.message);
    return { error: error.message };
  }
};

// Função para verificar status do usuário
const checkUserStatus = async (deviceId, guestId) => {
  return await makeRequest(`${BASE_URL}/user/creation-status`, {
    headers: {
      'x-device-id': deviceId,
      'x-guest-id': guestId
    }
  });
};

// Simular dados de um dispositivo
const testDeviceId = `test-device-${Date.now()}`;
const testGuestId = `test-guest-${Date.now()}`;

console.log('🔍 TESTE DETALHADO DO PAYWALL');
console.log('DeviceId:', testDeviceId);
console.log('GuestId:', testGuestId);

async function testPaywallFlow() {
  try {
    // 1. Verificar status inicial
    console.log('\n=== TESTE 1: Status inicial ===');
    const initialStatus = await fetch(`${BASE_URL}/user/creation-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': testDeviceId,
        'x-guest-id': testGuestId
      }
    });
    
    const initialData = await initialStatus.json();
    console.log('📊 Status inicial:', JSON.stringify(initialData, null, 2));
    
    if (!initialData.isFree) {
      console.log('❌ ERRO: Status inicial deveria ser isFree: true');
      return;
    }
    
    // 2. Criar primeira música
    console.log('\n=== TESTE 2: Primeira criação ===');
    const firstCreation = await fetch(`${BASE_URL}/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': testDeviceId,
        'x-guest-id': testGuestId
      },
      body: JSON.stringify({
        recipientName: 'João',
        occasion: 'aniversário',
        relationship: 'amigo',
        senderName: 'Maria',
        hobbies: 'música, esportes',
        qualities: 'carinhoso, engraçado',
        genre: 'pop',
        mood: 'alegre',
        lyricsOnly: false
      })
    });
    
    const firstData = await firstCreation.json();
    console.log('🎵 Primeira criação:', {
      success: firstData.success,
      songTitle: firstData.songTitle ? firstData.songTitle.substring(0, 50) + '...' : 'N/A'
    });
    
    if (!firstData.success) {
      console.log('❌ ERRO: Primeira criação falhou:', firstData);
      return;
    }
    
    // 3. Aguardar um pouco para garantir que o banco foi atualizado
    console.log('\n⏳ Aguardando 2 segundos para sincronização...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Verificar status após primeira criação
    console.log('\n=== TESTE 3: Status após primeira criação ===');
    const afterFirstStatus = await fetch(`${BASE_URL}/user/creation-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': testDeviceId,
        'x-guest-id': testGuestId
      }
    });
    
    const afterFirstData = await afterFirstStatus.json();
    console.log('📊 Status após primeira:', JSON.stringify(afterFirstData, null, 2));
    
    if (afterFirstData.isFree) {
      console.log('❌ ERRO CRÍTICO: Status após primeira criação deveria ser isFree: false');
      console.log('🔍 Isso indica que o contador não foi incrementado corretamente!');
    } else {
      console.log('✅ SUCESSO: Paywall funcionando corretamente!');
    }
    
    // 5. Tentar segunda criação (deve falhar)
    console.log('\n=== TESTE 4: Segunda criação (deve falhar) ===');
    const secondCreation = await fetch(`${BASE_URL}/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': testDeviceId,
        'x-guest-id': testGuestId
      },
      body: JSON.stringify({
        recipientName: 'Maria',
        occasion: 'aniversário',
        relationship: 'irmã',
        senderName: 'João',
        hobbies: 'dança, cinema',
        qualities: 'divertida, inteligente',
        genre: 'rock',
        mood: 'energético',
        lyricsOnly: false
      })
    });
    
    const secondData = await secondCreation.json();
    console.log('🎵 Segunda criação:', {
      success: secondData.success,
      error: secondData.error,
      message: secondData.message
    });
    
    if (secondData.success) {
      console.log('❌ ERRO: Segunda criação deveria ter falhado com paywall!');
    } else if (secondData.error === 'PAYMENT_REQUIRED') {
      console.log('✅ SUCESSO: Paywall bloqueou segunda criação corretamente!');
    } else {
      console.log('⚠️ AVISO: Segunda criação falhou por outro motivo:', secondData);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testPaywallFlow();