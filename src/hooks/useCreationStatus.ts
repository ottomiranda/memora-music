import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { API_ENDPOINTS, apiRequest } from '../config/api';

interface CreationStatusResponse {
  success: boolean;
  isFree: boolean;
  freeSongsUsed: number;
  message: string;
  userType: string;
}

interface UseCreationStatusReturn {
  isFree: boolean;
  freeSongsUsed: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCreationStatus = (): UseCreationStatusReturn => {
  const [isFree, setIsFree] = useState<boolean>(true); // Default to true for first load
  const [freeSongsUsed, setFreeSongsUsed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { token, deviceId } = useAuthStore();

  const fetchCreationStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiRequest<CreationStatusResponse>(
        `${API_ENDPOINTS.PAYWALL}/creation-status`
      );
      
      setIsFree(response.isFree);
      setFreeSongsUsed(response.freeSongsUsed || 0);
    } catch (err) {
      console.error('Erro ao buscar status de criação:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Em caso de erro, assumir que não é grátis para ser conservador
      setIsFree(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreationStatus();
  }, []);

  return {
    isFree,
    freeSongsUsed,
    isLoading,
    error,
    refetch: fetchCreationStatus,
  };
};