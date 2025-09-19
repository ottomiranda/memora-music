import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const API_BASE_URL = 'http://localhost:3337';

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCorrectValidation() {
  console.log('\n=== TESTE DE VALIDAÇÃO CORRETA ===');
  console.log('🔍 Timestamp:', new Date().toISOString());
  
  try {
    // Dados corretos baseados no schema de validação
    const correctFormData = {
      songTitle: 'Música de Teste',
      recipientName: 'João',
      occasion: 'aniversario', // Campo obrigatório
      relationship: 'amigo', // Campo obrigatório
      senderName: 'Maria', // Campo obrigatório
      hobbies: 'musica, esportes', // Campo obrigatório (string)
      qualities: 'carinhoso, divertido', // Campo obrigatório (string)
      emotionalTone: 'alegre',
      genre: 'pop',
      mood: 'energetico',
      tempo: 'medio',
      duration: '2-3',
      lyricsOnly: false
    };
    
    console.log('📝 Dados do formulário:', JSON.stringify(correctFormData, null, 2));
    
    // Headers necessários
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-ID': 'test-device-' + Date.now(),
      'X-Guest-ID': 'test-guest-' + Date.now()
    };
    
    console.log('📋 Headers:', JSON.stringify(headers, null, 2));
    
    // Fazer requisição
    console.log('🚀 Enviando requisição para geração de música...');
    const response = await fetch(`${API_BASE_URL}/api/generate-preview`, {
      method: 'POST',
      headers,
      body: JSON.stringify(correctFormData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Status text:', response.statusText);
    
    const responseData = await response.json();
    console.log('📊 Dados da resposta:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Requisição bem-sucedida!');
      
      if (responseData.taskId) {
        console.log('🎵 Task ID gerado:', responseData.taskId);
        
        // Aguardar um pouco para o processamento
        console.log('⏳ Aguardando 10 segundos para processamento...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Verificar se foi salvo no banco
        console.log('🔍 Verificando salvamento no banco de dados...');
        
        // Verificar tabela user_creations
        const { data: userCreations, error: userCreationsError } = await supabase
          .from('user_creations')
          .select('*')
          .eq('device_id', headers['X-Device-ID']);
          
        if (userCreationsError) {
          console.error('❌ Erro ao consultar user_creations:', userCreationsError);
        } else {
          console.log('📊 Dados em user_creations:', userCreations);
        }
        
        // Verificar tabela songs
        const { data: songs, error: songsError } = await supabase
          .from('songs')
          .select('*')
          .eq('suno_task_id', responseData.taskId);
          
        if (songsError) {
          console.error('❌ Erro ao consultar songs:', songsError);
        } else {
          console.log('📊 Dados em songs:', songs);
        }
        
      } else {
        console.log('⚠️ Resposta sem taskId');
      }
      
    } else {
      console.log('❌ Requisição falhou!');
      
      if (response.status === 400) {
        console.log('🔍 Detalhes do erro de validação:');
        if (responseData.details) {
          responseData.details.forEach((detail, index) => {
            console.log(`  ${index + 1}. Campo '${detail.path?.join('.')}': ${detail.message}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    console.error('💥 Stack:', error.stack);
  }
}

// Executar o teste
testCorrectValidation().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});