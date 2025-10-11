import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import i18n from '../i18n';
import { API_ENDPOINTS, apiRequest } from '../config/api';
import { useAuthStore } from './authStore';
import { useUiStore } from './uiStore';
import { useTranslation } from '../i18n/hooks/useTranslation';
import { buildLocalizedPath, type RouteKey } from '@/routes/paths';
import type { SupportedLanguages } from '@/i18n';

// Tipos para o formulário
export interface FormData {
  recipientName: string;
  occasion: string;
  relationship: string;
  senderName: string;
  hobbies: string;
  qualities: string;
  uniqueTraits: string;
  memories: string;
  emotionalTone: string;
  genre: string;
  mood: string;
  tempo: string;
  duration: string;
  lyrics: string;
  songTitle: string;
  emotion: string;
  vocalPreference: string;
}

// Tipos para a resposta da API
export interface GeneratePreviewResponse {
  success: boolean;
  data?: {
    audioUrl: string;
    lyrics: string;
  };
  error?: string;
}

// Tipos para clipes de áudio
export interface AudioClip {
  id: string;
  audio_url?: string;
  status: 'processing' | 'complete' | 'failed';
  title?: string;
  duration?: number;
}

// Estado inicial do formulário
const initialFormData: FormData = {
  recipientName: '',
  occasion: '',
  relationship: '',
  senderName: '',
  hobbies: '',
  qualities: '',
  uniqueTraits: '',
  memories: '',
  emotionalTone: '',
  genre: '',
  mood: '',
  tempo: '',
  duration: '',
  lyrics: '',
  songTitle: '',
  emotion: '',
  vocalPreference: ''
};

// Estado inicial completo do store
const initialState = {
  formData: initialFormData,
  currentStep: 0,
  isPreviewLoading: false,
  isLoading: false,
  error: null,
  generatedAudioUrl: null,
  generatedLyrics: null,
  audioClips: [],
  currentTaskId: null,
  isPolling: false,
  musicGenerationStatus: 'idle' as const,
  completedClips: 0,
  totalExpected: 2,
  pollingInterval: null,
  isMvpFlowComplete: false,
  isValidationPopupVisible: false,
};

// Interface do store
interface MusicStore {
  // Estados do formulário
  formData: FormData;
  currentStep: number;
  
  // Estados de controle da UI
  isPreviewLoading: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Estados da prévia gerada
  generatedAudioUrl: string | null;
  generatedLyrics: string | null;
  audioClips: AudioClip[];
  
  // Novos estados para polling progressivo
  currentTaskId: string | null;
  isPolling: boolean;
  musicGenerationStatus: 'idle' | 'processing' | 'completed' | 'failed' | 'error';
  completedClips: number;
  totalExpected: number;
  pollingInterval: NodeJS.Timeout | null;
  
  // Estados para fluxo de validação MVP
  isMvpFlowComplete: boolean;
  isValidationPopupVisible: boolean;
  
  // Ações para atualizar o formulário
  updateFormData: (data: Partial<FormData>) => void;
  setCurrentStep: (step: number) => void;
  
