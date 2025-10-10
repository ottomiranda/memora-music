#!/usr/bin/env node
/**
 * Teste específico para verificar o bloqueio da segunda música
 * Testa se o sistema bloqueia corretamente a criação da segunda música
 * com o mesmo device_id via IP da rede local (192.168.0.105:5173)
 */

require('dotenv').config();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuração do teste
const BASE_URL = 'http://localhost:3337';
const API_URL = `${BASE_URL}/api`;

// Payload base para testes
const basePayload = {
  occasion: 'aniversario',
  recipientName: 'João',
  relationship: 'amigo',
  senderName: 'Maria',
  hobbies: 'Gosta de futebol e música',
  qualities: 'Pessoa alegre e carinhosa',
  uniqueTraits: 'Tem um sorriso contagiante',
  memories: 'Lembro quando jogamos futebol juntos no parque',
  lyricsOnly: true,
  songTitle: 'Música para João',
  emotionalTone: 'alegre',
  genre: 'pop',
  mood: 'feliz',
  tempo: 'medio',
  duration: '3:00',
  emotion: 'alegria',
  vocalPreference: 'masculina'
};

async function testSecondSongBlock() {
  console.log('🧪 TESTE DE BLOQUEIO DA SEGUNDA MÚSICA');
  console.log('================================================================================');
  console.log(`🌐 Testando via IP da rede: ${BASE_URL}`);
  console.log('');

  // Gerar IDs únicos para este teste
  const deviceId = `device_${uuidv4()}`;
  const guestId = `guest_${uuidv4()}`;
  
  console.log(`📱 Device ID: ${deviceId}`);
  console.log(`👤 Guest ID: ${guestId}`);
  console.log('');

  try {
    // PRIMEIRA MÚSICA - Deve passar
    console.log('📋 TESTE 1: Primeira música (deve passar)');
    console.log('--------------------------------------------------------------------------------');
    
    const firstSongPayload = {
      ...basePayload,
      lyrics: 'Primeira música de teste para verificar o sistema de paywall.',
      userId: null,
      deviceId: deviceId,
      guestId: guestId
    };

    const firstResponse = await axios.post(`${API_URL}/generate-preview`, firstSongPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.0.105',
        'X-Device-ID': deviceId,
        'X-Guest-ID': guestId
      },
      timeout: 30000
    });

    console.log(`✅ Primeira música criada com sucesso!`);
    console.log(`📊 Status: ${firstResponse.status}`);
    console.log(`📝 Resposta: ${JSON.stringify(firstResponse.data, null, 2).substring(0, 200)}...`);
    console.log('');

    // Aguardar um pouco antes da segunda requisição
    console.log('⏳ Aguardando 2 segundos antes da segunda requisição...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // SEGUNDA MÚSICA - Deve ser bloqueada
    console.log('📋 TESTE 2: Segunda música com mesmo device_id (deve ser bloqueada)');
    console.log('--------------------------------------------------------------------------------');
    
    const secondSongPayload = {
      ...basePayload,
      lyrics: 'Segunda música de teste - esta deve ser bloqueada pelo paywall.',
      userId: null,
      deviceId: deviceId, // Mesmo device_id
      guestId: guestId    // Mesmo guest_id
    };

    try {
      const secondResponse = await axios.post(`${API_URL}/generate-preview`, secondSongPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.0.105',
          'X-Device-ID': deviceId,
          'X-Guest-ID': guestId
        },
        timeout: 30000
      });

      // Se chegou aqui, a segunda música passou - isso é um problema!
      console.log('❌ FALHA DE SEGURANÇA: Segunda música foi criada quando deveria ser bloqueada!');
      console.log(`📊 Status: ${secondResponse.status}`);
      console.log(`📝 Resposta: ${JSON.stringify(secondResponse.data, null, 2)}`);
      
    } catch (secondError) {
      if (secondError.response) {
        const status = secondError.response.status;
        const data = secondError.response.data;
        
        if (status === 402 || status === 403 || (data && data.message && data.message.includes('pago'))) {
          console.log('✅ BLOQUEIO FUNCIONANDO: Segunda música foi corretamente bloqueada!');
          console.log(`📊 Status: ${status}`);
          console.log(`📝 Mensagem: ${data.message || 'Bloqueio por paywall'}`);
        } else {
          console.log('⚠️  Segunda música foi bloqueada, mas com status inesperado:');
          console.log(`📊 Status: ${status}`);
          console.log(`📝 Resposta: ${JSON.stringify(data, null, 2)}`);
        }
      } else {
        console.log('❌ Erro de rede na segunda requisição:', secondError.message);
      }
    }

    console.log('');

    // TESTE 3: Verificar status do paywall
    console.log('📋 TESTE 3: Verificar status atual do paywall');
    console.log('--------------------------------------------------------------------------------');
    
    try {
      const statusResponse = await axios.get(`${API_URL}/paywall/creation-status`, {
        params: {
          userId: null,
          deviceId: deviceId,
          guestId: guestId
        },
        headers: {
          'X-Forwarded-For': '192.168.0.105',
          'X-Device-ID': deviceId,
          'X-Guest-ID': guestId
        }
      });

      console.log('📊 Status do paywall:');
      console.log(JSON.stringify(statusResponse.data, null, 2));
      
      const data = statusResponse.data;
      if (data.freeSongsUsed >= 1) {
        console.log('✅ Contador de músicas gratuitas foi incrementado corretamente');
      } else {
        console.log('⚠️  Contador de músicas gratuitas não foi incrementado');
      }
      
    } catch (statusError) {
      console.log('❌ Erro ao verificar status do paywall:', statusError.message);
    }

  } catch (error) {
    console.log('❌ Erro na primeira requisição:', error.message);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Resposta: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  console.log('');
  console.log('================================================================================');
  console.log('🎯 CONCLUSÕES DO TESTE');
  console.log('================================================================================');
  console.log('1. Se a primeira música passou e a segunda foi bloqueada = ✅ Sistema funcionando');
  console.log('2. Se ambas passaram = ❌ Falha de segurança - usuários podem burlar o sistema');
  console.log('3. Se a primeira foi bloqueada = ⚠️  Problema na configuração inicial');
  console.log(`4. IP testado: 192.168.0.105`);
  console.log(`5. Device ID usado: ${deviceId}`);
}

// Executar o teste
testSecondSongBlock().catch(console.error);