import type { Request, Response } from 'express';
import { SongService } from '../src/lib/services/songService.js';
import { MigrateGuestDataSchema } from '../src/lib/schemas/song';

export default async function handler(req: Request, res: Response) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-guest-id'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Validar dados do corpo da requisição
    const bodyValidation = MigrateGuestDataSchema.safeParse(req.body);
    
    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: bodyValidation.error.errors
      });
    }

    const { guestId, userId } = bodyValidation.data;

    console.log(`🔄 Iniciando migração de dados do convidado ${guestId} para o usuário ${userId}`);

    // Verificar se existem músicas para migrar
    const guestSongs = await SongService.getSongsByGuest(guestId, 100, 0); // Buscar até 100 músicas
    
    if (guestSongs.length === 0) {
      console.log(`ℹ️ Nenhuma música encontrada para o convidado ${guestId}`);
      return res.status(200).json({
        success: true,
        message: 'Nenhuma música encontrada para migrar',
        data: {
          migratedCount: 0,
          guestId,
          userId,
          songs: []
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📊 Encontradas ${guestSongs.length} músicas para migrar`);

    // Executar a migração
    const migratedCount = await SongService.migrateGuestSongs(guestId, userId);

    // Buscar as músicas migradas para confirmação
    const migratedSongs = await SongService.getSongsByUser(userId, migratedCount, 0);
    
    console.log(`✅ Migração concluída com sucesso! ${migratedCount} músicas migradas`);

    // Preparar resposta de sucesso
    const response = {
      success: true,
      message: `${migratedCount} música(s) migrada(s) com sucesso`,
      data: {
        migratedCount,
        guestId,
        userId,
        songs: migratedSongs.slice(0, migratedCount).map(song => ({
          id: song.id,
          title: song.title,
          createdAt: song.createdAt,
          updatedAt: song.updatedAt,
          audioUrlOption1: song.audioUrlOption1,
          audioUrlOption2: song.audioUrlOption2
        }))
      },
      metadata: {
        migrationTimestamp: new Date().toISOString(),
        originalGuestId: guestId,
        targetUserId: userId
      }
    };

    return res.status(200).json(response);

  } catch (error: unknown) {
    console.error('❌ Erro durante a migração de dados:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Verificar se é um erro específico de migração
    if (errorMessage.includes('Failed to migrate songs')) {
      return res.status(500).json({
        success: false,
        error: 'Erro na migração de dados',
        details: 'Não foi possível migrar as músicas. Tente novamente.',
        originalError: errorMessage,
        timestamp: new Date().toISOString()
      });
    }

    // Verificar se é um erro de validação de dados
    if (errorMessage.includes('Invalid database row structure')) {
      return res.status(500).json({
        success: false,
        error: 'Erro de integridade de dados',
        details: 'Dados inconsistentes encontrados durante a migração.',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}

// Função auxiliar para verificar o status de migração
export async function checkMigrationStatus(guestId: string, userId: string) {
  try {
    const [guestSongs, userSongs] = await Promise.all([
      SongService.getSongsByGuest(guestId, 10, 0),
      SongService.getSongsByUser(userId, 10, 0)
    ]);

    return {
      success: true,
      data: {
        guestSongsRemaining: guestSongs.length,
        userSongsTotal: userSongs.length,
        migrationNeeded: guestSongs.length > 0
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Erro ao verificar status de migração:', error);
    throw error;
  }
}

// Função auxiliar para limpeza de dados antigos de convidados
export async function cleanupOldGuestData(daysOld = 30) {
  try {
    const deletedCount = await SongService.deleteOldGuestSongs(daysOld);
    
    return {
      success: true,
      message: `${deletedCount} música(s) antiga(s) de convidados removida(s)`,
      data: {
        deletedCount,
        daysOld
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Erro na limpeza de dados antigos:', error);
    throw error;
  }
}