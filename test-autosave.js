// Teste para verificar se autoSaveSongToDatabase está funcionando
import dotenv from 'dotenv';
import { SongService } from './src/lib/services/songService.js';

// Carregar variáveis de ambiente
dotenv.config();

// Simular dados de uma música completa
const mockTask = {
  taskId: 'test-task-' + Date.now(),
  audioClips: [
    {
      id: 'clip1',
      title: 'Teste Música 1',
      audio_url: 'https://example.com/audio1.mp3',
      image_url: 'https://example.com/image1.jpg'
    },
    {
      id: 'clip2', 
      title: 'Teste Música 2',
      audio_url: 'https://example.com/audio2.mp3',
      image_url: 'https://example.com/image2.jpg'
    }
  ],
  lyrics: 'Esta é uma música de teste\nPara verificar o salvamento\nNo banco de dados',
  metadata: {
    songTitle: 'Música de Teste - AutoSave',
    recipientName: 'João',
    occasion: 'Aniversário',
    relationship: 'Amigo',
    emotionalTone: 'Alegre',
    genre: 'Pop',
    mood: 'Feliz',
    userId: null, // Teste como guest
    guestId: 'test-guest-' + Date.now()
  }
};

async function testAutoSave() {
  console.log('🧪 [TEST] Iniciando teste de autoSaveSongToDatabase');
  console.log('📋 [TEST] Dados do teste:', JSON.stringify(mockTask, null, 2));
  
  try {
    // Preparar dados da música como na função original
    const songData = {
      userId: mockTask.metadata?.userId || null,
      guestId: mockTask.metadata?.guestId || null,
      title: mockTask.metadata?.songTitle || 'Música Gerada',
      lyrics: mockTask.lyrics || null,
      prompt: `Música para ${mockTask.metadata?.recipientName} na ocasião: ${mockTask.metadata?.occasion}. Relacionamento: ${mockTask.metadata?.relationship}. Tom emocional: ${mockTask.metadata?.emotionalTone}`,
      genre: mockTask.metadata?.genre || null,
      mood: mockTask.metadata?.mood || mockTask.metadata?.emotionalTone || null,
      audioUrlOption1: mockTask.audioClips[0]?.audio_url || null,
      audioUrlOption2: mockTask.audioClips[1]?.audio_url || null,
      imageUrl: mockTask.audioClips[0]?.image_url || null,
      sunoTaskId: mockTask.taskId
    };
    
    console.log('💾 [TEST] Tentando salvar música com dados:', JSON.stringify(songData, null, 2));
    
    // Chamar SongService.createSong diretamente
    const savedSong = await SongService.createSong(songData);
    
    console.log('✅ [TEST] Música salva com sucesso!');
    console.log('🎵 [TEST] ID da música:', savedSong.id);
    console.log('📊 [TEST] Dados salvos:', JSON.stringify(savedSong, null, 2));
    
    // Verificar se foi salvo na tabela user_creations também
    console.log('🔍 [TEST] Verificando se foi salvo na tabela user_creations...');
    
    return savedSong;
    
  } catch (error) {
    console.error('❌ [TEST] Erro no teste:', error.message);
    console.error('📋 [TEST] Stack trace:', error.stack);
    throw error;
  }
}

// Executar o teste
testAutoSave()
  .then((result) => {
    console.log('🎉 [TEST] Teste concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 [TEST] Teste falhou:', error.message);
    process.exit(1);
  });