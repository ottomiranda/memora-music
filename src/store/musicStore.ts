import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { API_ENDPOINTS, apiRequest } from '../config/api';
import { useAuthStore } from './authStore';
import { useUiStore } from './uiStore';

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
  regenerateLyrics: () => void;
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
      const errorMsg = 'Por favor, preencha todos os campos obrigatórios da primeira etapa antes de gerar a letra.';
      console.log('❌ Validação falhou - Campos obrigatórios da primeira etapa faltando:', {
        recipientName: formData.recipientName,
        occasion: formData.occasion,
        relationship: formData.relationship
      });
      set({ error: errorMsg });
      toast.error(errorMsg);
      return;
    }
    
    // Preparar payload para envio
    const payload = {
      ...formData,
      lyricsOnly: true
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
        toast.success('Letra e título gerados com sucesso!');
      } else {
        const errorMsg = 'Resposta da API não contém letra ou título válidos';
        console.log('❌ Erro na resposta da API:', {
          lyrics: result.lyrics ? 'presente' : 'ausente',
          songTitle: result.songTitle ? 'presente' : 'ausente',
          result
        });
        set({ error: errorMsg });
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Erro ao gerar letra (catch):', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      const errorMsg = error instanceof Error ? 
        error.message : 
        'Erro de conexão. Verifique sua internet e tente novamente.';
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
      const errorMsg = 'Por favor, preencha todos os campos obrigatórios antes de gerar a prévia.';
      set({ error: errorMsg });
      toast.error(errorMsg);
      return;
    }
    
    // Preparar payload para envio
    const payload = {
      ...formData,
      lyricsOnly: false
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
        const errorMsg = result.error || 'Erro desconhecido ao gerar prévia';
        set({
          error: errorMsg,
          isPreviewLoading: false,
        });
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Erro ao gerar prévia:', error);
      const errorMsg = 'Erro de conexão. Verifique sua internet e tente novamente.';
      set({
        error: errorMsg,
        isPreviewLoading: false,
      });
      toast.error(errorMsg);
    }
  },
  
  regenerateLyrics: () => {
    get().generateLyrics();
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
      const errorMsg = 'Por favor, preencha todos os campos de estilo antes de gerar a música.';
      console.log('❌ Validação falhou - Campos obrigatórios faltando:', {
        lyrics: formData.lyrics ? 'presente' : 'ausente',
        songTitle: formData.songTitle ? 'presente' : 'ausente',
        genre: formData.genre,
        emotion: formData.emotion,
        vocalPreference: formData.vocalPreference
      });
      set({ error: errorMsg });
      toast.error(errorMsg);
      return;
    }
    
    // Preparar payload para envio
    const payload = {
      ...formData,
      lyricsOnly: false
    };
    
    console.log('✅ Validação passou - Enviando payload para música:', JSON.stringify(payload, null, 2));
    
    // Resetar estados e iniciar loading
    set({ 
      isPreviewLoading: true, 
      isLoading: true,
      error: null,
      audioClips: [],
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
        
        toast.success('Geração de música iniciada! Aguarde enquanto processamos...');
        
      } else if (result.success && result.audioClips) {
        // Fallback para sistema antigo (todas as músicas prontas de uma vez)
        console.log(`✅ Músicas recebidas com sucesso (sistema antigo): ${result.audioClips.length} clipes`);
        
        set({
          audioClips: result.audioClips,
          generatedAudioUrl: result.audioClips[0]?.audio_url,
          generatedLyrics: result.data?.lyrics || formData.lyrics,
          isPreviewLoading: false,
          isLoading: false,
          musicGenerationStatus: 'completed',
          completedClips: result.audioClips.length
        });
        
        toast.success(`${result.audioClips.length} música(s) gerada(s) com sucesso!`);
        
      } else {
        const errorMsg = result.error || 'Resposta da API inválida';
        console.log('❌ Erro na resposta da API:', result);
        set({ 
          error: errorMsg, 
          isPreviewLoading: false,
          isLoading: false,
          musicGenerationStatus: 'failed'
        });
        toast.error(errorMsg);
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar música (catch):', error);
      
      const errorMsg = error instanceof Error ? 
        error.message : 
        'Erro de conexão. Verifique sua internet e tente novamente.';
      set({ 
        error: errorMsg, 
        isPreviewLoading: false,
        isLoading: false,
        musicGenerationStatus: 'failed'
      });
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
      
      const result = await apiRequest(`${API_ENDPOINTS.CHECK_MUSIC_STATUS}/${currentTaskId}`, {
        method: 'GET',
      });
      
      console.log('[DEBUG STATUS CHECK] Resposta recebida:', result);
      
      // Receber e Validar a Resposta
      if (!result.success || typeof result.data !== 'object') {
        console.error('Resposta de status inválida.');
        return; // Continua tentando na próxima iteração
      }
      
      const statusData = result.data;
      
      // Acesso correto aos dados da resposta do backend
      const completeCount = statusData.completedClips || 0;
      const totalExpected = statusData.totalExpected || get().totalExpected || 0;
      const clips = Array.isArray(statusData.audioClips) ? statusData.audioClips : [];
      
      console.log(`[DEBUG] Clipes completos: ${completeCount}/${totalExpected}`);
      
      // ATUALIZAÇÃO PROGRESSIVA DO ESTADO (SEMPRE)
      set({ audioClips: clips, completedClips: completeCount });

      // CONDIÇÃO DE PARADA PRECISA
      if (totalExpected > 0 && completeCount >= totalExpected) {
        console.log('✅ Geração concluída. Parando polling.');
        
        set({ 
          isLoading: false,
          isPreviewLoading: false,
          isPolling: false,
          musicGenerationStatus: 'completed',
          currentTaskId: null
        });
        
        get().stopPolling();
        toast.success('🎉 Todas as músicas foram geradas com sucesso!');
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      get().stopPolling(); // Para o loop em caso de erro
      
      set({
        isPolling: false,
        musicGenerationStatus: 'error',
        isLoading: false
      });
      
      get().setError(`Erro ao verificar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  },

  // Inicia o loop de verificação
  startPolling: () => {
    const { currentTaskId } = get();
    
    get().stopPolling(); // Garante que não haja loops duplicados
    
    if (!currentTaskId) {
      console.warn('[DEBUG] Não é possível iniciar polling sem taskId');
      return;
    }

    console.log('[DEBUG] Iniciando polling de status...');
    
    // Inicia novo intervalo
    const newInterval = setInterval(async () => {
      await get().checkMusicStatus();
    }, 7000); // Verifica a cada 7 segundos
    
    set({ pollingInterval: newInterval });
  },

  // Para o loop
  stopPolling: () => {
    const { pollingInterval: currentInterval } = get();
    
    if (currentInterval) {
      console.log('[DEBUG] Parando polling...');
      clearInterval(currentInterval);
      set({ pollingInterval: null });
    }
  },

  // Funções para fluxo de validação MVP
  setMvpFlowComplete: (complete) => {
    set({ isMvpFlowComplete: complete });
  },

  setValidationPopupVisible: (visible) => {
    set({ isValidationPopupVisible: visible });
  },

  completeMvpFlow: () => {
    console.log('[MVP] Completando fluxo MVP - desbloqueando funcionalidade completa');
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
        console.log('[PAYWALL] Acesso permitido. Navegando para /criar.');
        uiStore.unblockCreationFlow();
        navigate('/criar');
      } else {
        // Isso agora vai pegar os casos isFree === false, undefined, ou null
        console.log('[PAYWALL] Acesso negado. Mostrando modal de pagamento.');
        uiStore.blockCreationFlow();
        uiStore.showPaymentPopup();
        // IMPORTANTE: Não navegamos para lugar nenhum. O usuário fica onde está.
      }
    } catch (error) {
      // Fail-safe revisado: não bloquear por falha de rede.
      console.warn('[PAYWALL] Falha ao verificar status. Permitindo acesso provisório ao fluxo.', error);
      uiStore.unblockCreationFlow();
      try {
        // Informar o usuário sem travar o fluxo
        toast.info('Não foi possível verificar seu status agora. Acessando o criador mesmo assim.');
      } catch {}
      navigate('/criar');
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
    console.log('[resetFlow] Estado da música sendo resetado.');
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
    console.log('[reset] Resetando store para estado inicial. currentStep será definido como 0.');
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
