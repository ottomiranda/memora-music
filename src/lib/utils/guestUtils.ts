/**
 * Utilitários para gerenciamento de Guest ID no frontend
 */

// Chave para armazenar o guestId no localStorage
const GUEST_ID_KEY = 'memora_music_guest_id';
const GUEST_ID_EXPIRY_KEY = 'memora_music_guest_id_expiry';

// Duração padrão do guestId (30 dias em milissegundos)
const DEFAULT_EXPIRY_DAYS = 30;
const EXPIRY_MS = DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * Gera um novo Guest ID único
 */
export function generateGuestId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `guest_${timestamp}_${randomPart}`;
}

/**
 * Obtém o Guest ID atual ou cria um novo se não existir
 */
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - retorna um ID temporário
    return generateGuestId();
  }

  try {
    const existingId = localStorage.getItem(GUEST_ID_KEY);
    const expiryTime = localStorage.getItem(GUEST_ID_EXPIRY_KEY);

    // Verificar se o ID existe e não expirou
    if (existingId && expiryTime) {
      const expiry = parseInt(expiryTime, 10);
      if (Date.now() < expiry) {
        return existingId;
      }
    }

    // Criar novo ID se não existir ou expirou
    const newGuestId = generateGuestId();
    const newExpiry = Date.now() + EXPIRY_MS;

    localStorage.setItem(GUEST_ID_KEY, newGuestId);
    localStorage.setItem(GUEST_ID_EXPIRY_KEY, newExpiry.toString());

    console.log(`🆔 Novo Guest ID criado: ${newGuestId}`);
    return newGuestId;
  } catch (error) {
    console.error('❌ Erro ao gerenciar Guest ID:', error);
    // Fallback para ID temporário se localStorage não estiver disponível
    return generateGuestId();
  }
}

/**
 * Obtém o Guest ID atual sem criar um novo
 */
export function getCurrentGuestId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const existingId = localStorage.getItem(GUEST_ID_KEY);
    const expiryTime = localStorage.getItem(GUEST_ID_EXPIRY_KEY);

    if (existingId && expiryTime) {
      const expiry = parseInt(expiryTime, 10);
      if (Date.now() < expiry) {
        return existingId;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao obter Guest ID:', error);
    return null;
  }
}

/**
 * Remove o Guest ID do localStorage (usado após login/migração)
 */
export function clearGuestId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(GUEST_ID_KEY);
    localStorage.removeItem(GUEST_ID_EXPIRY_KEY);
    console.log('🗑️ Guest ID removido do localStorage');
  } catch (error) {
    console.error('❌ Erro ao remover Guest ID:', error);
  }
}

/**
 * Verifica se o Guest ID atual é válido (existe e não expirou)
 */
export function isGuestIdValid(): boolean {
  return getCurrentGuestId() !== null;
}

/**
 * Renova a expiração do Guest ID atual
 */
export function renewGuestId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const existingId = getCurrentGuestId();
    if (existingId) {
      const newExpiry = Date.now() + EXPIRY_MS;
      localStorage.setItem(GUEST_ID_EXPIRY_KEY, newExpiry.toString());
      console.log(`🔄 Guest ID renovado: ${existingId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erro ao renovar Guest ID:', error);
    return false;
  }
}

/**
 * Obtém informações sobre o Guest ID atual
 */
export function getGuestIdInfo(): {
  id: string | null;
  isValid: boolean;
  expiresAt: Date | null;
  daysUntilExpiry: number | null;
} {
  const id = getCurrentGuestId();
  const isValid = id !== null;
  
  let expiresAt: Date | null = null;
  let daysUntilExpiry: number | null = null;

  if (typeof window !== 'undefined' && isValid) {
    try {
      const expiryTime = localStorage.getItem(GUEST_ID_EXPIRY_KEY);
      if (expiryTime) {
        const expiry = parseInt(expiryTime, 10);
        expiresAt = new Date(expiry);
        daysUntilExpiry = Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000));
      }
    } catch (error) {
      console.error('❌ Erro ao obter informações do Guest ID:', error);
    }
  }

  return {
    id,
    isValid,
    expiresAt,
    daysUntilExpiry
  };
}

/**
 * Valida se uma string é um Guest ID válido
 */
export function isValidGuestIdFormat(id: string): boolean {
  // Formato esperado: guest_[timestamp]_[random]
  const guestIdRegex = /^guest_[a-z0-9]+_[a-z0-9]+$/;
  return guestIdRegex.test(id);
}

/**
 * Hook personalizado para usar com React (se necessário)
 */
export function createGuestIdHook() {
  return {
    getOrCreateGuestId,
    getCurrentGuestId,
    clearGuestId,
    isGuestIdValid,
    renewGuestId,
    getGuestIdInfo
  };
}

// Exportar constantes úteis
export const GUEST_ID_CONFIG = {
  STORAGE_KEY: GUEST_ID_KEY,
  EXPIRY_KEY: GUEST_ID_EXPIRY_KEY,
  EXPIRY_DAYS: DEFAULT_EXPIRY_DAYS,
  EXPIRY_MS
} as const;

// Função para debug (apenas em desenvolvimento)
export function debugGuestId(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const info = getGuestIdInfo();
  console.log('🔍 Guest ID Debug Info:', {
    ...info,
    localStorage: typeof window !== 'undefined' ? {
      guestId: localStorage.getItem(GUEST_ID_KEY),
      expiry: localStorage.getItem(GUEST_ID_EXPIRY_KEY)
    } : 'N/A (SSR)'
  });
}