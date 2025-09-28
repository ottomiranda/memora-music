/**
 * Teste para geração de música em inglês
 * Este script testa o fluxo completo: OpenAI (inglês) -> Suno API
 */

const axios = require('axios');
const FormData = require('form-data');

// Configuração do teste
const API_BASE_URL = 'http://localhost:3337';
const TEST_DATA = {
  songTitle: 'Happy Birthday Song',
  recipientName: 'Sarah',
  occasion: 'Birthday',
  relationship: 'Sister',
  emotionalTone: 'Happy',
  genre: 'Pop',
  mood: 'Cheerful',
  tempo: 'Medium',
  duration: '2-3 minutes',
  senderName: 'John',
  hobbies: 'Dancing, Reading',
  qualities: 'Kind, Funny',
  uniqueTraits: 'Always smiling',
  memories: 'Our childhood adventures in the backyard',
  personalMessage: 'You are the best sister in the world',
  specialMemories: 'Remember when we built that treehouse together?',
  instruments: ['Guitar', 'Piano'],
  lyricsOnly: false // Teste completo com áudio
};

// Função para criar prompt em inglês (substitui temporariamente a função original)
function createEnglishLyricsPrompt(data) {
  return `You are an experienced composer from "Memora.music", specialized in creating personalized and exciting song lyrics.

Create a unique and touching song lyrics based on the following information:

**PERSONAL INFORMATION:**
- Song title: ${data.songTitle || 'To be defined'}
- Recipient: ${data.recipientName}
- Occasion: ${data.occasion}
- Relationship: ${data.relationship}
- Desired emotional tone: ${data.emotionalTone || 'Emotional'}
- Special memories: ${data.specialMemories || data.memories || 'Not specified'}
- Personal message: ${data.personalMessage || 'Not specified'}
- Sender: ${data.senderName || 'Not specified'}
- Hobbies: ${data.hobbies || 'Not specified'}
- Qualities: ${data.qualities || 'Not specified'}
- Unique traits: ${data.uniqueTraits || 'Not specified'}

**MUSICAL STYLE:**
- Genre: ${data.genre || 'Pop'}
- Mood/Atmosphere: ${data.mood || 'Happy'}
- Tempo: ${data.tempo || 'Medium'}
- Approximate duration: ${data.duration}
- Instruments: ${data.instruments?.join(', ') || 'Not specified'}

**INSTRUCTIONS:**
1. Create original, emotional and personalized lyrics
2. Use the emotional tone ${data.emotionalTone || 'emotional'} as main guide
3. Incorporate memories and personal messages naturally
4. Adapt the writing style to the ${data.genre || 'pop'} genre
5. The lyrics should be appropriate for the occasion: ${data.occasion}
6. Keep focus on the ${data.relationship} relationship
7. Write the lyrics in ENGLISH

**RESPONSE FORMAT:**
Return ONLY the song lyrics, without additional comments, explanations or extra formatting. The lyrics should be ready to be sung.`;
}

// Função para criar prompt em inglês para título e letra
function createEnglishLyricsAndTitlePrompt(data) {
  return `
You are a composer. Based on the following briefing, create a title and lyrics for a song.
Respond EXACTLY in the following format, without explanations:
[TITLE]: Song Title Here
[LYRICS]:
(Verse 1)
...
(Chorus)
...

Briefing:
- Occasion: ${data.occasion}
- For: ${data.recipientName} (Relationship: ${data.relationship})
- From: ${data.senderName}
- Details: Hobbies (${data.hobbies}), Qualities (${data.qualities}), Unique traits (${data.uniqueTraits}).
- Main memory: ${data.memories}
- Write the song in ENGLISH
`;
}

