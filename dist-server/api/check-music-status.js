import { SongService } from '../src/lib/services/songService.js';
import { CheckStatusQuerySchema } from '../src/lib/schemas/song';
export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-guest-id');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }
    try {
        // Validar parâmetros da query
        const queryValidation = CheckStatusQuerySchema.safeParse(req.query);
        if (!queryValidation.success) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros inválidos',
                details: queryValidation.error.errors
            });
        }
        const { taskId, userId, guestId } = queryValidation.data;
        if (!taskId || typeof taskId !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'TaskId é obrigatório'
            });
        }
        console.log(`🔍 Verificando status da tarefa: ${taskId}`);
        // Verificar se o armazenamento global existe
        if (!global.musicTasks) {
            console.log(`❌ Armazenamento global não inicializado`);
            return res.status(404).json({
                success: false,
                error: 'Tarefa não encontrada',
                status: 'NOT_FOUND'
            });
        }
        // Buscar tarefa no armazenamento
        const task = global.musicTasks.get(taskId);
        if (!task) {
            console.log(`❌ Tarefa ${taskId} não encontrada no armazenamento`);
            return res.status(404).json({
                success: false,
                error: 'Tarefa não encontrada',
                status: 'NOT_FOUND'
            });
        }
        console.log(`✅ Tarefa encontrada. Status: ${task.status}`);
        console.log(`📊 Clipes processados: ${task.audioClips?.length || 0}/${task.totalExpected || 0}`);
        // Calcular tempo decorrido
        const elapsedTime = Date.now() - task.startTime;
        const elapsedMinutes = Math.floor(elapsedTime / 60000);
        const elapsedSeconds = Math.floor((elapsedTime % 60000) / 1000);
        const timeElapsed = `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`;
        // Preparar resposta baseada no status
        const response = {
            success: true,
            taskId: taskId,
            status: task.status,
            timeElapsed: timeElapsed,
            metadata: task.metadata || {}
        };
        // Tentar salvar a música automaticamente se estiver completa e ainda não foi salva
        let savedSong = null;
        if ((task.status === 'COMPLETED' || task.status === 'PARTIAL') &&
            task.audioClips && task.audioClips.length > 0) {
            try {
                // Verificar se a música já foi salva
                const existingSong = await SongService.getSongByTaskId(taskId);
                if (!existingSong) {
                    console.log(`💾 Salvando música automaticamente para taskId: ${taskId}`);
                    // Preparar dados da música para salvamento
                    const songData = {
                        userId: userId || null,
                        guestId: guestId || null,
                        title: task.metadata?.songTitle || 'Música Gerada',
                        lyrics: task.lyrics || null,
                        prompt: null, // Pode ser adicionado se disponível no task
                        genre: null, // Pode ser adicionado se disponível no task
                        mood: null, // Pode ser adicionado se disponível no task
                        audioUrlOption1: task.audioClips[0]?.audio_url || null,
                        audioUrlOption2: task.audioClips[1]?.audio_url || null,
                        sunoTaskId: taskId
                    };
                    savedSong = await SongService.createSong(songData);
                    console.log(`✅ Música salva com sucesso! ID: ${savedSong.id}`);
                    console.log(`📊 Contador freesongsused incrementado automaticamente pelo createSong`);
                    // Nota: O incremento do contador é feito automaticamente dentro do createSong
                }
                else {
                    savedSong = existingSong;
                    console.log(`ℹ️ Música já existe no banco de dados. ID: ${existingSong.id}`);
                }
            }
            catch (saveError) {
                console.error('❌ Erro ao salvar música automaticamente:', saveError);
                // Não falhar a requisição por erro de salvamento
            }
        }
        // Adicionar informações específicas baseadas no status
        switch (task.status) {
            case 'PROCESSING':
                response.message = 'Sua música está sendo gerada. Isso pode levar alguns minutos...';
                response.progress = {
                    completed: task.audioClips?.length || 0,
                    total: task.totalExpected || 2,
                    percentage: Math.round(((task.audioClips?.length || 0) / (task.totalExpected || 2)) * 100)
                };
                break;
            case 'COMPLETED':
                response.message = 'Sua música foi gerada com sucesso!';
                response.audioClips = task.audioClips || [];
                response.lyrics = task.lyrics;
                response.progress = {
                    completed: task.audioClips?.length || 0,
                    total: task.totalExpected || 2,
                    percentage: 100
                };
                // Adicionar informações da música salva
                if (savedSong) {
                    response.savedSong = {
                        id: savedSong.id,
                        title: savedSong.title,
                        createdAt: savedSong.createdAt
                    };
                }
                break;
            case 'PARTIAL':
                response.message = 'Algumas músicas foram geradas com sucesso.';
                response.audioClips = task.audioClips || [];
                response.lyrics = task.lyrics;
                response.progress = {
                    completed: task.audioClips?.length || 0,
                    total: task.totalExpected || 2,
                    percentage: Math.round(((task.audioClips?.length || 0) / (task.totalExpected || 2)) * 100)
                };
                response.warning = 'Nem todas as músicas puderam ser processadas no tempo esperado.';
                // Adicionar informações da música salva
                if (savedSong) {
                    response.savedSong = {
                        id: savedSong.id,
                        title: savedSong.title,
                        createdAt: savedSong.createdAt
                    };
                }
                break;
            case 'FAILED':
                response.message = 'Ocorreu um erro na geração da música.';
                response.error = task.error || 'Erro desconhecido';
                response.progress = {
                    completed: 0,
                    total: task.totalExpected || 2,
                    percentage: 0
                };
                break;
            default:
                response.message = 'Status desconhecido';
                response.progress = {
                    completed: task.audioClips?.length || 0,
                    total: task.totalExpected || 2,
                    percentage: 0
                };
        }
        // Adicionar informações de debug se disponíveis
        if (task.lastUpdate) {
            response.lastUpdate = new Date(task.lastUpdate).toISOString();
        }
        console.log(`📤 Enviando resposta para ${taskId}:`, {
            status: response.status,
            audioClips: response.audioClips?.length || 0,
            timeElapsed: response.timeElapsed
        });
        return res.status(200).json(response);
    }
    catch (error) {
        console.log('❌ Erro ao verificar status da música:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            details: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}
//# sourceMappingURL=check-music-status.js.map