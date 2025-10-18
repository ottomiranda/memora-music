import { Router } from 'express';
import axios from 'axios';
const router = Router();
// ===== Utilitários locais espelhando src/utils/filename.ts =====
const stripDiacritics = (input) => {
    return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};
const sanitizeForFilesystem = (input) => {
    let s = input.normalize('NFKC').trim().replace(/\.+$/, '');
    s = s.replace(/[<>:\"/\\|?*\x00-\x1F]/g, '-');
    s = s.replace(/[\s]+/g, ' ').replace(/-{2,}/g, '-');
    s = s.trim().replace(/^[\s-]+|[\s-]+$/g, '');
    return s || 'musica_personalizada';
};
const ensureMp3Suffix = (name) => {
    return /\.mp3$/i.test(name) ? name.replace(/\.mp3$/i, '.mp3') : `${name}.mp3`;
};
const buildMp3FilenameServer = (title) => {
    const base = (title ?? '').toString();
    const normalized = base.normalize('NFKC').trim();
    const prepared = normalized ? normalized : 'musica_personalizada';
    const sanitized = sanitizeForFilesystem(prepared);
    return ensureMp3Suffix(sanitized);
};
const encodeRFC5987ValueChars = (str) => {
    return encodeURIComponent(str)
        .replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
        .replace(/%(7C|60|5E)/g, (match) => match.toUpperCase());
};
/**
 * Endpoint de proxy para download de arquivos de áudio
 * Resolve problemas de cross-origin ao fazer proxy de arquivos externos
 */
router.get('/', async (req, res) => {
    const externalUrl = req.query.url;
    const finalName = buildMp3FilenameServer(typeof req.query.filename === 'string' ? req.query.filename : undefined);
    const asciiFallback = finalName.replace(/[^\x20-\x7E]/g, '-');
    const encodedUtf8 = encodeRFC5987ValueChars(finalName);
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
        // Define os cabeçalhos que forçam o download (compat e RFC 5987)
        // application/octet-stream + nosniff evita heurísticas do navegador que podem ocultar a extensão
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedUtf8}`);
        // Se o servidor externo forneceu o tamanho do arquivo, repassa
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }
        console.log(`[DOWNLOAD PROXY] Transmitindo arquivo: ${finalName}`);
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