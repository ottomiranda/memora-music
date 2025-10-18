import express from 'express';
import cors from 'cors';

const router = express.Router();

// Configurar CORS para permitir requisições do frontend
router.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Interface para o status da tarefa
interface MusicTaskStatus {
  taskId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  completedClips: number;
  totalExpected: number;
  audioClips: Array<{
    id: string;
    title: string;
    audio_url: string;
    image_url?: string;
  }>;
  error?: string;
  metadata: {
    songTitle: string;
    model: string;
    totalClips?: number;
    processingTime?: string;
  };
  lastUpdate: number;
}

// GET /api/check-music-status/health
// Endpoint de health check
router.get('/health', (req, res) => {
  const tasksCount = global.musicTasks ? global.musicTasks.size : 0;
  
  res.json({
    success: true,
    status: 'healthy',
    activeTasks: tasksCount,
    timestamp: new Date().toISOString()
  });
});

async function resolveTaskStatus(taskId: string, res: express.Response) {
  const startTime = Date.now();

  console.log(`🔍 [${taskId}] Verificando status da tarefa...`);
  
  try {
    // Verificar se o mapa global de tarefas existe
    if (!global.musicTasks) {
      console.log(`❌ [${taskId}] Mapa global de tarefas não encontrado`);
      return res.status(404).json({
        success: false,
        error: 'Sistema de tarefas não inicializado',
        taskId
      });
    }
    
    // Buscar a tarefa no mapa global
    const task = global.musicTasks.get(taskId);
    
    if (!task) {
      console.log(`❌ [${taskId}] Tarefa não encontrada`);
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        taskId
      });
    }
    
    // Preparar resposta com status atual
    const response: MusicTaskStatus = {
      taskId: task.taskId,
      status: task.status,
      completedClips: task.completedClips,
      totalExpected: task.totalExpected,
      audioClips: task.audioClips,
      metadata: task.metadata,
      lastUpdate: task.lastUpdate
    };
    
    // Adicionar erro se existir
    if (task.error) {
      response.error = task.error;
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ [${taskId}] Status verificado em ${processingTime}ms:`, {
      status: task.status,
      completedClips: task.completedClips,
      totalExpected: task.totalExpected,
      audioClipsCount: task.audioClips.length
    });
    
    // Retornar status atual
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [${taskId}] Erro ao verificar status (${processingTime}ms):`, {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao verificar status',
      details: error.message,
      taskId
    });
  }
}

// GET /api/check-music-status
// Suporta taskId via query string (?taskId=...)
router.get('/', async (req, res) => {
  const taskIdParam = req.query.taskId;

  if (!taskIdParam || typeof taskIdParam !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'O parâmetro taskId é obrigatório na query string (?taskId=...)'
    });
  }

  await resolveTaskStatus(taskIdParam, res);
});

// GET /api/check-music-status/:taskId
// Verificar o status de uma tarefa de geração de música via parâmetro de rota
router.get('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  await resolveTaskStatus(taskId, res);
});

export default router;
