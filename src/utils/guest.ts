import { v4 as uuidv4 } from 'uuid';

const GUEST_ID_KEY = 'memora_guest_id';

/**
 * Obtém ou cria um ID único para usuários convidados (não logados).
 * O ID é persistido no localStorage para manter a identidade entre sessões.
 * 
 * @returns {string} O guestId único do usuário
 */
export function getOrCreateGuestId(): string {
  try {
    // Tenta ler o guestId do localStorage
    const existingGuestId = localStorage.getItem(GUEST_ID_KEY);
    
    if (existingGuestId) {
      return existingGuestId;
    }
    
    // Se não existir, gera um novo UUID
    const newGuestId = uuidv4();
    
    // Salva no localStorage
    localStorage.setItem(GUEST_ID_KEY, newGuestId);
    
    return newGuestId;
  } catch (error) {
    // Fallback caso localStorage não esteja disponível (SSR, etc.)
    console.warn('Erro ao acessar localStorage para guestId:', error);
    return uuidv4(); // Retorna um ID temporário
  }
}

/**
 * Remove o guestId do localStorage.
 * Deve ser chamado após a migração bem-sucedida dos dados do convidado.
 */
export function clearGuestId(): void {
  try {
    localStorage.removeItem(GUEST_ID_KEY);
  } catch (error) {
    console.warn('Erro ao limpar guestId do localStorage:', error);
  }
}

/**
 * Verifica se existe um guestId armazenado.
 * 
 * @returns {boolean} True se existe um guestId, false caso contrário
 */
export function hasGuestId(): boolean {
  try {
    return localStorage.getItem(GUEST_ID_KEY) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Obtém o guestId atual sem criar um novo se não existir.
 * 
 * @returns {string | null} O guestId atual ou null se não existir
 */
export function getCurrentGuestId(): string | null {
  try {
    return localStorage.getItem(GUEST_ID_KEY);
  } catch (error) {
    return null;
  }
}