/**
 * Utilitário para download de arquivos que aciona a caixa de diálogo "Salvar como..." do navegador
 */

import { buildMp3Filename } from './filename';

/**
 * Garante que o nome do arquivo termine com a extensão .mp3
 * @param filename - Nome base do arquivo informado
 * @returns Nome do arquivo com a extensão .mp3
 */
// Removido: use buildMp3Filename(title) para formar nomes.

/**
 * Aciona o download de um arquivo usando a API nativa do navegador
 * @param url - URL do arquivo a ser baixado
 * @param filename - Nome sugerido para o arquivo
 */
export const triggerDownload = async (url: string, filename: string) => {
  // Compat: delega para o novo fluxo baseado em fetch+Blob
  const title = filename || 'musica_personalizada';
  await forceDownload(url, title);
};

export const triggerDownloadBlob = (blob: Blob, filename: string) => {
  const safeFilename = buildMp3Filename(filename);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  
  // Força o atributo download para garantir que o nome seja aplicado
  link.setAttribute('download', safeFilename);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpa a URL após um tempo para liberar memória
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Novo fluxo: baixa via fetch, converte para Blob com tipo audio/mpeg e aciona anchor
 */
export const forceDownload = async (url: string, title: string) => {
  const filename = buildMp3Filename(title);
  
  // Garantir mesma origem no ambiente local
  // Em produção, este utilitário assume que a URL é confiável
  const response = await fetch(url, {
    // Evita CORS com credenciais: não precisamos de cookies para baixar
    credentials: 'omit',
    mode: 'cors',
    cache: 'no-store',
    redirect: 'follow',
    // Evita envio de referrer para provedores externos
    referrerPolicy: 'no-referrer',
  });

  if (!response.ok) {
    // Fallback: tentar abrir diretamente com anchor caso fetch falhe
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const contentType = response.headers.get('Content-Type') || 'audio/mpeg';
  const rawBlob = await response.blob();
  const blob = contentType.startsWith('audio/') ? rawBlob : new Blob([rawBlob], { type: 'audio/mpeg' });

  triggerDownloadBlob(blob, filename);
};
