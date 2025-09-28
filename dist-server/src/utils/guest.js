import { v4 as uuidv4 } from 'uuid';
import { GUEST_ID_KEY } from '../types/guest.js';
/**
 * Gera ou recupera o guestId do localStorage
 * @returns string - UUID único para o usuário convidado
 */
export function getOrCreateGuestId() {
    try {
        const existingId = localStorage.getItem(GUEST_ID_KEY);
        const existingDeviceId = localStorage.getItem('deviceId');
        if (existingId) {
            if (existingDeviceId && existingDeviceId !== existingId) {
                console.debug('[Guest Identity] Alinhando guestId com deviceId existente');
                localStorage.setItem(GUEST_ID_KEY, existingDeviceId);
                return existingDeviceId;
            }
            return existingId;
        }
        if (existingDeviceId) {
            localStorage.setItem(GUEST_ID_KEY, existingDeviceId);
            console.debug('[Guest Identity] Reutilizando deviceId como guestId:', existingDeviceId);
            return existingDeviceId;
        }
        const newGuestId = uuidv4();
        localStorage.setItem(GUEST_ID_KEY, newGuestId);
        localStorage.setItem('deviceId', newGuestId);
        // Log para desenvolvimento
        console.debug('[Guest Identity] Novo guestId gerado:', newGuestId);
        return newGuestId;
    }
    catch (error) {
        // Fallback para quando localStorage não está disponível
        console.warn('[Guest Identity] localStorage não disponível, usando ID de sessão');
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
/**
 * Remove o guestId do localStorage
 * Usado após migração bem-sucedida
 */
export function clearGuestId() {
    try {
        const existingId = localStorage.getItem(GUEST_ID_KEY);
        if (existingId) {
            localStorage.removeItem(GUEST_ID_KEY);
            console.debug('[Guest Identity] GuestId removido:', existingId);
        }
    }
    catch (error) {
        console.warn('[Guest Identity] Erro ao limpar guestId:', error);
    }
}
/**
 * Verifica se existe um guestId no localStorage
 * @returns boolean - true se existe guestId
 */
export function hasGuestId() {
    try {
        return localStorage.getItem(GUEST_ID_KEY) !== null;
    }
    catch (error) {
        return false;
    }
}
/**
 * Recupera o guestId atual sem criar um novo
 * @returns string | null - guestId existente ou null
 */
export function getCurrentGuestId() {
    try {
        return localStorage.getItem(GUEST_ID_KEY);
    }
    catch (error) {
        return null;
    }
}
/**
 * Cria um objeto GuestIdentity com informações completas
 * @returns GuestIdentity | null
 */
export function getGuestIdentity() {
    const guestId = getCurrentGuestId();
    if (!guestId) {
        return null;
    }
    return {
        guestId,
        createdAt: new Date() // Aproximação, pois não armazenamos a data de criação
    };
}
/**
 * Valida se um guestId tem formato válido (UUID v4)
 * @param guestId - ID a ser validado
 * @returns boolean - true se é um UUID válido
 */
export function isValidGuestId(guestId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(guestId) || guestId.startsWith('session-');
}
/**
 * Força a regeneração do guestId
 * Útil para testes ou casos especiais
 */
export function regenerateGuestId() {
    clearGuestId();
    return getOrCreateGuestId();
}
//# sourceMappingURL=guest.js.map