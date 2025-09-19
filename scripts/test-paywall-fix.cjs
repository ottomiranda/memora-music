#!/usr/bin/env node

/**
 * Script para testar se o sistema de paywall está funcionando corretamente
 * após as correções implementadas.
 * 
 * Testa:
 * 1. Primeira música gratuita (deve passar)
 * 2. Segunda música (deve ser bloqueada pelo paywall)
 * 3. Usuário anônimo vs autenticado
 * 4. Diferentes deviceIds e IPs
 */

const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3337';
const API_URL = `${BASE_URL}/api/generate-preview`;

// Função para gerar um deviceId único
function generateDeviceId() {
  return `device-${crypto.randomUUID()}`;
}

// Função para gerar um guestId único
function generateGuestId() {
  return `guest-${crypto.randomUUID()}`;
}

// Função para fazer uma requisição de geração de música
async function createMusic(options = {}) {
  const {
    deviceId = generateDeviceId(),
    guestId = generateGuestId(),
    userId = null,
    description = 'Uma música de teste para verificar o paywall'
  } = options;

  const headers = {
    'Content-Type': 'application/json',
    'X-Device-ID': deviceId,
    'X-Guest-ID': guestId,
    'X-Forwarded-For': '192.168.1.100' // IP fixo para teste
  };

  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const payload = {
    // Campos obrigatórios do schema
    occasion: 'aniversário',
    recipientName: 'João',
    relationship: 'amigo',
    senderName: 'Maria',
    hobbies: 'tocar violão, cantar',
    qualities: 'carinhoso, engraçado',
    
    // Campos opcionais
    uniqueTraits: 'sempre alegre',
    memories: 'nossas aventuras juntos',
    songTitle: 'Música para João',
    emotionalTone: 'alegre',
    genre: 'pop',
    mood: 'happy',
    tempo: 'médio',
    lyricsOnly: false
  };

  try {
    console.log(`\n🎵 Tentando criar música...`);
    console.log(`   DeviceId: ${deviceId}`);
    console.log(`   GuestId: ${guestId}`);
    console.log(`   UserId: ${userId || 'N/A'}`);
    
    const response = await axios.post(API_URL, payload, { headers });
    
    console.log(`✅ Música criada com sucesso!`);
    console.log(`   Status: ${response.status}`);
    console.log(`   TaskId: ${response.data.taskId || 'N/A'}`);
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      deviceId,
      guestId,
      userId
    };
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Música bloqueada pelo paywall`);
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
      console.log(`   Message: ${error.response.data.message}`);
      console.log(`   FreeSongsUsed: ${error.response.data.freeSongsUsed || 'N/A'}`);
      console.log(`   RequiresPayment: ${error.response.data.requiresPayment || 'N/A'}`);
      
      return {
        success: false,
        status: error.response.status,
        error: error.response.data,
        deviceId,
        guestId,
        userId
      };
    } else {
      console.log(`💥 Erro inesperado:`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Stack: ${error.stack}`);
      if (error.cause) {
        console.log(`   Cause: ${error.cause}`);
      }
      throw error;
    }
  }
}

// Teste principal
async function runPaywallTests() {
  console.log('🚀 Iniciando testes do sistema de paywall...');
  console.log('=' .repeat(60));

  try {
    // Teste 1: Primeira música de um usuário anônimo (deve passar)
    console.log('\n📋 TESTE 1: Primeira música de usuário anônimo');
    const deviceId1 = generateDeviceId();
    const guestId1 = generateGuestId();
    
    const result1 = await createMusic({ deviceId: deviceId1, guestId: guestId1 });
    
    if (!result1.success) {
      console.log('❌ FALHA: Primeira música deveria ter passado!');
      return false;
    }
    
    console.log('✅ SUCESSO: Primeira música passou como esperado');
    
    // Aguardar um pouco antes do próximo teste
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 2: Segunda música do mesmo usuário anônimo (deve ser bloqueada)
    console.log('\n📋 TESTE 2: Segunda música do mesmo usuário anônimo');
    
    const result2 = await createMusic({ deviceId: deviceId1, guestId: guestId1 });
    
    if (result2.success) {
      console.log('❌ FALHA CRÍTICA: Segunda música não foi bloqueada pelo paywall!');
      return false;
    }
    
    if (result2.status !== 402) {
      console.log(`❌ FALHA: Status esperado 402, recebido ${result2.status}`);
      return false;
    }
    
    console.log('✅ SUCESSO: Segunda música foi bloqueada corretamente');
    
    // Teste 3: Novo usuário anônimo com deviceId diferente (deve passar)
    console.log('\n📋 TESTE 3: Novo usuário anônimo com deviceId diferente');
    const deviceId2 = generateDeviceId();
    const guestId2 = generateGuestId();
    
    const result3 = await createMusic({ deviceId: deviceId2, guestId: guestId2 });
    
    if (!result3.success) {
      console.log('❌ FALHA: Novo usuário deveria conseguir criar primeira música!');
      return false;
    }
    
    console.log('✅ SUCESSO: Novo usuário conseguiu criar primeira música');
    
    // Aguardar um pouco antes do próximo teste
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 4: Segunda música do novo usuário (deve ser bloqueada)
    console.log('\n📋 TESTE 4: Segunda música do novo usuário');
    
    const result4 = await createMusic({ deviceId: deviceId2, guestId: guestId2 });
    
    if (result4.success) {
      console.log('❌ FALHA CRÍTICA: Segunda música do novo usuário não foi bloqueada!');
      return false;
    }
    
    console.log('✅ SUCESSO: Segunda música do novo usuário foi bloqueada');
    
    // Teste 5: Usuário autenticado (primeira música deve passar)
    console.log('\n📋 TESTE 5: Usuário autenticado - primeira música');
    const userId1 = 'test-user-' + Date.now();
    const deviceId3 = generateDeviceId();
    const guestId3 = generateGuestId();
    
    const result5 = await createMusic({ 
      userId: userId1, 
      deviceId: deviceId3, 
      guestId: guestId3 
    });
    
    if (!result5.success) {
      console.log('❌ FALHA: Usuário autenticado deveria conseguir criar primeira música!');
      return false;
    }
    
    console.log('✅ SUCESSO: Usuário autenticado criou primeira música');
    
    // Aguardar um pouco antes do próximo teste
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 6: Segunda música do usuário autenticado (deve ser bloqueada)
    console.log('\n📋 TESTE 6: Usuário autenticado - segunda música');
    
    const result6 = await createMusic({ 
      userId: userId1, 
      deviceId: deviceId3, 
      guestId: guestId3 
    });
    
    if (result6.success) {
      console.log('❌ FALHA CRÍTICA: Segunda música do usuário autenticado não foi bloqueada!');
      return false;
    }
    
    console.log('✅ SUCESSO: Segunda música do usuário autenticado foi bloqueada');
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 TODOS OS TESTES PASSARAM! O sistema de paywall está funcionando corretamente.');
    console.log('✅ Primeira música: PERMITIDA');
    console.log('❌ Segunda música: BLOQUEADA');
    console.log('✅ Usuários anônimos: CONTROLADOS');
    console.log('✅ Usuários autenticados: CONTROLADOS');
    
    return true;
    
  } catch (error) {
    console.log('\n💥 Erro durante os testes:', error.message);
    return false;
  }
}

// Executar os testes
if (require.main === module) {
  runPaywallTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { runPaywallTests, createMusic };