  // Ações para controlar a UI
  setPreviewLoading: (loading: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Ações para navegar entre passos
  nextStep: () => void;
  prevStep: () => void;
  
  // Funções específicas
  generateLyrics: () => Promise<void>;
  generatePreview: () => Promise<void>;
  regenerateLyrics: (onComplete?: () => void) => void;
  generateMusic: () => Promise<void>;
  
  // Novas funções para polling progressivo
  checkMusicStatus: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  
  // Funções para fluxo de validação MVP
  setMvpFlowComplete: (complete: boolean) => void;
  setValidationPopupVisible: (visible: boolean) => void;
  completeMvpFlow: () => void;
  
  // Funções de reset
  resetForm: () => void;
  reset: () => void;
  
  // Nova função centralizada para iniciar fluxo de criação
  startNewCreationFlow: (navigate: (path: string) => void, token: string | null) => Promise<void>;
}

// Variável global para o intervalo de polling
let pollingInterval: NodeJS.Timeout | null = null;

// Helper function para obter o idioma atual
const getCurrentLanguage = () => {
  // Mapear idiomas do i18n para o formato esperado pelo PromptAdapter
  const currentLang = i18n.language;
  return currentLang === 'en' ? 'en-US' : 'pt-BR';
};

const getRoutingLanguage = (): SupportedLanguages => {
  const lang = i18n.language;
  return lang === 'en' ? 'en' : 'pt';
};

const getLocalizedRoutePath = (key: RouteKey, params?: Record<string, string>) => {
  return buildLocalizedPath(key, getRoutingLanguage(), params);
};

// Criação do store
export const useMusicStore = create<MusicStore>()(
  persist(
    (set, get) => ({
  // Estados iniciais usando o objeto initialState
  ...initialState,
  
  // Implementações das ações
  updateFormData: (data) => {
    set((state) => ({
      formData: { ...state.formData, ...data }
    }));
  },
  
  setCurrentStep: (step) => {
    set({ currentStep: step });
  },
  
  setPreviewLoading: (loading) => {
    set({ isPreviewLoading: loading });
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  nextStep: () => {
    set((state) => ({ currentStep: state.currentStep + 1 }));
  },
  
  prevStep: () => {
    set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) }));
  },
  
  // Função para gerar apenas a letra
  generateLyrics: async () => {
    const { formData } = get();
    
    console.log('=== DEBUG GENERATE LYRICS ===');
    console.log('FormData completo:', JSON.stringify(formData, null, 2));
    
    // Validação usando apenas os campos obrigatórios do briefingSchema (primeira etapa)
    if (!formData.recipientName || !formData.occasion || !formData.relationship) {
      const errorMsg = i18n.t('validation.fillRequiredFieldsStep1', { ns: 'musicStore' });
      console.log(i18n.t('debug.validationFailedStep1', { ns: 'musicStore' }), {
          recipientName: formData.recipientName,
          occasion: formData.occasion,
          relationship: formData.relationship
        });
      set({ error: errorMsg });
      toast.error(errorMsg, { duration: 6000 });
      return;
    }
    
    // Preparar payload para envio com detecção automática de idioma
    const payload = {
      ...formData,
      lyricsOnly: true,
      language: getCurrentLanguage()
    };
    
    console.log('✅ Validação passou - Enviando payload para letra:', JSON.stringify(payload, null, 2));
    
    set({ isLoading: true, error: null });
    
    try {
      const result = await apiRequest(API_ENDPOINTS.GENERATE_PREVIEW, {
        method: 'POST',
        body: payload,
      });
      
      console.log('📥 Response JSON:', JSON.stringify(result, null, 2));
      
      if (result.success && result.lyrics && result.songTitle) {
        console.log('✅ Letra gerada:', result.lyrics);
        console.log('✅ Título gerado:', result.songTitle);
        
        set((state) => ({
          formData: { 
            ...state.formData, 
            lyrics: result.lyrics,
            songTitle: result.songTitle 
          },
          generatedLyrics: result.lyrics,
        }));
        toast.success(i18n.t('success.lyricsGenerated', { ns: 'musicStore' }));
      } else {
        const errorMsg = i18n.t('errors.invalidApiResponse', { ns: 'musicStore' });
        console.log(i18n.t('errors.invalidApiResponse', { ns: 'musicStore' }), {
          lyrics: result.lyrics ? 'presente' : 'ausente',
          songTitle: result.songTitle ? 'presente' : 'ausente',
          result
        });
        set({ error: errorMsg });
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error(i18n.t('errors.generateLyricsCatch', { ns: 'musicStore' }), error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      const errorMsg = error instanceof Error ? 
        error.message : 
        i18n.t('errors.connectionError', { ns: 'musicStore' });
      set({ error: errorMsg });
    } finally {
      // Garante que o loading seja sempre resetado
      set({ isLoading: false });
      console.log('=== FIM DEBUG GENERATE LYRICS ===');
    }
  },
  
  // Função para gerar prévia completa (letra + áudio)
  generatePreview: async () => {
    const { formData } = get();
    
    // Validação dos campos obrigatórios
    if (!formData.songTitle || !formData.recipientName || !formData.occasion || 
        !formData.relationship || !formData.emotionalTone || !formData.genre || 
        !formData.mood || !formData.tempo || !formData.duration) {
      const errorMsg = i18n.t('validation.fillRequiredFields', { ns: 'musicStore' });
      set({ error: errorMsg });
      toast.error(errorMsg, { duration: 6000 });
      return;
    }
    
    // Preparar payload para envio com detecção automática de idioma
    const payload = {
      ...formData,
      lyricsOnly: false,
      language: getCurrentLanguage()
    };
    
    set({ isPreviewLoading: true, error: null });
    
    try {
      const result: GeneratePreviewResponse = await apiRequest(API_ENDPOINTS.GENERATE_PREVIEW, {
        method: 'POST',
        body: payload,
      });
      
      if (result.success && result.data) {
        set({
          generatedAudioUrl: result.data.audioUrl,
          generatedLyrics: result.data.lyrics,
          formData: { ...formData, lyrics: result.data.lyrics },
          isPreviewLoading: false,
        });
      } else {
        const errorMsg = result.error || i18n.t('errors.unknownPreviewError', { ns: 'musicStore' });
        set({
          error: errorMsg,
          isPreviewLoading: false,
        });
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error(i18n.t('errors.generatePreview', { ns: 'musicStore' }), error);
      const errorMsg = i18n.t('errors.connectionError', { ns: 'musicStore' });
      set({
        error: errorMsg,
        isPreviewLoading: false,
      });
      toast.error(errorMsg);
    }
  },
  
  regenerateLyrics: (onComplete?: () => void) => {
    const generateLyricsWithCallback = async () => {
      await get().generateLyrics();
      if (onComplete) {
        onComplete();
      }
    };
    generateLyricsWithCallback();
  },
  
  // Função específica para gerar música com polling progressivo
  generateMusic: async () => {
    const { formData } = get();
    
    console.log('=== DEBUG GENERATE MUSIC (PROGRESSIVO) ===');
    console.log('FormData completo:', JSON.stringify(formData, null, 2));
    
    // Parar qualquer polling anterior
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    
    // Validação dos campos obrigatórios para geração de música
    if (!formData.lyrics || !formData.songTitle || !formData.genre || 
        !formData.emotion || !formData.vocalPreference) {
      const errorMsg = i18n.t('validation.fillStyleFields', { ns: 'musicStore' });
      console.log(i18n.t('debug.validationFailed', { ns: 'musicStore' }), {
        lyrics: formData.lyrics ? 'presente' : 'ausente',
        songTitle: formData.songTitle ? 'presente' : 'ausente',
        genre: formData.genre,
        emotion: formData.emotion,
        vocalPreference: formData.vocalPreference
      });
      set({ error: errorMsg });
      toast.error(errorMsg, { duration: 6000 });
      return;
    }
    
    // Preparar payload para envio com detecção automática de idioma
    const payload = {
      ...formData,
      lyricsOnly: false,
      language: getCurrentLanguage()
    };
    
    console.log('✅ Validação passou - Enviando payload para música:', JSON.stringify(payload, null, 2));
    
    // Resetar estados e iniciar loading
    set({ 
      isPreviewLoading: true, 
      isLoading: true,
      error: null,
      audioClips: [],
      generatedLyrics: formData.lyrics,
      musicGenerationStatus: 'processing',
      completedClips: 0,
      currentTaskId: null
    });
    
    try {
      const result = await apiRequest(API_ENDPOINTS.GENERATE_PREVIEW, {
        method: 'POST',
        body: payload,
      });
      
      console.log('📥 Response JSON:', JSON.stringify(result, null, 2));
      
      if (result.success && result.taskId) {
        // Novo sistema progressivo - recebemos um taskId
        console.log(`🎵 TaskId recebido: ${result.taskId}`);
        console.log(`🎵 Status: ${result.status}`);
        console.log(`🎵 Clipes esperados: ${result.totalExpected || result.expectedClips || 2}`);
        
        const expectedClips = result.totalExpected || result.expectedClips || 2;
        
        // INICIALIZAR ARRAY ESQUELETO PARA UI REATIVA
        const skeletonClips = Array(expectedClips).fill({ status: 'processing' });
        
        set({
          currentTaskId: result.taskId,
          totalExpected: expectedClips,
          audioClips: skeletonClips, // Array esqueleto para UI reagir
          musicGenerationStatus: 'processing'
        });
        
        // CHAMAR STARTPOLLING
        get().startPolling();
        
        toast.success(i18n.t('success.musicGenerationStarted', { ns: 'musicStore' }));
        
      } else if (result.success && result.audioClips) {
        // Fallback para sistema antigo (todas as músicas prontas de uma vez)
        console.log(i18n.t('debug.musicReceivedOldSystem', { ns: 'musicStore' }), result.audioClips.length);
        
        set({
          audioClips: result.audioClips,
          generatedAudioUrl: result.audioClips[0]?.audio_url,
          generatedLyrics: result.data?.lyrics || formData.lyrics,
          isPreviewLoading: false,
          isLoading: false,
          musicGenerationStatus: 'completed',
          completedClips: result.audioClips.length
        });
        
        toast.success(i18n.t('success.musicGenerated', { ns: 'musicStore', count: result.audioClips.length }));
        
      } else {
        const errorMsg = result.error || 'Resposta da API inválida';
        console.log(i18n.t('errors.invalidApiResponse', { ns: 'musicStore' }), result);
        set({ 
          error: errorMsg, 
          isPreviewLoading: false,
          isLoading: false,
          musicGenerationStatus: 'failed'
        });
        toast.error(errorMsg);
      }
      
    } catch (error) {
      console.error(i18n.t('errors.generateMusicCatch', { ns: 'musicStore' }), error);

      const status = error && typeof error === 'object' && 'status' in error
        ? (error as { status?: number }).status
        : undefined;
      const errorData = error && typeof error === 'object' && 'data' in error
        ? (error as { data?: any }).data
        : undefined;

      if (status === 402 && errorData?.error === 'PAYMENT_REQUIRED') {
        const paywallMessage = i18n.t('errors.paymentRequired', { ns: 'musicStore' });

        set({
          error: paywallMessage,
          isPreviewLoading: false,
          isLoading: false,
          musicGenerationStatus: 'failed',
        });

        toast.error(paywallMessage);
        return;
      }

      const fallbackMessage = i18n.t('errors.generateMusicCatch', { ns: 'musicStore' });
      const errorMsg = fallbackMessage;

      set({ 
        error: errorMsg, 
        isPreviewLoading: false,
        isLoading: false,
        musicGenerationStatus: 'failed'
      });

      toast.error(errorMsg);
    }
    
    console.log('=== FIM DEBUG GENERATE MUSIC (PROGRESSIVO) ===');
  },

  // A nova lógica de verificação (Lógica Central)
  checkMusicStatus: async () => {
    const { currentTaskId } = get();
    
    if (!currentTaskId) {
      console.warn('[DEBUG] Nenhum taskId ativo para verificar status');
      return;
    }

    try {
      console.log('[DEBUG] Verificando status para taskId:', currentTaskId);
      
      type CheckMusicStatusPayload = {
        taskId?: string;
        status?: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL' | string;
        audioClips?: AudioClip[];
        completedClips?: number;
        totalExpected?: number;
        lyrics?: string;
        error?: string;
        metadata?: Record<string, unknown>;
      };

      type CheckMusicStatusEnvelope = CheckMusicStatusPayload & {
        success?: boolean;
        data?: CheckMusicStatusPayload | null;
        error?: string;
      };

      const result = await apiRequest<CheckMusicStatusEnvelope>(`${API_ENDPOINTS.CHECK_MUSIC_STATUS}/${currentTaskId}`, {
        method: 'GET',
      });
      
      console.log('[DEBUG STATUS CHECK] Resposta recebida:', result);
      
      if (!result || typeof result !== 'object') {
        console.error('Resposta de status inválida ou não processável.', result);
        return;
      }

      const successFlag = 'success' in result ? result.success !== false : true;
      const payload: CheckMusicStatusPayload | undefined =
        result.data && typeof result.data === 'object'
          ? result.data
          : result;

      if (!payload || typeof payload !== 'object') {
        console.error('Payload de status ausente ou inválido.', result);
        return;
      }

      if (!successFlag) {
        const errorMessage = result.error || payload.error || i18n.t('errors.generationFailed', { ns: 'musicStore' });
        console.error('Resposta de status retornou sucesso = false.', result);
        get().stopPolling();
        set({
          isLoading: false,
          isPreviewLoading: false,
          isPolling: false,
          musicGenerationStatus: 'failed',
          currentTaskId: null,
          error: errorMessage,
        });
        toast.error(errorMessage);
        return;
      }
      
      const clips = Array.isArray(payload.audioClips) ? payload.audioClips : [];
      const completeCount = typeof payload.completedClips === 'number' ? payload.completedClips : 0;
      const totalExpected = typeof payload.totalExpected === 'number'
        ? payload.totalExpected
        : get().totalExpected || 0;
      const taskStatus = payload.status?.toUpperCase?.() ?? 'PROCESSING';
      const lyricsFromTask = typeof payload.lyrics === 'string' ? payload.lyrics : null;
      const errorMessage = payload.error || result.error;
      
      console.log(`[DEBUG] Clipes completos: ${completeCount}/${totalExpected}`);
      
      set((state) => ({
        audioClips: clips,
        completedClips: completeCount,
        totalExpected,
        ...(lyricsFromTask
          ? {
              generatedLyrics: lyricsFromTask,
              formData: state.formData.lyrics === lyricsFromTask
                ? state.formData
                : { ...state.formData, lyrics: lyricsFromTask },
            }
          : {}),
      }));

      if (lyricsFromTask) {
        console.log('[DEBUG] Letra preservada no polling:', lyricsFromTask.substring(0, 120));
      }

      if (taskStatus === 'FAILED') {
        console.warn('[DEBUG] Geração marcada como FAILED pelo backend.');
        get().stopPolling();
        set({
          isLoading: false,
          isPreviewLoading: false,
          isPolling: false,
          musicGenerationStatus: 'failed',
          currentTaskId: null,
          error: errorMessage || i18n.t('errors.generationFailed', { ns: 'musicStore' }),
        });
        if (errorMessage) {
          toast.error(errorMessage);
        }
        return;
      }

      if (totalExpected > 0 && completeCount >= totalExpected) {
        console.log(i18n.t('debug.generationCompleted', { ns: 'musicStore' }));
        
        set({ 
          isLoading: false,
          isPreviewLoading: false,
          isPolling: false,
          musicGenerationStatus: 'completed',
          currentTaskId: null
        });
        
        get().stopPolling();
        toast.success(i18n.t('success.allMusicGenerated', { ns: 'musicStore' }));
      }
      
    } catch (error) {
      console.error(i18n.t('errors.statusCheckError', { ns: 'musicStore' }), error);
      get().stopPolling(); // Para o loop em caso de erro
      
      set({
        isPolling: false,
        musicGenerationStatus: 'error',
        isLoading: false
      });
      
      get().setError(`${i18n.t('errors.statusCheckPrefix', { ns: 'musicStore' })}: ${error instanceof Error ? error.message : i18n.t('errors.unknownError', { ns: 'musicStore' })}`);
    }
  },

  // Inicia o loop de verificação
  startPolling: () => {
    const { currentTaskId } = get();
    
    get().stopPolling(); // Garante que não haja loops duplicados
    
    if (!currentTaskId) {
      console.warn(i18n.t('debug.cannotStartPollingWithoutTaskId', { ns: 'musicStore' }));
      return;
    }

    console.log(i18n.t('debug.startingStatusPolling', { ns: 'musicStore' }));
    
    // Inicia novo intervalo
    const newInterval = setInterval(async () => {
      await get().checkMusicStatus();
    }, 7000); // Verifica a cada 7 segundos
    
    set({ pollingInterval: newInterval, isPolling: true });
  },

  // Para o loop
  stopPolling: () => {
    const { pollingInterval: currentInterval } = get();
    
    if (currentInterval) {
      console.log('[DEBUG] Parando polling...');
      clearInterval(currentInterval);
    }
    set({ pollingInterval: null, isPolling: false });
  },

  // Funções para fluxo de validação MVP
  setMvpFlowComplete: (complete) => {
    set({ isMvpFlowComplete: complete });
  },

  setValidationPopupVisible: (visible) => {
    set({ isValidationPopupVisible: visible });
  },

  completeMvpFlow: () => {
    console.log(i18n.t('debug.mvpFlowCompleting', { ns: 'musicStore' }));
    set({ 
      isMvpFlowComplete: true,
      isValidationPopupVisible: false 
    });
  },

  // Nova função centralizada para iniciar fluxo de criação
  startNewCreationFlow: async (navigate, token) => {
    console.log('[startNewCreationFlow] INÍCIO. Verificando permissões...');
    const musicStore = useMusicStore.getState();
    const uiStore = useUiStore.getState();

    // Passo 1: Limpa qualquer estado de um fluxo anterior.
    musicStore.reset();
    
    try {
      // Passo 2: Verifica o status no backend.
      // A apiRequest já injeta automaticamente Authorization (se logado)
      // e X-Device-ID (fingerprint), então não sobrescreveremos os headers.
      const response = await apiRequest('/api/user/creation-status', { 
        method: 'GET'
      });

      // NOVA LÓGICA (Robusta): Verifica se a propriedade 'isFree' existe diretamente no objeto de resposta
      // OU dentro de uma propriedade 'data' usando optional chaining
      const isFree = response.isFree || response.data?.isFree;

      if (isFree === true) {
        // Se o usuário tem direito (novo convidado OU usuário logado com cota)
        console.log(i18n.t('debug.paywallAccessGranted', { ns: 'musicStore' }));
        uiStore.unblockCreationFlow();
        navigate(getLocalizedRoutePath('create'));
      } else {
        // Isso agora vai pegar os casos isFree === false, undefined, ou null
        console.log(i18n.t('debug.paywallAccessDenied', { ns: 'musicStore' }));
        uiStore.blockCreationFlow();
        uiStore.showPaymentPopup();
        // IMPORTANTE: Não navegamos para lugar nenhum. O usuário fica onde está.
      }
    } catch (error) {
      // Fail-safe revisado: não bloquear por falha de rede.
      console.warn(i18n.t('debug.paywallCheckFailed', { ns: 'musicStore' }), error);
      uiStore.unblockCreationFlow();
      try {
        // Informar o usuário sem travar o fluxo
      toast.info(i18n.t('errors.statusCheckFailedAccessing', { ns: 'musicStore' }));
      } catch {}
      navigate(getLocalizedRoutePath('create'));
    }
  },

  // Função para resetar apenas o formulário
  resetForm: () => {
    set({
      formData: initialFormData,
      currentStep: 0,
      error: null,
    });
  },

  // Função para resetar o fluxo (equivalente ao resetFlow mencionado)
  resetFlow: () => {
    console.log(i18n.t('debug.musicStateReset', { ns: 'musicStore' }));
    // Para o polling se estiver ativo
    get().stopPolling();
    
    set({
      formData: initialFormData,
      currentStep: 0,
      isPreviewLoading: false,
      isLoading: false,
      error: null,
      generatedAudioUrl: null,
      generatedLyrics: null,
      audioClips: [],
      currentTaskId: null,
      isPolling: false,
      musicGenerationStatus: 'idle',
      completedClips: 0,
      totalExpected: 2,
      pollingInterval: null,
      isMvpFlowComplete: false,
      isValidationPopupVisible: false,
    });
  },

  // Função para resetar o store completamente
  reset: () => {
    console.log(i18n.t('debug.storeReset', { ns: 'musicStore' }));
    // Para o polling se estiver ativo
    get().stopPolling();
    
    // Usa o objeto initialState para garantir reset completo
    set(initialState);
  },
}),
{
  name: 'music-generation-storage',
  partialize: (state) => ({
    formData: state.formData,
    currentStep: state.currentStep,
    generatedAudioUrl: state.generatedAudioUrl,
    generatedLyrics: state.generatedLyrics,
    audioClips: state.audioClips,
    musicGenerationStatus: state.musicGenerationStatus,
    completedClips: state.completedClips,
    totalExpected: state.totalExpected,
    isMvpFlowComplete: state.isMvpFlowComplete,
  }),
}
  )
);
