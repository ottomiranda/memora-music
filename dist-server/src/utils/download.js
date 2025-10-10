import { buildMp3Filename } from './filename';
const toAudioBlob = async (blob) => {
    if (blob.type && blob.type !== 'application/octet-stream') {
        return blob;
    }
    const buffer = await blob.arrayBuffer();
    return new Blob([buffer], { type: 'audio/mpeg' });
};
const triggerDownloadFromBlob = (blob, filename) => {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 1000);
};
const createDownloadError = (error) => {
    if (error instanceof Error) {
        return {
            code: 'DOWNLOAD_ERROR',
            message: error.message,
            details: { originalError: error }
        };
    }
    return {
        code: 'UNKNOWN_ERROR',
        message: 'Erro desconhecido ao baixar arquivo',
        details: { originalError: error }
    };
};
export const downloadBlob = async (blob, title, options) => {
    try {
        const filename = buildMp3Filename(title || 'download');
        const audioBlob = await toAudioBlob(blob);
        triggerDownloadFromBlob(audioBlob, filename);
        return {
            success: true,
            filename,
            size: audioBlob.size,
            mimeType: audioBlob.type
        };
    }
    catch (error) {
        return {
            success: false,
            filename: '',
            error: createDownloadError(error)
        };
    }
};
export const forceDownload = async (url, title, options) => {
    const state = {
        isDownloading: true,
        progress: null,
        error: null
    };
    try {
        const response = await fetch(url, {
            ...options?.init,
            headers: {
                ...options?.init?.headers,
                'Cache-Control': options?.preventCaching ? 'no-cache' : ''
            }
        });
        if (!response.ok) {
            throw new Error(`Falha ao baixar arquivo: ${response.status}`);
        }
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Não foi possível iniciar o download');
        }
        let loaded = 0;
        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            chunks.push(value);
            loaded += value.length;
            if (total && options?.onProgress) {
                const progress = {
                    loaded,
                    total,
                    percent: Math.round((loaded / total) * 100)
                };
                options.onProgress(progress.percent);
                state.progress = progress;
            }
        }
        const blob = new Blob(chunks);
        return downloadBlob(blob, title, options);
    }
    catch (error) {
        const downloadError = createDownloadError(error);
        state.error = downloadError;
        state.isDownloading = false;
        if (options?.onError) {
            options.onError(new Error(downloadError.message));
        }
        return {
            success: false,
            filename: '',
            error: downloadError
        };
    }
    finally {
        state.isDownloading = false;
        if (options?.onComplete) {
            options.onComplete();
        }
    }
};
//# sourceMappingURL=download.js.map