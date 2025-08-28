/**
 * Utilitário para download de arquivos que aciona a caixa de diálogo "Salvar como..." do navegador
 */

/**
 * Aciona o download de um arquivo usando a API nativa do navegador
 * @param url - URL do arquivo a ser baixado
 * @param filename - Nome sugerido para o arquivo
 */
export const triggerDownload = (url: string, filename: string): void => {
  // Cria um elemento <a> temporário
  const link = document.createElement('a');
  link.href = url;
  
  // A propriedade 'download' força o download e sugere um nome de arquivo
  link.setAttribute('download', filename);
  
  // Adiciona o link ao corpo do documento (necessário para Firefox)
  document.body.appendChild(link);
  
  // Simula um clique no link
  link.click();
  
  // Limpa e remove o link do DOM
  document.body.removeChild(link);
};

/**
 * Versão alternativa que funciona com URLs de blob ou data URLs
 * @param url - URL do arquivo (pode ser blob: ou data:)
 * @param filename - Nome sugerido para o arquivo
 */
export const triggerDownloadBlob = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Para URLs de blob, não é necessário adicionar ao DOM em navegadores modernos
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};