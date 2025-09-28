/**
 * Utilitário para download de arquivos que aciona a caixa de diálogo "Salvar como..." do navegador
 */

/**
 * Garante que o nome do arquivo termine com a extensão .mp3
 * @param filename - Nome base do arquivo informado
 * @returns Nome do arquivo com a extensão .mp3
 */
export const ensureMp3Extension = (filename?: string | null): string => {
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
 * Aciona o download de um arquivo usando a API nativa do navegador
 * @param url - URL do arquivo a ser baixado
 * @param filename - Nome sugerido para o arquivo
 */
export const triggerDownload = (url: string, filename: string) => {
  const safeFilename = ensureMp3Extension(filename);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  
  // Força o atributo download para garantir que o nome seja aplicado
  link.setAttribute('download', safeFilename);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const triggerDownloadBlob = (blob: Blob, filename: string) => {
  const safeFilename = ensureMp3Extension(filename);
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
