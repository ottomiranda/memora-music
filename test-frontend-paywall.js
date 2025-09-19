import fetch from 'node-fetch';

async function testFrontendPaywall() {
  console.log('🧪 Testando comportamento do paywall no frontend...');
  
  const baseUrl = 'http://localhost:3337';
  const deviceId = 'test-frontend-' + Date.now();
  
  try {
    // 1. Primeira verificação - deve retornar isFree: true
    console.log('\n🔍 Primeira verificação de status...');
    const firstCheck = await fetch(`${baseUrl}/api/user/creation-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-guest-id': deviceId
      }
    });
    
    const firstResponse = await firstCheck.json();
    console.log('📊 Primeira resposta:', JSON.stringify(firstResponse, null, 2));
    
    // 2. Simular primeira criação de música
    console.log('\n🎵 Simulando primeira criação de música...');
    const createFirst = await fetch(`${baseUrl}/api/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-guest-id': deviceId
      },
      body: JSON.stringify({
        occasion: 'aniversário',
        recipientName: 'João',
        relationship: 'amigo',
        senderName: 'Maria',
        hobbies: 'futebol, música',
        qualities: 'engraçado, leal',
        genre: 'pop',
        lyricsOnly: true
      })
    });
    
    const createFirstResponse = await createFirst.json();
    console.log('🎶 Primeira criação:', createFirstResponse.success ? 'Sucesso' : 'Falhou');
    if (!createFirstResponse.success) {
      console.log('❌ Erro na primeira criação:', createFirstResponse);
    }
    
    // 3. Segunda verificação - deve retornar isFree: false
    console.log('\n🔍 Segunda verificação de status (após primeira criação)...');
    const secondCheck = await fetch(`${baseUrl}/api/user/creation-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-guest-id': deviceId
      }
    });
    
    const secondResponse = await secondCheck.json();
    console.log('📊 Segunda resposta:', JSON.stringify(secondResponse, null, 2));
    
    // 4. Tentar segunda criação - deve bloquear com paywall
    console.log('\n🎵 Tentando segunda criação (deve ativar paywall)...');
    const createSecond = await fetch(`${baseUrl}/api/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-guest-id': deviceId
      },
      body: JSON.stringify({
        occasion: 'formatura',
        recipientName: 'Ana',
        relationship: 'irmã',
        senderName: 'Pedro',
        hobbies: 'leitura, dança',
        qualities: 'inteligente, carinhosa',
        genre: 'rock',
        lyricsOnly: true
      })
    });
    
    const createSecondResponse = await createSecond.json();
    console.log('🚫 Segunda criação:', createSecondResponse);
    
    // Análise dos resultados
    console.log('\n📋 ANÁLISE DOS RESULTADOS:');
    console.log(`✅ Primeira verificação isFree: ${firstResponse.isFree}`);
    console.log(`✅ Segunda verificação isFree: ${secondResponse.isFree}`);
    console.log(`✅ Primeira criação sucesso: ${createFirstResponse.success}`);
    console.log(`✅ Segunda criação bloqueada: ${createSecondResponse.error === 'PAYMENT_REQUIRED'}`);
    
    if (firstResponse.isFree && !secondResponse.isFree && createFirstResponse.success && createSecondResponse.error === 'PAYMENT_REQUIRED') {
      console.log('\n🎉 PAYWALL FUNCIONANDO CORRETAMENTE!');
    } else {
      console.log('\n❌ PROBLEMA IDENTIFICADO NO PAYWALL!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testFrontendPaywall();