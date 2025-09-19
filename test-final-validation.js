import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const API_BASE_URL = 'http://localhost:3337';

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFinalValidation() {
  console.log('🧪 [FINAL TEST] Iniciando validação final do salvamento');
  
  const guestId = `final-test-${Date.now()}`;
  console.log('🔍 [FINAL TEST] Guest ID:', guestId);
  
  try {
    // 1. Verificar estado inicial da tabela user_creations
    console.log('\n📊 [FINAL TEST] Verificando estado inicial...');
    const { data: initialCreations, error: initialError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', guestId);
    
    if (initialError) {
      console.error('❌ [FINAL TEST] Erro ao verificar estado inicial:', initialError);
      return;
    }
    
    console.log('📋 [FINAL TEST] Criações iniciais:', initialCreations.length);
    
    // 2. Tentar gerar música real
    console.log('\n🎵 [FINAL TEST] Tentando gerar música real...');
    
    const musicData = {
      recipientName: 'Maria',
      senderName: 'João',
      occasion: 'aniversário',
      relationship: 'amigo',
      emotionalTone: 'alegre',
      hobbies: ['dançar', 'viajar'],
      qualities: ['carinhosa', 'divertida'],
      guestId: guestId
    };
    
    const response = await fetch(`${API_BASE_URL}/api/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-ID': guestId
      },
      body: JSON.stringify(musicData)
    });
    
    const result = await response.json();
    console.log('📝 [FINAL TEST] Resposta da geração:', {
      status: response.status,
      success: result.success,
      taskId: result.taskId,
      error: result.error
    });
    
    if (!response.ok) {
      console.log('⚠️ [FINAL TEST] Geração falhou, mas vamos verificar se há dados salvos');
    }
    
    // 3. Aguardar um pouco para processamento
    console.log('\n⏳ [FINAL TEST] Aguardando processamento...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 4. Verificar se houve salvamento na tabela user_creations
    console.log('\n🔍 [FINAL TEST] Verificando salvamento final...');
    const { data: finalCreations, error: finalError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', guestId);
    
    if (finalError) {
      console.error('❌ [FINAL TEST] Erro ao verificar estado final:', finalError);
      return;
    }
    
    console.log('📋 [FINAL TEST] Criações finais:', finalCreations.length);
    
    if (finalCreations.length > initialCreations.length) {
      console.log('✅ [FINAL TEST] SUCESSO! Dados foram salvos na tabela user_creations');
      console.log('🎵 [FINAL TEST] Nova criação:', finalCreations[finalCreations.length - 1]);
    } else {
      console.log('⚠️ [FINAL TEST] Nenhum novo dado foi salvo na tabela user_creations');
    }
    
    // 5. Verificar tabela songs também
    console.log('\n🔍 [FINAL TEST] Verificando tabela songs...');
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('*')
      .eq('guest_id', guestId);
    
    if (songsError) {
      console.error('❌ [FINAL TEST] Erro ao verificar tabela songs:', songsError);
    } else {
      console.log('🎵 [FINAL TEST] Músicas encontradas:', songs.length);
      if (songs.length > 0) {
        console.log('📝 [FINAL TEST] Última música:', {
          id: songs[0].id,
          title: songs[0].title,
          status: songs[0].generation_status,
          created_at: songs[0].created_at
        });
      }
    }
    
    // 6. Resumo final
    console.log('\n📊 [FINAL TEST] RESUMO FINAL:');
    console.log('- Criações iniciais:', initialCreations.length);
    console.log('- Criações finais:', finalCreations.length);
    console.log('- Músicas na tabela songs:', songs?.length || 0);
    console.log('- Salvamento funcionando:', finalCreations.length > initialCreations.length ? '✅ SIM' : '❌ NÃO');
    
  } catch (error) {
    console.error('❌ [FINAL TEST] Erro no teste final:', error.message);
    console.error('🔍 [FINAL TEST] Stack trace:', error.stack);
  }
}

// Executar teste
testFinalValidation().then(() => {
  console.log('\n✅ [FINAL TEST] Teste final concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ [FINAL TEST] Erro fatal:', error);
  process.exit(1);
});