// Teste de simulação da função autoSaveSongToDatabase
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Simular dados de uma tarefa completa
const mockTask = {
  id: 'test-task-' + Date.now(),
  status: 'COMPLETED',
  metadata: {
    recipientName: 'Maria Teste',
    senderName: 'João Teste',
    occasion: 'Teste Simulação',
    relationship: 'Amiga',
    emotionalTone: 'Alegre',
    songTitle: 'Música de Teste Simulação',
    hobbies: 'Música e dança',
    qualities: 'Carinhosa e divertida',
    guestId: 'test-simulation-' + Date.now()
  },
  completedClips: [
    {
      id: 'clip-1',
      audio_url: 'https://example.com/audio1.mp3',
      video_url: 'https://example.com/video1.mp4',
      title: 'Parte 1 da Música',
      tags: 'alegre, amizade'
    },
    {
      id: 'clip-2', 
      audio_url: 'https://example.com/audio2.mp3',
      video_url: 'https://example.com/video2.mp4',
      title: 'Parte 2 da Música',
      tags: 'carinhosa, divertida'
    }
  ]
};

// Simular resposta do Suno
const mockSunoResponse = {
  id: 'suno-' + Date.now(),
  title: mockTask.metadata.songTitle,
  audio_url: 'https://example.com/final-audio.mp3',
  video_url: 'https://example.com/final-video.mp4',
  image_url: 'https://example.com/cover.jpg',
  tags: 'alegre, amizade, carinhosa',
  duration: 180
};

// Função autoSaveSongToDatabase extraída do código original
async function autoSaveSongToDatabase(task, userId = null, guestId = null, sunoResponse = null) {
  console.log('🔄 [AUTOSAVE] Iniciando salvamento automático...');
  console.log('📋 [AUTOSAVE] Task ID:', task.id);
  console.log('👤 [AUTOSAVE] User ID:', userId);
  console.log('🎭 [AUTOSAVE] Guest ID:', guestId);
  
  try {
    // Validar identificadores
    if (!userId && !guestId) {
      console.log('⚠️ [AUTOSAVE] Nenhum identificador fornecido, usando guestId da task');
      guestId = task.metadata?.guestId;
    }
    
    if (!userId && !guestId) {
      throw new Error('Pelo menos um identificador (userId ou guestId) é obrigatório');
    }
    
    console.log('✅ [AUTOSAVE] Identificadores validados');
    
    // Preparar dados da música
    const songData = {
      title: task.metadata?.songTitle || 'Música Personalizada',
      sunoTaskId: task.id,
      generationStatus: 'completed',
      metadata: {
        recipientName: task.metadata?.recipientName,
        senderName: task.metadata?.senderName,
        occasion: task.metadata?.occasion,
        relationship: task.metadata?.relationship,
        emotionalTone: task.metadata?.emotionalTone,
        hobbies: task.metadata?.hobbies,
        qualities: task.metadata?.qualities,
        completedClips: task.completedClips || [],
        sunoResponse: sunoResponse
      }
    };
    
    // Adicionar identificadores
    if (userId) {
      songData.userId = userId;
    }
    if (guestId) {
      songData.guestId = guestId;
    }
    
    console.log('📝 [AUTOSAVE] Dados preparados:', {
      title: songData.title,
      sunoTaskId: songData.sunoTaskId,
      userId: songData.userId,
      guestId: songData.guestId,
      generationStatus: songData.generationStatus
    });
    
    // Importar SongService
    const { SongService } = await import('./src/lib/services/songService.js');
    
    // Salvar no banco de dados
    console.log('💾 [AUTOSAVE] Salvando no banco de dados...');
    const savedSong = await SongService.createSong(songData);
    
    console.log('✅ [AUTOSAVE] Música salva com sucesso!');
    console.log('🎵 [AUTOSAVE] ID da música salva:', savedSong.id);
    
    // Verificar se foi salva na tabela user_creations
    console.log('🔍 [AUTOSAVE] Verificando tabela user_creations...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const deviceId = guestId || `user-${userId}`;
    const { data: userCreations, error: userCreationsError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', deviceId);
    
    if (userCreationsError) {
      console.log('❌ [AUTOSAVE] Erro ao verificar user_creations:', userCreationsError.message);
    } else if (userCreations && userCreations.length > 0) {
      console.log('✅ [AUTOSAVE] Registro encontrado em user_creations!');
      console.log('📊 [AUTOSAVE] Dados user_creations:', userCreations[0]);
    } else {
      console.log('⚠️ [AUTOSAVE] Nenhum registro encontrado em user_creations');
    }
    
    return savedSong;
    
  } catch (error) {
    console.error('❌ [AUTOSAVE] Erro no salvamento automático:', error.message);
    console.error('🔍 [AUTOSAVE] Stack trace:', error.stack);
    throw error;
  }
}

async function testAutoSaveSimulation() {
  console.log('🧪 [TEST] Iniciando teste de simulação do autoSaveSongToDatabase');
  
  try {
    // Testar com guestId
    console.log('\n👤 [TEST] Testando com guestId...');
    const result = await autoSaveSongToDatabase(
      mockTask,
      null, // userId
      mockTask.metadata.guestId, // guestId
      mockSunoResponse // sunoResponse
    );
    
    console.log('\n✅ [TEST] Teste de simulação concluído com sucesso!');
    console.log('📊 [TEST] Resultado:', {
      id: result.id,
      title: result.title,
      guestId: result.guestId,
      sunoTaskId: result.sunoTaskId,
      generationStatus: result.generationStatus
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ [TEST] Erro no teste de simulação:', error.message);
    throw error;
  }
}

// Executar o teste
testAutoSaveSimulation()
  .then((result) => {
    console.log('\n🎉 [TEST] Teste de simulação finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 [TEST] Teste de simulação falhou:', error.message);
    process.exit(1);
  });