import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configurar variáveis de ambiente
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const API_BASE_URL = 'http://localhost:3337';

async function testRealFlow() {
  console.log('🎵 Testando fluxo real de geração de música...');
  
  // Gerar IDs únicos para o teste
  const timestamp = Date.now();
  const testGuestId = `test-guest-${timestamp}`;
  const testDeviceId = `test-device-${timestamp}`;
  
  console.log('🆔 IDs de teste:', { testGuestId, testDeviceId });
  
  // Verificar estado inicial
  console.log('\n🔍 Verificando estado inicial das tabelas...');
  const { data: initialSongs } = await supabase.from('songs').select('*');
  const { data: initialCreations } = await supabase.from('user_creations').select('*');
  console.log('📊 Songs iniciais:', initialSongs?.length || 0);
  console.log('📊 User_creations iniciais:', initialCreations?.length || 0);
  
  // Dados válidos para geração de música
  const formData = {
    occasion: 'aniversario',
    recipientName: 'João',
    relationship: 'amigo',
    senderName: 'Maria',
    hobbies: 'tocar violão, jogar futebol',
    qualities: 'engraçado, carinhoso, leal',
    emotionalTone: 'alegre',
    genre: 'pop',
    mood: 'energetico'
  };
  
  console.log('\n📝 Dados do formulário:', JSON.stringify(formData, null, 2));
  
  try {
    // Fazer requisição para gerar música
    console.log('\n🚀 Enviando requisição para gerar música...');
    const response = await fetch(`${API_BASE_URL}/api/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-ID': testGuestId,
        'X-Device-ID': testDeviceId
      },
      body: JSON.stringify(formData)
    });
    
    const responseText = await response.text();
    console.log('📡 Status da resposta:', response.status);
    console.log('📄 Resposta:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Música iniciada com sucesso!');
      console.log('🆔 Task ID:', result.taskId);
      
      // Aguardar um pouco para o processamento
      console.log('\n⏳ Aguardando processamento (30 segundos)...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Verificar se houve salvamento
      console.log('\n🔍 Verificando se houve salvamento...');
      const { data: finalSongs } = await supabase.from('songs').select('*').eq('suno_task_id', result.taskId);
      const { data: finalCreations } = await supabase.from('user_creations').select('*').eq('device_id', testDeviceId);
      
      console.log('📊 Songs com task_id:', finalSongs?.length || 0);
      console.log('📊 User_creations com device_id:', finalCreations?.length || 0);
      
      if (finalSongs && finalSongs.length > 0) {
        console.log('✅ Música encontrada na tabela songs!');
        console.log('📄 Detalhes:', JSON.stringify(finalSongs[0], null, 2));
      } else {
        console.log('❌ Nenhuma música encontrada na tabela songs');
      }
      
      if (finalCreations && finalCreations.length > 0) {
        console.log('✅ Entrada encontrada na tabela user_creations!');
        console.log('📄 Detalhes:', JSON.stringify(finalCreations[0], null, 2));
      } else {
        console.log('❌ Nenhuma entrada encontrada na tabela user_creations');
      }
      
    } else {
      console.log('❌ Erro na geração de música:', response.status, responseText);
    }
    
  } catch (error) {
    console.log('💥 Erro na requisição:', error.message);
  }
  
  console.log('\n🏁 Teste do fluxo real concluído');
}

// Executar o teste
testRealFlow().catch(console.error);