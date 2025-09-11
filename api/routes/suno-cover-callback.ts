import { Router, type Request, type Response } from 'express';
import { getSupabaseServiceClient } from '../../src/lib/supabase-client.js';

const router = Router();

// Callback da Suno para capa (cover)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload: any = req.body || {};
    console.log('[SUNO_COVER_CALLBACK] Payload recebido:', JSON.stringify(payload, null, 2));

    // Extrair taskId do cover e URL da imagem em formatos conhecidos
    const coverTaskId: string | undefined = payload?.data?.taskId || payload?.taskId || payload?.data?.id;
    const imageUrl: string | undefined = payload?.data?.imageUrl || payload?.data?.image_url || payload?.imageUrl || payload?.image_url || payload?.data?.url;

    if (!coverTaskId && !imageUrl) {
      // Alguns provedores enviam primeiro status, depois resultado. Apenas 200 OK para manter compatível
      console.log('[SUNO_COVER_CALLBACK] Sem coverTaskId/imageUrl. Respondendo 200 para ACK.');
      res.status(200).json({ ok: true });
      return;
    }

    let originalTaskId: string | undefined;
    let songId: string | undefined;
    if (global.sunoCoverTasks && coverTaskId) {
      const map = global.sunoCoverTasks.get(coverTaskId);
      if (map) {
        originalTaskId = map.originalTaskId;
        songId = map.songId;
      }
    }

    // Atualizar por task_id utilizando service role
    if (imageUrl) {
      const client = getSupabaseServiceClient();
      if (originalTaskId) {
        const { data, error } = await client
          .from('songs')
          .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
          .eq('task_id', originalTaskId)
          .select('id')
          .limit(1);
        if (error) console.error('[SUNO_COVER_CALLBACK] Erro ao atualizar por task_id:', error);
        else console.log('[SUNO_COVER_CALLBACK] Capa atualizada para música:', data?.[0]?.id);
      }
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[SUNO_COVER_CALLBACK] Erro no callback:', e);
    res.status(200).json({ ok: true });
  }
});

export default router;
