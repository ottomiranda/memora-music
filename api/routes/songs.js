import { Router } from 'express';
import { SongService } from '../../src/lib/services/songService.js';
import { ListSongsQuerySchema } from '../../src/lib/schemas/song.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';

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
 * GET /api/songs/discover
 * Lista músicas públicas para descoberta (aleatórias, com capa e áudio)
 */
router.get('/discover', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(72, parseInt(String(req.query.limit || '24'), 10) || 24));
    const songs = await SongService.getRandomPublicSongs(limit);
    return res.status(200).json({ success: true, data: { songs } });
  } catch (error) {
    console.error('[SONGS] GET /discover erro:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar músicas públicas' });
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

/**
 * PUT /api/songs/:id
 * Atualiza campos simples (ex.: título, letra)
 */
router.put('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const songId = req.params.id;
    const { title, lyrics } = req.body || {};

    const userId = (req).user?.id || null;
    const guestId = req.headers['x-guest-id'] || null;

    if (!songId) {
      return res.status(400).json({ success: false, message: 'Song ID é obrigatório' });
    }

    const updated = await SongService.updateSong(songId, { title, lyrics }, { userId, guestId });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('[SONGS] PUT erro:', error);
    return res.status(500).json({ success: false, message: 'Erro ao atualizar música' });
  }
});

/**
 * DELETE /api/songs/:id
 * Exclui música do proprietário (usuário autenticado ou convidado via X-Guest-ID)
 */
router.delete('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const songId = req.params.id;
    const userId = (req).user?.id || null;
    const guestId = req.headers['x-guest-id'] || null;
    if (!songId) {
      return res.status(400).json({ success: false, message: 'Song ID é obrigatório' });
    }
    const ok = await SongService.deleteSong(songId, { userId, guestId });
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Música não encontrada ou sem permissão' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[SONGS] DELETE erro:', error);
    return res.status(500).json({ success: false, message: 'Erro ao excluir música' });
  }
});

/**
 * GET /api/songs/:id/public
 * Retorna dados públicos de uma música para página de compartilhamento
 */
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Song ID é obrigatório' });

    const song = await SongService.getSongById(id);
    if (!song) return res.status(404).json({ success: false, message: 'Música não encontrada' });

    // Retornar apenas campos públicos
    return res.status(200).json({
      success: true,
      data: {
        id: song.id,
        title: song.title,
        imageUrl: song.imageUrl || null,
        lyrics: song.lyrics || null,
        audioUrlOption1: song.audioUrlOption1 || null,
        audioUrlOption2: song.audioUrlOption2 || null,
        createdAt: song.createdAt,
        generationStatus: song.generationStatus || null
      }
    });
  } catch (error) {
    console.error('[SONGS] GET /:id/public erro:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar música' });
  }
});
