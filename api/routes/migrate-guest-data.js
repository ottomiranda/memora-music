import { Router } from 'express';
import { SongService } from '../../src/lib/services/songService';
import { MigrateGuestDataSchema } from '../../src/lib/schemas/song';

const router = Router();

/**
 * POST /api/migrate-guest-data
 * Migra dados de músicas de convidado para usuário autenticado
 */
router.post('/', async (req, res) => {
  try {
    console.log('🔄 Requisição de migração de dados:', req.body);

    // Configurar CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Validar dados do corpo da requisição
    const validation = MigrateGuestDataSchema.safeParse(req.body);
    
    if (!validation.success) {
      console.log('❌ Dados inválidos:', validation.error.errors);
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validation.error.errors
      });
    }

    const { guestId } = validation.data;
    
    // TODO: Em produção, o userId deveria vir da autenticação (JWT token)
    // Por enquanto, vamos usar um userId de teste ou gerar um novo
    const userId = req.body.userId || 'test-user-' + Date.now();

    console.log(`🔍 Verificando músicas para migração: ${guestId} → ${userId}`);

    // Verificar se há músicas para migrar
    const guestSongs = await SongService.getSongsByGuest(guestId, 100, 0);
    
    if (guestSongs.length === 0) {
      console.log('ℹ️ Nenhuma música encontrada para migração');
      return res.status(200).json({
        success: true,
        message: 'Nenhuma música encontrada para migração',
        data: {
          migratedCount: 0,
          guestId,
          userId,
          songs: []
        }
      });
    }

    console.log(`📦 Encontradas ${guestSongs.length} músicas para migrar`);

    // Executar migração
    const migrationResult = await SongService.migrateGuestSongs(guestId, userId);
    
    if (!migrationResult.success) {
      console.log('❌ Falha na migração:', migrationResult.error);
      return res.status(500).json({
        success: false,
        error: 'Falha na migração',
        details: migrationResult.error
      });
    }

    console.log(`✅ Migração concluída: ${migrationResult.migratedCount} músicas`);

    // Limpar dados antigos de convidados (opcional)
    try {
      await cleanupOldGuestData();
    } catch (cleanupError) {
      console.warn('⚠️ Erro na limpeza de dados antigos:', cleanupError);
      // Não falhar a migração por causa da limpeza
    }

    return res.status(200).json({
      success: true,
      message: `Migração concluída com sucesso! ${migrationResult.migratedCount} músicas migradas.`,
      data: {
        migratedCount: migrationResult.migratedCount,
        guestId,
        userId,
        songs: guestSongs.map(song => ({
          id: song.id,
          title: song.title,
          createdAt: song.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ Erro na migração de dados:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: errorMessage
    });
  }
});

/**
 * OPTIONS /api/migrate-guest-data
 * Suporte para preflight CORS
 */
router.options('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).send();
});

/**
 * Função auxiliar para verificar status da migração
 */
async function checkMigrationStatus(guestId, userId) {
  try {
    const guestSongs = await SongService.getSongsByGuest(guestId, 1, 0);
    const userSongs = await SongService.getSongsByUser(userId, 1, 0);
    
    return {
      hasGuestData: guestSongs.length > 0,
      hasUserData: userSongs.length > 0,
      needsMigration: guestSongs.length > 0
    };
  } catch (error) {
    console.error('❌ Erro ao verificar status da migração:', error);
    return {
      hasGuestData: false,
      hasUserData: false,
      needsMigration: false
    };
  }
}

/**
 * Função auxiliar para limpeza de dados antigos de convidados
 */
async function cleanupOldGuestData() {
  try {
    // Limpar músicas de convidados com mais de 30 dias
    const result = await SongService.deleteOldGuestSongs(30);
    console.log(`🧹 Limpeza concluída: ${result.deletedCount} registros antigos removidos`);
    return result;
  } catch (error) {
    console.error('❌ Erro na limpeza de dados antigos:', error);
    throw error;
  }
}

export default router;