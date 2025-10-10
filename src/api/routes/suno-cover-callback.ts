import { NextApiRequest, NextApiResponse } from 'next';
import { SunoCallback, SunoError } from '@/types/suno';
import { prisma } from '@/server/db/client';
import { logger } from '@/server/logging/pino';
import { validateSunoCallback } from '@/lib/validators/suno';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const callback = await validateSunoCallback(req.body);

    const { requestId, status, audioUrl, error } = callback;

    // Atualiza o status da música no banco de dados
    await prisma.song.update({
      where: { sunoRequestId: requestId },
      data: {
        status,
        audioUrl: audioUrl || null,
        error: error || null,
        updatedAt: new Date()
      }
    });

    // Registra o evento no log
    logger.info({
      msg: 'Suno callback processed',
      requestId,
      status,
      hasAudio: !!audioUrl,
      hasError: !!error
    });

    // Notifica os clientes conectados via WebSocket (se implementado)
    // notifyClients({ type: 'SUNO_STATUS_UPDATE', payload: callback });

    return res.status(200).json({ success: true });
  } catch (error) {
    const sunoError: SunoError = {
      code: 'CALLBACK_PROCESSING_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? { stack: error.stack } : undefined
    };

    logger.error({
      msg: 'Error processing Suno callback',
      error: sunoError
    });

    return res.status(500).json({ error: sunoError });
  }
}