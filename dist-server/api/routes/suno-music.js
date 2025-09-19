import { Router } from 'express';
import fetch from 'node-fetch';
const router = Router();
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
function getFromCache(taskId) {
    const entry = cache.get(taskId);
    if (!entry)
        return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(taskId);
        return null;
    }
    return entry.data;
}
function saveToCache(taskId, data) {
    cache.set(taskId, { data, timestamp: Date.now() });
}
router.get('/music/:taskId', async (req, res) => {
    const { taskId } = req.params;
    if (!taskId) {
        return res.status(400).json({ success: false, error: 'taskId é obrigatório' });
    }
    if (!process.env.SUNO_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'SUNO_API_KEY não configurada no backend'
        });
    }
    try {
        const cached = getFromCache(taskId);
        if (cached) {
            return res.json({ success: true, data: cached, cached: true });
        }
        const response = await fetch(`https://api.sunoapi.org/v1/music/${encodeURIComponent(taskId)}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[SUNO MUSIC] Erro ao buscar task', taskId, response.status, errorText);
            return res.status(response.status).json({
                success: false,
                error: `Erro da API Suno: ${response.status} ${response.statusText}`,
                message: errorText
            });
        }
        const data = await response.json();
        saveToCache(taskId, data);
        return res.json({ success: true, data, cached: false });
    }
    catch (error) {
        console.error('[SUNO MUSIC] Erro inesperado', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
export default router;
//# sourceMappingURL=suno-music.js.map