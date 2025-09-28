#!/usr/bin/env node

/**
 * Script de teste para geração de música em inglês
 * Testa o fluxo completo: OpenAI (inglês) -> Suno API
 */

import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurações do teste
const API_BASE_URL = 'http://localhost:3337';
const TEST_ENDPOINT = '/api/generate-preview/test-english';

// Dados de teste para geração em inglês
const testData = {
  recipientName: 'Sarah',
  occasion: 'Birthday celebration',
  relationship: 'Best friend',
  emotionalTone: 'Joyful and uplifting',
  specialMemories: 'Our road trip to California last summer, dancing in the rain, late night conversations about dreams',
  personalMessage: 'Thank you for always being there for me and making every moment special',
  senderName: 'Emma',
  hobbies: 'Photography, hiking, reading mystery novels',
  qualities: 'Kind, adventurous, loyal, creative',
  uniqueTraits: 'Always finds the silver lining, has an infectious laugh, loves vintage music',
  genre: 'Pop',
  mood: 'Happy',
  tempo: 'Upbeat',
  duration: '2-3 minutes',
  instruments: ['Guitar', 'Piano', 'Drums'],
  lyricsOnly: false
};

// Headers necessários
const headers = {
  'Content-Type': 'application/json',
  'X-Guest-ID': 'test-guest-english-' + Date.now(),
  'X-Device-ID': 'test-device-english-' + Date.now()
};

async function runEnglishTest() {
  console.log('\n🎵 TESTE DE GERAÇÃO DE MÚSICA EM INGLÊS');
  console.log('=' .repeat(50));
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🌐 API Base URL:', API_BASE_URL);
  console.log('🎯 Endpoint:', TEST_ENDPOINT);
  console.log('📋 Dados de teste:', JSON.stringify(testData, null, 2));
  console.log('📤 Headers:', JSON.stringify(headers, null, 2));
  
  try {
    console.log('\n🚀 Enviando requisição para o servidor...');
    
    const startTime = Date.now();
    
    const response = await axios.post(
      `${API_BASE_URL}${TEST_ENDPOINT}`,
      testData,
      { 
        headers,
        timeout: 120000 // 2 minutos de timeout
      }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n✅ RESPOSTA RECEBIDA');
    console.log('⏱️  Tempo de resposta:', duration + 'ms');
    console.log('📊 Status:', response.status);
    console.log('📋 Headers de resposta:', JSON.stringify(response.headers, null, 2));
    
    const data = response.data;
    
    console.log('\n📄 DADOS DA RESPOSTA:');
    console.log(JSON.stringify(data, null, 2));
    
    // Análise detalhada dos resultados
    console.log('\n🔍 ANÁLISE DOS RESULTADOS:');
    console.log('=' .repeat(40));
    
    if (data.success) {
      console.log('✅ Teste executado com sucesso!');
      
      // Análise OpenAI
      if (data.openai) {
        console.log('\n🤖 OPENAI RESULTS:');
        console.log('  - Idioma do prompt:', data.openai.prompt_language);
        console.log('  - Resposta recebida:', data.openai.response_received);
        console.log('  - Título gerado:', data.openai.title || 'N/A');
        console.log('  - Provavelmente em inglês:', data.openai.likely_english);
        console.log('  - Palavras em inglês encontradas:', data.openai.english_word_count);
        
        if (data.openai.lyrics) {
          console.log('  - Letra (primeiras 200 chars):');
          console.log('    "' + data.openai.lyrics.substring(0, 200) + '..."');
        }
      }
      
      // Análise Suno
      if (data.suno) {
        console.log('\n🎵 SUNO API RESULTS:');
        console.log('  - Requisição enviada:', data.suno.request_sent);
        console.log('  - Prompt usado (primeiros 200 chars):');
        console.log('    "' + (data.suno.prompt_used || 'N/A') + '"');
        
        if (data.suno.response) {
          console.log('  - Resposta da Suno:');
          console.log('   ', JSON.stringify(data.suno.response, null, 4));
          
          // Verificar se a Suno processou corretamente
          if (data.suno.response.id || data.suno.response.clips) {
            console.log('  ✅ Suno processou a requisição com sucesso!');
          } else {
            console.log('  ⚠️  Resposta da Suno pode indicar problema');
          }
        }
      }
      
      // Conclusões
      console.log('\n📊 CONCLUSÕES:');
      console.log('=' .repeat(30));
      
      if (data.openai?.likely_english) {
        console.log('✅ OpenAI gerou letra em inglês com sucesso');
      } else {
        console.log('❌ OpenAI pode não ter gerado letra em inglês');
      }
      
      if (data.suno?.request_sent) {
        console.log('✅ Requisição enviada para Suno com sucesso');
      } else {
        console.log('❌ Falha ao enviar para Suno');
      }
      
      if (data.suno?.response) {
        console.log('✅ Suno processou letra em inglês');
      } else {
        console.log('❌ Suno não retornou resposta válida');
      }
      
    } else {
      console.log('❌ Teste falhou!');
      console.log('Erro:', data.error);
      if (data.details) {
        console.log('Detalhes:', data.details);
      }
    }
    
  } catch (error) {
    console.log('\n❌ ERRO NO TESTE:');
    console.log('Tipo:', error.constructor.name);
    console.log('Mensagem:', error.message);
    
    if (error.response) {
      console.log('Status HTTP:', error.response.status);
      console.log('Headers de resposta:', JSON.stringify(error.response.headers, null, 2));
      console.log('Dados de resposta:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('Requisição enviada mas sem resposta');
      console.log('Request:', error.request);
    }
    
    console.log('Stack trace:', error.stack);
  }
  
  console.log('\n🏁 Teste finalizado em', new Date().toISOString());
}

// Verificar se o servidor está rodando
async function checkServerHealth() {
  try {
    console.log('🔍 Verificando se o servidor está rodando...');
    const response = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
    console.log('✅ Servidor está rodando!');
    console.log('📊 Status do servidor:', response.data.status);
    return true;
  } catch (error) {
    console.log('❌ Servidor não está respondendo!');
    console.log('Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor está rodando com:');
    console.log('   npm run server:dev');
    return false;
  }
}

// Executar teste
async function main() {
  console.log('🎵 MEMORA MUSIC - TESTE DE GERAÇÃO EM INGLÊS');
  console.log('=' .repeat(60));
  
  const serverRunning = await checkServerHealth();
  
  if (serverRunning) {
    await runEnglishTest();
  } else {
    console.log('\n⚠️  Não é possível executar o teste sem o servidor rodando.');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runEnglishTest, checkServerHealth };