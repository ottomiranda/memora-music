// Teste específico para a função autoSaveSongToDatabase
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar variáveis de ambiente
dotenv.config();

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ler o arquivo generate-preview.ts e extrair a função autoSaveSongToDatabase
const generatePreviewPath = join(__dirname, 'api', 'routes', 'generate-preview.ts');
const generatePreviewContent = readFileSync(generatePreviewPath, 'utf8');

// Simular a função autoSaveSongToDatabase
const { SongService } = await import('./src/lib/services/songService.js');

// Função extraída do código original
async function autoSaveSongToDatabase(task, userId = null, guestId = null) {
  try {
    console.log('🔄 [AUTO-SAVE] Iniciando salvamento automático...');
    console.log('📋 [AUTO-SAVE] Task:', JSON.stringify(task, null, 2));
    console.log('👤 [AUTO-SAVE] UserId:', userId, 'GuestId:', guestId);
    
    if (!userId && !guestId) {
      console.log('⚠️ [AUTO-SAVE] Nenhum userId ou guestId fornecido, pulando salvamento');
      return;
    }

    // Preparar dados da música
    const songData = {
      userId: userId || null,
      guestId: guestId || null,
      title: task.metadata?.songTitle || 'Música Gerada',
      lyrics: task.lyrics || null,
      prompt: task.metadata ? `Música para ${task.metadata.recipientName} na ocasião: ${task.metadata.occasion}. Relacionamento: ${task.metadata.relationship}. Tom emocional: ${task.metadata.emotionalTone}` : null,
      genre: task.metadata?.genre || null,
      mood: task.metadata?.mood || task.metadata?.emotionalTone || null,
      audioUrlOption1: task.audioClips?.[0]?.audio_url || null,
      audioUrlOption2: task.audioClips?.[1]?.audio_url || null,
      imageUrl: task.audioClips?.[0]?.image_url || null,
      sunoTaskId: task.taskId
    };

    console.log('💾 [AUTO-SAVE] Dados preparados:', JSON.stringify(songData, null, 2));

    // Salvar no banco de dados
    const savedSong = await SongService.createSong(songData);
    console.log('✅ [AUTO-SAVE] Música salva com sucesso! ID:', savedSong.id);
    
    return savedSong;
  } catch (error) {
    console.error('❌ [AUTO-SAVE] Erro ao salvar música:', error.message);
    console.error('📋 [AUTO-SAVE] Stack trace:', error.stack);
    throw error;
  }
}

// Simular dados de uma tarefa completa
const mockCompletedTask = {
  taskId: 'auto-save-test-' + Date.now(),
  status: 'COMPLETED',
  audioClips: [
    {
      id: 'clip1',
      title: 'Teste AutoSave 1',
      audio_url: 'https://example.com/autosave1.mp3',
      image_url: 'https://example.com/autosave1.jpg'
    },
    {
      id: 'clip2', 
      title: 'Teste AutoSave 2',
      audio_url: 'https://example.com/autosave2.mp3',
      image_url: 'https://example.com/autosave2.jpg'
    }
  ],
  lyrics: 'Esta é uma música de teste\nPara verificar a função autoSaveSongToDatabase\nQuando a música está completa',
  metadata: {
    songTitle: 'Teste AutoSave Function',
    recipientName: 'Maria',
    occasion: 'Formatura',
    relationship: 'Irmã',
    emotionalTone: 'Orgulhoso',
    genre: 'Balada',
    mood: 'Inspirador'
  }
};

async function testAutoSaveFunction() {
  console.log('🧪 [TEST] Testando função autoSaveSongToDatabase');
  console.log('📋 [TEST] Simulando música completa...');
  
  try {
    // Testar com guest ID
    const guestId = 'autosave-guest-' + Date.now();
    console.log('👤 [TEST] Testando com guestId:', guestId);
    
    const result = await autoSaveSongToDatabase(mockCompletedTask, null, guestId);
    
    console.log('🎉 [TEST] Função autoSaveSongToDatabase executada com sucesso!');
    console.log('📊 [TEST] Resultado:', JSON.stringify(result, null, 2));
    
    // Verificar se foi salvo na user_creations
    console.log('🔍 [TEST] Verificando tabela user_creations...');
    
    return result;
    
  } catch (error) {
    console.error('💥 [TEST] Erro no teste da função:', error.message);
    throw error;
  }
}

// Executar o teste
testAutoSaveFunction()
  .then((result) => {
    console.log('✅ [TEST] Teste da função autoSaveSongToDatabase concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ [TEST] Teste da função falhou:', error.message);
    process.exit(1);
  });