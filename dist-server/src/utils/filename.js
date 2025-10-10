/**
 * Funções utilitárias para manipulação de nomes de arquivo
 */
// Remove caracteres de controle usando uma abordagem segura
const stripControlChars = (str) => {
    // Filtra caracteres de controle usando uma função de teste
    return str.split('').filter(char => {
        const code = char.charCodeAt(0);
        // Mantém apenas caracteres imprimíveis e espaços
        return (code >= 0x20 && code <= 0x7E) || code === 0x20;
    }).join('');
};
// Substitui caracteres proibidos em nomes de arquivo
const replaceForbiddenChars = (str) => {
    return str
        // Caracteres proibidos no Windows e sistemas Unix-like
        .replace(/[<>:"\\|?*]/g, '_')
        // Espaços em branco consecutivos
        .replace(/\s+/g, '_')
        // Caracteres especiais adicionais que podem causar problemas
        .replace(/[&+$~%'`@={}[\]]/g, '_');
};
// Remove espaços em branco duplicados
const collapseWhitespace = (str) => {
    return str.trim().replace(/\s+/g, ' ');
};
// Remove pontos no final do nome
const removeTrailingDots = (str) => {
    return str.replace(/\.+$/, '');
};
/**
 * Constrói um nome de arquivo MP3 a partir de um título e versão
 * @param title Título da música
 * @param version Versão da música (opcional)
 * @returns Nome de arquivo sanitizado
 */
export const buildMp3Filename = (title, version) => {
    let filename = title.toLowerCase();
    // Remover caracteres de controle
    filename = stripControlChars(filename);
    // Substituir caracteres proibidos
    filename = replaceForbiddenChars(filename);
    // Adicionar versão se fornecida
    if (version) {
        filename += `_${version.toLowerCase()}`;
    }
    // Adicionar extensão
    filename += '.mp3';
    // Garantir tamanho máximo seguro (255 bytes é o limite em muitos sistemas)
    const maxLength = 255;
    if (Buffer.from(filename).length > maxLength) {
        const ext = '.mp3';
        const bytesAvailable = maxLength - Buffer.from(ext).length;
        let truncated = '';
        let currentLength = 0;
        for (const char of filename.slice(0, -4)) {
            const charBytes = Buffer.from(char).length;
            if (currentLength + charBytes <= bytesAvailable) {
                truncated += char;
                currentLength += charBytes;
            }
            else {
                break;
            }
        }
        filename = truncated + ext;
    }
    return filename;
};
/**
 * Sanitiza um nome de arquivo para uso seguro no sistema de arquivos
 * @param filename Nome de arquivo original
 * @returns Nome de arquivo sanitizado
 */
export const sanitizeFilename = (filename) => {
    let sanitized = filename;
    // Remover caracteres de controle
    sanitized = stripControlChars(sanitized);
    // Colapsar espaços em branco
    sanitized = collapseWhitespace(sanitized);
    // Substituir caracteres proibidos
    sanitized = replaceForbiddenChars(sanitized);
    // Remover pontos no final
    sanitized = removeTrailingDots(sanitized);
    // Garantir que não está vazio
    if (!sanitized) {
        sanitized = 'unnamed_file';
    }
    // Garantir tamanho máximo seguro (255 bytes é o limite em muitos sistemas)
    const maxLength = 255;
    if (Buffer.from(sanitized).length > maxLength) {
        const bytesAvailable = maxLength;
        let truncated = '';
        let currentLength = 0;
        for (const char of sanitized) {
            const charBytes = Buffer.from(char).length;
            if (currentLength + charBytes <= bytesAvailable) {
                truncated += char;
                currentLength += charBytes;
            }
            else {
                break;
            }
        }
        sanitized = truncated;
    }
    return sanitized;
};
//# sourceMappingURL=filename.js.map