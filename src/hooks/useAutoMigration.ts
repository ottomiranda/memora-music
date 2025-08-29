import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCurrentGuestId, clearGuestId, getGuestIdInfo } from '@/lib/utils/guestUtils';

interface MigrationState {
  isChecking: boolean;
  isMigrating: boolean;
  migrationCompleted: boolean;
  migratedCount: number;
  error: string | null;
}

interface MigrationResponse {
  success: boolean;
  message: string;
  data: {
    migratedCount: number;
    guestId: string;
    userId: string;
    songs: Array<{
      id: string;
      title: string;
      createdAt: string;
    }>;
  };
}

/**
 * Hook para gerenciar a migração automática de dados de convidados
 * quando o usuário faz login ou se cadastra
 */
export function useAutoMigration() {
  const { user, isAuthenticated } = useAuthStore();
  const [migrationState, setMigrationState] = useState<MigrationState>({
    isChecking: false,
    isMigrating: false,
    migrationCompleted: false,
    migratedCount: 0,
    error: null
  });

  /**
   * Executa a migração de dados do convidado para o usuário autenticado
   */
  const executeMigration = useCallback(async (guestId: string, userId: string): Promise<boolean> => {
    try {
      setMigrationState(prev => ({ ...prev, isMigrating: true, error: null }));
      
      console.log(`🔄 Iniciando migração automática: ${guestId} → ${userId}`);
      
      const response = await fetch('/api/migrate-guest-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na migração: ${response.status} ${response.statusText}`);
      }

      const result: MigrationResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro desconhecido na migração');
      }

      console.log(`✅ Migração concluída: ${result.data.migratedCount} músicas migradas`);
      
      setMigrationState(prev => ({
        ...prev,
        isMigrating: false,
        migrationCompleted: true,
        migratedCount: result.data.migratedCount
      }));

      // Limpar o Guest ID após migração bem-sucedida
      clearGuestId();
      
      return true;
    } catch (error) {
      console.error('❌ Erro na migração automática:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setMigrationState(prev => ({
        ...prev,
        isMigrating: false,
        error: errorMessage
      }));
      
      return false;
    }
  }, []);

  /**
   * Verifica se há dados para migrar
   */
  const checkForMigration = useCallback(async (guestId: string): Promise<boolean> => {
    try {
      setMigrationState(prev => ({ ...prev, isChecking: true, error: null }));
      
      const response = await fetch(`/api/songs?guestId=${encodeURIComponent(guestId)}&limit=1`);
      
      if (!response.ok) {
        console.log('ℹ️ Não foi possível verificar músicas do convidado');
        return false;
      }
      
      const result = await response.json();
      const hasGuestSongs = result.success && result.data.songs.length > 0;
      
      console.log(`🔍 Verificação de migração: ${hasGuestSongs ? 'Dados encontrados' : 'Nenhum dado'}`);
      
      return hasGuestSongs;
    } catch (error) {
      console.error('❌ Erro ao verificar dados para migração:', error);
      return false;
    } finally {
      setMigrationState(prev => ({ ...prev, isChecking: false }));
    }
  }, []);

  /**
   * Executa a verificação e migração automática
   */
  const performAutoMigration = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const guestId = getCurrentGuestId();
    if (!guestId) {
      console.log('ℹ️ Nenhum Guest ID encontrado para migração');
      return;
    }

    console.log(`🔍 Verificando migração para usuário ${user.id}`);
    
    // Verificar se há dados para migrar
    const hasDataToMigrate = await checkForMigration(guestId);
    
    if (hasDataToMigrate) {
      console.log('📦 Dados encontrados, iniciando migração...');
      await executeMigration(guestId, user.id);
    } else {
      console.log('ℹ️ Nenhum dado para migrar, limpando Guest ID');
      clearGuestId();
    }
  }, [isAuthenticated, user?.id, checkForMigration, executeMigration]);

  /**
   * Redefine o estado da migração
   */
  const resetMigrationState = useCallback(() => {
    setMigrationState({
      isChecking: false,
      isMigrating: false,
      migrationCompleted: false,
      migratedCount: 0,
      error: null
    });
  }, []);

  /**
   * Força uma nova tentativa de migração
   */
  const retryMigration = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      return false;
    }

    const guestId = getCurrentGuestId();
    if (!guestId) {
      return false;
    }

    resetMigrationState();
    return await executeMigration(guestId, user.id);
  }, [isAuthenticated, user?.id, executeMigration, resetMigrationState]);

  // Efeito para executar migração automática quando o usuário faz login
  useEffect(() => {
    if (isAuthenticated && user?.id && !migrationState.migrationCompleted) {
      // Pequeno delay para garantir que o estado do usuário está estabilizado
      const timer = setTimeout(() => {
        performAutoMigration();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.id, migrationState.migrationCompleted, performAutoMigration]);

  // Informações sobre o Guest ID atual
  const guestIdInfo = getGuestIdInfo();

  return {
    // Estado da migração
    ...migrationState,
    
    // Informações do Guest ID
    guestIdInfo,
    
    // Ações
    performAutoMigration,
    retryMigration,
    resetMigrationState,
    
    // Estados derivados
    isProcessing: migrationState.isChecking || migrationState.isMigrating,
    hasError: !!migrationState.error,
    canRetry: !!migrationState.error && !migrationState.isMigrating,
    
    // Informações úteis
    shouldShowMigrationNotice: migrationState.migrationCompleted && migrationState.migratedCount > 0
  };
}

/**
 * Hook simplificado para apenas obter o status da migração
 */
export function useMigrationStatus() {
  const { migrationCompleted, migratedCount, error } = useAutoMigration();
  
  return {
    migrationCompleted,
    migratedCount,
    hasError: !!error,
    error
  };
}

/**
 * Tipo para o retorno do hook useAutoMigration
 */
export type AutoMigrationHook = ReturnType<typeof useAutoMigration>;