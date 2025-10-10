/**
 * Utilitário para construir nomes de arquivo seguros e consistentes para downloads de MP3.
 */

/**
 * Remove diacríticos de uma string mantendo caracteres ASCII base
 */
const stripDiacritics = (input: string): string => {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Substitui caracteres proibidos por hífen e limpa pontos soltos
 */
const sanitizeForFilesystem = (input: string): string => {
  // Normaliza, trim e remove pontos finais soltos
  let s = input.normalize('NFKC').trim().replace(/\.+$/, '');

  // Substitui caracteres proibidos por hífen
  // < > : " / \ | ? * e controles ASCII (0x00-0x1F)
  s = s.replace(/[<>:\"/\\|?*\x00-\x1F]/g, '-');

  // Compacta espaços e hífens duplicados
  s = s.replace(/[\s]+/g, ' ').replace(/-{2,}/g, '-');

  // Remove hífens e espaços nas extremidades
  s = s.trim().replace(/^[\s-]+|[\s-]+$/g, '');

  return s || 'musica_personalizada';
};

/**
 * Garante que o nome termine exatamente com .mp3 (em minúsculas, sem duplicar)
 */
const ensureMp3Suffix = (name: string): string => {
  if (/\.mp3$/i.test(name)) {
    return name.replace(/\.mp3$/i, '.mp3');
  }
  return `${name}.mp3`;
};

/**
 * Constrói um nome de arquivo seguro com sufixo .mp3
 * - Normaliza NFKC
 * - Trim
 * - Opcionalmente remove diacríticos (mantém UTF-8 por padrão)
 * - Substitui caracteres proibidos por hífen
 * - Remove pontos finais soltos
 * - Garante sufixo .mp3 exatamente uma vez
 */
export const buildMp3Filename = (
  title: string,
  opts: { stripDiacritics?: boolean } = {}
): string => {
  const base = (title ?? '').toString();
  const normalized = base.normalize('NFKC').trim();
  const prepared = normalized
    ? (opts.stripDiacritics ? stripDiacritics(normalized) : normalized)
    : 'musica_personalizada';

  const sanitized = sanitizeForFilesystem(prepared);
  return ensureMp3Suffix(sanitized);
};

/**
 * Codifica valor para uso em header RFC 5987 (filename*)
 */
export const encodeRFC5987ValueChars = (str: string): string => {
  return encodeURIComponent(str)
    .replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%(7C|60|5E)/g, (match) => match.toUpperCase());
};

