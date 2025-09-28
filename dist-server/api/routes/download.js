import { Router } from 'express';
import axios from 'axios';
const router = Router();
const ensureMp3Extension = (filename) => {
    if (!filename) {
        return 'musica_personalizada.mp3';
    }
    const trimmed = filename.trim();
    if (!trimmed) {
        return 'musica_personalizada.mp3';
    }
    return trimmed.toLowerCase().endsWith('.mp3') ? trimmed : `${trimmed}.mp3`;
};
/**
 * Endpoint de proxy para download de arquivos de áudio
 * Resolve problemas de cross-origin ao fazer proxy de arquivos externos
 */
router.get('/', async (req, res) => {
    const externalUrl = req.query.url;
    const filename = ensureMp3Extension(typeof req.query.filename === 'string' ? req.query.filename : undefined);
    if (!externalUrl) {
        return res.status(400).json({ error: 'URL do arquivo é obrigatória.' });
    }
    try {
        console.log(`[DOWNLOAD PROXY] Iniciando download de: ${externalUrl}`);
        // Busca o arquivo como um stream
        const response = await axios({
            method: 'GET',
            url: externalUrl,
            responseType: 'stream',
            timeout: 30000, // 30 segundos de timeout
        });
        // Define os cabeçalhos que forçam o download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        // Se o servidor externo forneceu o tamanho do arquivo, repassa
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }
        console.log(`[DOWNLOAD PROXY] Transmitindo arquivo: ${filename}`);
        // Transmite o stream do arquivo diretamente para o cliente
        response.data.pipe(res);
        // Trata erros no stream
        response.data.on('error', (error) => {
            console.error('[DOWNLOAD PROXY] Erro no stream:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Erro ao transmitir o arquivo.' });
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
        console.error('[DOWNLOAD PROXY] Erro ao fazer proxy do download:', errorMessage);
        if (!res.headersSent) {
            if (errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED') {
                res.status(404).json({ error: 'Arquivo não encontrado ou servidor indisponível.' });
            }
            else if (errorCode === 'ETIMEDOUT') {
                res.status(408).json({ error: 'Timeout ao baixar o arquivo.' });
            }
            else {
                res.status(500).json({ error: 'Não foi possível baixar o arquivo.' });
            }
        }
    }
});
export default router;
//# sourceMappingURL=download.js.map