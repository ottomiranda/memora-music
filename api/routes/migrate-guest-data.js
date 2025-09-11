import { Router } from 'express';
import { SongService } from '../../src/lib/services/songService.js';
import { MigrateGuestDataSchema } from '../../src/lib/schemas/song.js';
import { createClient } from '@supabase/supabase-js';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';

const router = Router();

/**
 * POST /api/migrate-guest-data
 * Migra dados de músicas de convidado para usuário autenticado
 */
router.post('/', optionalAuthMiddleware, async (req, res) => {
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
    // Campos opcionais adicionais para migração robusta
    const deviceId = req.body.deviceId;
    // Preferir userId autenticado via Supabase Auth (JWT)
    let userId = req.user?.id || null;
    let email = req.user?.email || null;
    // Preferir o nome vindo do usuário autenticado (metadata) e cair para body
    let name = (req.user && req.user.name) || req.body.name || null;

    // Fallback de desenvolvimento: aceitar userId do body SE for UUID válido
    if (!userId && req.body.userId && typeof req.body.userId === 'string') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(req.body.userId)) {
        userId = req.body.userId;
        email = req.body.email || null;
      }
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado. Faça login para migrar suas músicas.' });
    }

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

    // 1) Criar/atualizar perfil do usuário na tabela users
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const upsertPayload = {
        id: userId,
        email: email || null,
        name: name || null,
        updated_at: new Date().toISOString(),
      };
      if (deviceId) upsertPayload.device_id = deviceId;

      const { error: upsertErr } = await supabase
        .from('users')
        .upsert(upsertPayload, { onConflict: 'id' });
      if (upsertErr) {
        console.warn('⚠️ Falha ao criar/atualizar users:', upsertErr);
      }
    } catch (e) {
      console.warn('⚠️ Erro ao inicializar Supabase para upsert de usuário:', e.message);
    }

    // 2) Executar migração de músicas (guest_id → user_id)
    const migratedCount = await SongService.migrateGuestSongs(guestId, userId);
    console.log(`✅ Migração concluída: ${migratedCount} músicas`);

    // 3) Limpar dados antigos de convidados (opcional)
    try {
      await cleanupOldGuestData();
    } catch (cleanupError) {
      console.warn('⚠️ Erro na limpeza de dados antigos:', cleanupError);
      // Não falhar a migração por causa da limpeza
    }

    return res.status(200).json({
      success: true,
      message: `Migração concluída com sucesso! ${migratedCount} músicas migradas.`,
      data: {
        migratedCount,
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
