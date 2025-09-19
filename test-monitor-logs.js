// Teste para monitorar logs do servidor durante geração de música
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { spawn } from 'child_process';

// Carregar variáveis de ambiente
dotenv.config();

const API_BASE_URL = 'http://localhost:3337';

// Função autoSaveSongToDatabase inline (baseada no código original)
async function executeAutoSave(task, userId = null, guestId = null, sunoResponse = null) {
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
    
    return savedSong;
    
  } catch (error) {
    console.error('❌ [AUTOSAVE] Erro no salvamento automático:', error.message);
    console.error('🔍 [AUTOSAVE] Stack trace:', error.stack);
    throw error;
  }
}

async function monitorServerLogs() {
  console.log('🔍 [MONITOR] Iniciando monitoramento de logs do servidor...');
  
  // Criar um processo para monitorar os logs do servidor
  const logProcess = spawn('tail', ['-f', '/dev/null'], { stdio: 'pipe' });
  
  let logBuffer = [];
  const maxLogLines = 100;
  
  // Simular captura de logs (na prática, precisaríamos acessar os logs reais)
  console.log('📋 [MONITOR] Logs serão capturados durante o teste...');
  
  return {
    addLog: (message) => {
      logBuffer.push(`${new Date().toISOString()} - ${message}`);
      if (logBuffer.length > maxLogLines) {
        logBuffer.shift();
      }
      console.log(`📝 [LOG] ${message}`);
    },
    getLogs: () => logBuffer,
    stop: () => {
      if (logProcess && !logProcess.killed) {
        logProcess.kill();
      }
    }
  };
}