async function testEnglishLyricsGeneration() {
  console.log('🎵 Iniciando teste de geração de música em inglês...');
  console.log('📋 Dados do teste:', JSON.stringify(TEST_DATA, null, 2));
  
  try {
    // Criar FormData
    const formData = new FormData();
    
    // Adicionar todos os campos do teste
    Object.keys(TEST_DATA).forEach(key => {
      if (Array.isArray(TEST_DATA[key])) {
        TEST_DATA[key].forEach(item => formData.append(key, item));
      } else {
        formData.append(key, TEST_DATA[key]);
      }
    });
    
    console.log('🚀 Enviando requisição para o endpoint...');
    
    const response = await axios.post(`${API_BASE_URL}/api/generate-preview`, formData, {
      headers: {
        ...formData.getHeaders(),
        'x-guest-id': 'test-guest-english-' + Date.now(),
        'x-device-id': 'test-device-english-' + Date.now()
      },
      timeout: 120000 // 2 minutos de timeout
    });
    
    console.log('✅ Resposta recebida!');
    console.log('📊 Status:', response.status);
    console.log('📄 Dados da resposta:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
      console.log('🎵 Título da música:', response.data.songTitle);
      console.log('📝 Letra gerada (primeiros 300 caracteres):');
      console.log(response.data.lyrics?.substring(0, 300) + '...');
      
      if (response.data.audioUrl) {
        console.log('🎧 URL do áudio:', response.data.audioUrl);
        console.log('🔗 A Suno processou a letra em inglês com sucesso!');
      } else {
        console.log('⚠️  Áudio não foi gerado (modo lyricsOnly ou erro na Suno)');
      }
      
      // Verificar se a letra está em inglês
      const lyrics = response.data.lyrics || '';
      const englishWords = ['the', 'and', 'you', 'are', 'is', 'in', 'to', 'of', 'for', 'with'];
      const foundEnglishWords = englishWords.filter(word => 
        lyrics.toLowerCase().includes(word.toLowerCase())
      );
      
      console.log('\n🔍 ANÁLISE DO IDIOMA:');
      console.log('📊 Palavras em inglês encontradas:', foundEnglishWords.length, '/', englishWords.length);
      console.log('📝 Palavras encontradas:', foundEnglishWords.join(', '));
      
      if (foundEnglishWords.length >= 3) {
        console.log('✅ A letra parece estar em inglês!');
      } else {
        console.log('⚠️  A letra pode não estar em inglês ou o teste precisa ser refinado.');
      }
      
    } else {
      console.log('❌ TESTE FALHOU!');
      console.log('💥 Erro:', response.data.error);
      console.log('📋 Detalhes:', response.data.details);
    }
    
  } catch (error) {
    console.log('💥 ERRO NO TESTE:');
    console.log('📋 Mensagem:', error.message);
    
    if (error.response) {
      console.log('📊 Status da resposta:', error.response.status);
      console.log('📄 Dados da resposta:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Verifique se o servidor está rodando em', API_BASE_URL);
    }
  }
}

// Função para testar apenas geração de letras (sem áudio)
async function testEnglishLyricsOnly() {
  console.log('\n🎵 Testando geração de letras em inglês (sem áudio)...');
  
  const testDataLyricsOnly = {
    ...TEST_DATA,
    lyricsOnly: true
  };
  
  try {
    const formData = new FormData();
    
    Object.keys(testDataLyricsOnly).forEach(key => {
      if (Array.isArray(testDataLyricsOnly[key])) {
        testDataLyricsOnly[key].forEach(item => formData.append(key, item));
      } else {
        formData.append(key, testDataLyricsOnly[key]);
      }
    });
    
    const response = await axios.post(`${API_BASE_URL}/api/generate-preview`, formData, {
      headers: {
        ...formData.getHeaders(),
        'x-guest-id': 'test-guest-lyrics-' + Date.now(),
        'x-device-id': 'test-device-lyrics-' + Date.now()
      },
      timeout: 60000
    });
    
    console.log('✅ Teste de letras concluído!');
    console.log('📄 Resposta:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Erro no teste de letras:', error.message);
    if (error.response) {
      console.log('📄 Dados do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Executar os testes
async function runAllTests() {
  console.log('🚀 INICIANDO TESTES DE GERAÇÃO EM INGLÊS');
  console.log('=' .repeat(50));
  
  // Teste 1: Apenas letras
  await testEnglishLyricsOnly();
  
  console.log('\n' + '='.repeat(50));
  
  // Teste 2: Fluxo completo com áudio
  await testEnglishLyricsGeneration();
  
  console.log('\n🏁 TESTES CONCLUÍDOS!');
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testEnglishLyricsGeneration,
  testEnglishLyricsOnly,
  runAllTests,
  createEnglishLyricsPrompt,
  createEnglishLyricsAndTitlePrompt
};