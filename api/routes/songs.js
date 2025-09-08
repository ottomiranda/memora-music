import { Router } from 'express';
import { SongService } from '../../src/lib/services/songService.js';
import { ListSongsQuerySchema } from '../../src/lib/schemas/song.js';

const router = Router();

/**
 * GET /api/songs
 * Lista as músicas do usuário ou convidado
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 Requisição para listar músicas:', req.query);

    // Configurar CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Validar parâmetros de consulta
    const validation = ListSongsQuerySchema.safeParse(req.query);
    
    console.log('🔍 Resultado da validação:', validation.success ? 'Sucesso' : 'Falha');
    if (!validation.success) {
      console.log('❌ Parâmetros inválidos:', validation.error.errors);
    } else {
      console.log('✅ Parâmetros validados:', validation.data);
    }
    
    if (!validation.success) {
      console.log('❌ Parâmetros inválidos:', validation.error.errors);
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        details: validation.error.errors
      });
    }

    const { userId, guestId, limit, offset } = validation.data;

    let songs;
    let stats;

    if (userId) {
      console.log(`🔍 Buscando músicas do usuário: ${userId}`);
      songs = await SongService.getSongsByUser(userId, limit, offset);
      stats = await getSongStats(userId, null);
    } else if (guestId) {
      console.log(`🔍 Buscando músicas do convidado: ${guestId}`);
      songs = await SongService.getSongsByGuest(guestId, limit, offset);
      stats = await getSongStats(null, guestId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'userId ou guestId é obrigatório'
      });
    }

    console.log(`✅ Encontradas ${songs.length} músicas`);

    return res.status(200).json({
      success: true,
      data: {
        songs,
        pagination: {
          limit,
          offset,
          hasMore: songs.length === limit
        },
        stats
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar músicas:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: errorMessage
    });
  }
});

/**
 * Função auxiliar para obter estatísticas das músicas
 */
async function getSongStats(userId, guestId) {
  try {
    const stats = await SongService.getSongStats(userId, guestId);
    return {
      total: stats.total || 0,
      byStatus: stats.byStatus || {},
      recent: stats.recent || 0
    };
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    return {
      total: 0,
      byStatus: {},
      recent: 0
    };
  }
}

export default router;