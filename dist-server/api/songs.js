import { SongService } from '../src/lib/services/songService.js';
import { ListSongsQuerySchema } from '../src/lib/schemas/song.js';
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
        const queryValidation = ListSongsQuerySchema.safeParse(req.query);
        if (!queryValidation.success) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros inválidos',
                details: queryValidation.error.errors
            });
        }
        const { userId, guestId, limit = 20, offset = 0 } = queryValidation.data;
        console.log(`🎵 Listando músicas - userId: ${userId}, guestId: ${guestId}, limit: ${limit}, offset: ${offset}`);
        let songs = [];
        const totalCount = 0;
        if (userId) {
            // Buscar músicas do usuário autenticado
            songs = await SongService.getSongsByUser(userId, limit, offset);
            console.log(`✅ Encontradas ${songs.length} músicas para o usuário ${userId}`);
        }
        else if (guestId) {
            // Buscar músicas do convidado
            songs = await SongService.getSongsByGuest(guestId, limit, offset);
            console.log(`✅ Encontradas ${songs.length} músicas para o convidado ${guestId}`);
        }
        else {
            return res.status(400).json({
                success: false,
                error: 'É necessário fornecer userId ou guestId'
            });
        }
        // Preparar resposta
        const response = {
            success: true,
            data: {
                songs: songs.map(song => ({
                    id: song.id,
                    title: song.title,
                    lyrics: song.lyrics,
                    prompt: song.prompt,
                    genre: song.genre,
                    mood: song.mood,
                    audioUrlOption1: song.audioUrlOption1,
                    audioUrlOption2: song.audioUrlOption2,
                    generationStatus: song.generationStatus,
                    createdAt: song.createdAt,
                    updatedAt: song.updatedAt,
                    // Incluir IDs apenas para debug/admin
                    ...(process.env.NODE_ENV === 'development' && {
                        userId: song.userId,
                        guestId: song.guestId,
                        sunoTaskId: song.sunoTaskId
                    })
                })),
                pagination: {
                    limit,
                    offset,
                    count: songs.length,
                    hasMore: songs.length === limit // Se retornou o limite, pode haver mais
                }
            },
            metadata: {
                requestedBy: userId ? 'user' : 'guest',
                requestedId: userId || guestId,
                timestamp: new Date().toISOString()
            }
        };
        console.log(`📤 Enviando ${songs.length} músicas na resposta`);
        return res.status(200).json(response);
    }
    catch (error) {
        console.error('❌ Erro ao listar músicas:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            details: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}
// Função auxiliar para obter estatísticas (pode ser usada em endpoints admin)
export async function getSongStats() {
    try {
        const stats = await SongService.getSongStats();
        return {
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        throw error;
    }
}
//# sourceMappingURL=songs.js.map