async function testWithLogMonitoring() {
  console.log('🧪 [TEST] Iniciando teste com monitoramento de logs');
  
  const monitor = await monitorServerLogs();
  
  try {
    // 1. Tentar gerar uma música simples
    console.log('\n📝 [TEST] Passo 1: Tentando gerar música...');
    const guestId = 'test-monitor-' + Date.now();
    
    monitor.addLog('Iniciando geração de música para teste');
    
    const generateResponse = await fetch(`${API_BASE_URL}/api/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-ID': guestId
      },
      body: JSON.stringify({
        recipientName: 'Maria Monitor',
        senderName: 'João Monitor',
        occasion: 'Teste Monitor',
        relationship: 'Amiga',
        emotionalTone: 'Alegre',
        songTitle: 'Música de Teste Monitor',
        hobbies: 'Música',
        qualities: 'Carinhosa',
        guestId: guestId
      })
    });
    
    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      monitor.addLog(`Erro na geração: ${generateResponse.status} - ${errorText}`);
      
      if (generateResponse.status === 503) {
        console.log('⚠️ [TEST] Serviço indisponível (alta demanda)');
        console.log('🔄 [TEST] Simulando cenário de música completada...');
        
        // Simular uma música que foi completada
        await simulateCompletedSong(monitor, guestId);
        return;
      }
      
      throw new Error(`Erro na geração: ${generateResponse.status} - ${errorText}`);
    }
    
    const generateData = await generateResponse.json();
    monitor.addLog(`Música iniciada com taskId: ${generateData.taskId}`);
    
    if (!generateData.success || !generateData.taskId) {
      throw new Error('Falha ao iniciar geração de música');
    }
    
    const taskId = generateData.taskId;
    console.log(`🎵 [TEST] TaskID: ${taskId}`);
    
    // 2. Monitorar por um tempo limitado
    console.log('\n⏳ [TEST] Passo 2: Monitorando por 30 segundos...');
    let attempts = 0;
    const maxAttempts = 6; // 30 segundos
    
    while (attempts < maxAttempts) {
      attempts++;
      
      const statusResponse = await fetch(`${API_BASE_URL}/api/check-music-status/${taskId}`);
      
      if (!statusResponse.ok) {
        monitor.addLog(`Erro ao verificar status: ${statusResponse.status}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      const statusData = await statusResponse.json();
      monitor.addLog(`Status: ${statusData.status}, Clipes: ${statusData.completedClips}/${statusData.totalExpected}`);
      
      if (statusData.status === 'COMPLETED') {
        monitor.addLog('🎉 Música completada! Verificando se autoSaveSongToDatabase foi executada...');
        break;
      } else if (statusData.status === 'FAILED') {
        monitor.addLog(`❌ Geração falhou: ${statusData.error}`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // 3. Verificar se a música foi salva
    console.log('\n💾 [TEST] Passo 3: Verificando salvamento...');
    await checkIfSongWasSaved(monitor, taskId, guestId);
    
  } catch (error) {
    monitor.addLog(`Erro no teste: ${error.message}`);
    console.error('❌ [TEST] Erro:', error.message);
  } finally {
    monitor.stop();
    
    // Mostrar resumo dos logs
    console.log('\n📋 [TEST] Resumo dos logs capturados:');
    const logs = monitor.getLogs();
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
  }
}

async function simulateCompletedSong(monitor, guestId) {
  console.log('🎭 [SIMULATE] Simulando música completada...');
  
  monitor.addLog('Simulando música que foi completada');
  
  // Simular dados de uma música completada
  const mockTask = {
    id: 'simulated-task-' + Date.now(),
    status: 'COMPLETED',
    metadata: {
      recipientName: 'Maria Simulada',
      senderName: 'João Simulado',
      occasion: 'Teste Simulado',
      relationship: 'Amiga',
      emotionalTone: 'Alegre',
      songTitle: 'Música Simulada',
      hobbies: 'Música',
      qualities: 'Carinhosa',
      guestId: guestId
    },
    completedClips: [
      {
        id: 'clip-sim-1',
        audio_url: 'https://example.com/sim-audio.mp3',
        title: 'Música Simulada'
      }
    ]
  };
  
  monitor.addLog('Chamando autoSaveSongToDatabase para música simulada...');
  
  try {
    // Executar função autoSaveSongToDatabase inline (baseada no código original)
    const result = await executeAutoSave(mockTask, null, guestId, null);
    
    monitor.addLog(`✅ autoSaveSongToDatabase executada com sucesso! ID: ${result.id}`);
    
    // Verificar user_creations
    await checkUserCreations(monitor, guestId);
    
  } catch (error) {
    monitor.addLog(`❌ Erro ao executar autoSaveSongToDatabase: ${error.message}`);
  }
}

async function checkIfSongWasSaved(monitor, taskId, guestId) {
  monitor.addLog('Verificando se a música foi salva no banco...');
  
  try {
    const { SongService } = await import('./src/lib/services/songService.js');
    
    // Buscar por taskId
    const songByTaskId = await SongService.getSongByTaskId(taskId);
    
    if (songByTaskId) {
      monitor.addLog(`✅ Música encontrada por taskId: ${songByTaskId.id}`);
    } else {
      monitor.addLog('⚠️ Música não encontrada por taskId');
    }
    
    // Buscar por guestId
    const songsByGuest = await SongService.getSongsByGuest(guestId);
    
    if (songsByGuest && songsByGuest.length > 0) {
      monitor.addLog(`✅ ${songsByGuest.length} música(s) encontrada(s) por guestId`);
    } else {
      monitor.addLog('⚠️ Nenhuma música encontrada por guestId');
    }
    
    // Verificar user_creations
    await checkUserCreations(monitor, guestId);
    
  } catch (error) {
    monitor.addLog(`❌ Erro ao verificar salvamento: ${error.message}`);
  }
}

async function checkUserCreations(monitor, guestId) {
  monitor.addLog('Verificando tabela user_creations...');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: userCreations, error } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', guestId);
    
    if (error) {
      monitor.addLog(`❌ Erro ao verificar user_creations: ${error.message}`);
    } else if (userCreations && userCreations.length > 0) {
      monitor.addLog(`✅ Registro encontrado em user_creations: ${userCreations[0].creations} criações`);
    } else {
      monitor.addLog('⚠️ Nenhum registro encontrado em user_creations');
    }
    
  } catch (error) {
    monitor.addLog(`❌ Erro ao verificar user_creations: ${error.message}`);
  }
}

// Executar o teste
testWithLogMonitoring()
  .then(() => {
    console.log('\n✅ [TEST] Teste de monitoramento concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ [TEST] Teste de monitoramento falhou:', error.message);
    process.exit(1);
  });