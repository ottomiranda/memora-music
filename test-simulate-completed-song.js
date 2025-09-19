import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const API_BASE_URL = 'http://localhost:3337';

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para simular uma música completada (baseada no código original)
async function executeAutoSave(taskData) {
  console.log('\n🎵 Executando autoSaveSongToDatabase simulado...');
  console.log('📊 Dados da tarefa:', JSON.stringify(taskData, null, 2));
  
  try {
    // Simular dados de uma música completada
    const task = {
      taskId: taskData.taskId,
      status: 'completed',
      lyrics: 'Esta é uma letra de teste\nPara verificar o salvamento\nNo banco de dados',
      audioClips: [
        {
          audio_url: 'https://example.com/audio1.mp3',
          image_url: 'https://example.com/image1.jpg'
        },
        {
          audio_url: 'https://example.com/audio2.mp3',
          image_url: 'https://example.com/image2.jpg'
        }
      ],
      metadata: {
        songTitle: taskData.songTitle,
        recipientName: taskData.recipientName,
        occasion: taskData.occasion,
        relationship: taskData.relationship,
        emotionalTone: taskData.emotionalTone,
        genre: taskData.genre,
        mood: taskData.mood
      }
    };
    
    // Simular identificadores
    const userId = null; // Usuário não autenticado
    const guestId = taskData.guestId;
    const deviceId = taskData.deviceId;
    
    console.log('🔍 Identificadores:', { userId, guestId, deviceId });
    
    // Validar identificadores (mesma lógica do código original)
    if (!userId && !guestId && !deviceId) {
      throw new Error('Pelo menos um identificador (userId, guestId ou deviceId) deve estar presente');
    }
    
    // Preparar dados da música
    const songData = {
      user_id: userId || null,
      guest_id: guestId || null,
      title: task.metadata?.songTitle || 'Música Gerada',
      lyrics: task.lyrics || null,
      prompt: `Música para ${task.metadata?.recipientName} na ocasião: ${task.metadata?.occasion}. Relacionamento: ${task.metadata?.relationship}. Tom emocional: ${task.metadata?.emotionalTone}`,
      genre: task.metadata?.genre || null,
      mood: task.metadata?.mood || task.metadata?.emotionalTone || null,
      audio_url_option1: task.audioClips[0]?.audio_url || null,
      audio_url_option2: task.audioClips[1]?.audio_url || null,
      image_url: task.audioClips[0]?.image_url || null,
      suno_task_id: task.taskId
    };
    
    console.log('💾 Dados a serem salvos:', JSON.stringify(songData, null, 2));
    
    // Salvar na tabela songs
    const { data: savedSong, error: songError } = await supabase
      .from('songs')
      .insert(songData)
      .select()
      .single();
      
    if (songError) {
      console.error('❌ Erro ao salvar na tabela songs:', songError);
      throw songError;
    }
    
    console.log('✅ Música salva na tabela songs:', savedSong);
    
    // Atualizar/criar entrada na tabela user_creations
    const creationData = {
      device_id: deviceId,
      user_id: userId,
      ip: '127.0.0.1', // IP simulado
      creations: 1
    };
    
    console.log('📊 Dados para user_creations:', creationData);
    
    // Verificar se já existe entrada
    const { data: existingCreation } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', deviceId)
      .single();
      
    if (existingCreation) {
      // Atualizar entrada existente
      const { data: updatedCreation, error: updateError } = await supabase
        .from('user_creations')
        .update({
          creations: existingCreation.creations + 1,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', deviceId)
        .select()
        .single();
        
      if (updateError) {
        console.error('❌ Erro ao atualizar user_creations:', updateError);
        throw updateError;
      }
      
      console.log('✅ user_creations atualizado:', updatedCreation);
    } else {
      // Criar nova entrada
      const { data: newCreation, error: createError } = await supabase
        .from('user_creations')
        .insert(creationData)
        .select()
        .single();
        
      if (createError) {
        console.error('❌ Erro ao criar user_creations:', createError);
        throw createError;
      }
      
      console.log('✅ user_creations criado:', newCreation);
    }
    
    console.log('🎉 AutoSave executado com sucesso!');
    return { success: true, songId: savedSong.id };
    
  } catch (error) {
    console.error('💥 Erro no autoSave:', error.message);
    console.error('💥 Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

async function testSimulateCompletedSong() {
  console.log('\n=== TESTE DE SIMULAÇÃO DE MÚSICA COMPLETADA ===');
  console.log('🔍 Timestamp:', new Date().toISOString());
  
  try {
    // Dados da tarefa simulada
    const taskData = {
      taskId: 'test-task-' + Date.now(),
      songTitle: 'Música de Teste Simulada',
      recipientName: 'João',
      occasion: 'aniversario',
      relationship: 'amigo',
      emotionalTone: 'alegre',
      genre: 'pop',
      mood: 'energetico',
      guestId: 'test-guest-' + Date.now(),
      deviceId: 'test-device-' + Date.now()
    };
    
    console.log('📝 Dados da tarefa simulada:', JSON.stringify(taskData, null, 2));
    
    // Verificar estado inicial das tabelas
    console.log('\n🔍 Verificando estado inicial das tabelas...');
    
    const { data: initialSongs } = await supabase
      .from('songs')
      .select('*')
      .eq('suno_task_id', taskData.taskId);
      
    const { data: initialCreations } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', taskData.deviceId);
      
    console.log('📊 Songs iniciais:', initialSongs?.length || 0);
    console.log('📊 User_creations iniciais:', initialCreations?.length || 0);
    
    // Executar autoSave simulado
    console.log('\n🚀 Executando autoSave simulado...');
    const result = await executeAutoSave(taskData);
    
    if (result.success) {
      console.log('✅ AutoSave simulado executado com sucesso!');
      console.log('🆔 Song ID:', result.songId);
      
      // Verificar estado final das tabelas
      console.log('\n🔍 Verificando estado final das tabelas...');
      
      const { data: finalSongs } = await supabase
        .from('songs')
        .select('*')
        .eq('suno_task_id', taskData.taskId);
        
      const { data: finalCreations } = await supabase
        .from('user_creations')
        .select('*')
        .eq('device_id', taskData.deviceId);
        
      console.log('📊 Songs finais:', finalSongs?.length || 0);
      console.log('📊 User_creations finais:', finalCreations?.length || 0);
      
      if (finalSongs && finalSongs.length > 0) {
        console.log('✅ Música salva com sucesso na tabela songs');
        console.log('📄 Detalhes da música:', JSON.stringify(finalSongs[0], null, 2));
      } else {
        console.log('❌ Música não encontrada na tabela songs');
      }
      
      if (finalCreations && finalCreations.length > 0) {
        console.log('✅ Entrada criada/atualizada na tabela user_creations');
        console.log('📄 Detalhes:', JSON.stringify(finalCreations[0], null, 2));
      } else {
        console.log('❌ Entrada não encontrada na tabela user_creations');
      }
      
    } else {
      console.log('❌ AutoSave simulado falhou:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    console.error('💥 Stack:', error.stack);
  }
}

// Executar o teste
testSimulateCompletedSong().then(() => {
  console.log('\n🏁 Teste de simulação concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});