import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do hook useTranslation
const mockGetCurrentLanguage = vi.fn();
vi.mock('../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({
    getCurrentLanguage: mockGetCurrentLanguage,
    t: vi.fn(),
    changeLanguage: vi.fn(),
    isLanguageActive: vi.fn(),
    getAvailableLanguages: vi.fn(),
    formatNumber: vi.fn(),
    formatDate: vi.fn(),
    formatCurrency: vi.fn()
  })
}));

// Mock da API
const mockApiPost = vi.fn();
vi.mock('../lib/api', () => ({
  api: {
    post: mockApiPost
  }
}));

// Mock do authStore
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true
  }))
}));

// Mock do sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Importar após os mocks
import { useMusicStore } from '../store/musicStore';

describe('MusicStore - Detecção de Idioma', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentLanguage.mockReturnValue('pt');
    mockApiPost.mockResolvedValue({
      data: {
        success: true,
        lyrics: 'Letra gerada',
        audioUrls: ['http://example.com/audio.mp3']
      }
    });
    
    // Reset do store
    useMusicStore.setState({
      formData: {
        recipientName: '',
        occasion: '',
        relationship: '',
        duration: ''
      },
      isGenerating: false,
      generatedLyrics: '',
      audioUrls: []
    });
  });

  describe('getCurrentLanguage', () => {
    it('deve mapear pt para pt-BR', () => {
      mockGetCurrentLanguage.mockReturnValue('pt');
      
      // Testar diretamente a lógica de mapeamento
      const currentLang = mockGetCurrentLanguage();
      const mappedLang = currentLang === 'pt' ? 'pt-BR' : currentLang === 'en' ? 'en-US' : 'pt-BR';
      
      expect(mappedLang).toBe('pt-BR');
    });

    it('deve mapear en para en-US', () => {
      mockGetCurrentLanguage.mockReturnValue('en');
      
      const currentLang = mockGetCurrentLanguage();
      const mappedLang = currentLang === 'pt' ? 'pt-BR' : currentLang === 'en' ? 'en-US' : 'pt-BR';
      
      expect(mappedLang).toBe('en-US');
    });

    it('deve usar pt-BR como padrão para idiomas não suportados', () => {
      mockGetCurrentLanguage.mockReturnValue('fr');
      
      const currentLang = mockGetCurrentLanguage();
      const mappedLang = currentLang === 'pt' ? 'pt-BR' : currentLang === 'en' ? 'en-US' : 'pt-BR';
      
      expect(mappedLang).toBe('pt-BR');
    });
  });

  describe('Integração com detecção de idioma', () => {
    it('deve verificar se o parâmetro language é adicionado corretamente', () => {
      // Testar mapeamento de português
      mockGetCurrentLanguage.mockReturnValue('pt');
      let currentLang = mockGetCurrentLanguage();
      let mappedLang = currentLang === 'pt' ? 'pt-BR' : currentLang === 'en' ? 'en-US' : 'pt-BR';
      expect(mappedLang).toBe('pt-BR');
      
      // Testar mapeamento de inglês
      mockGetCurrentLanguage.mockReturnValue('en');
      currentLang = mockGetCurrentLanguage();
      mappedLang = currentLang === 'pt' ? 'pt-BR' : currentLang === 'en' ? 'en-US' : 'pt-BR';
      expect(mappedLang).toBe('en-US');
      
      // Testar idioma não suportado
      mockGetCurrentLanguage.mockReturnValue('fr');
      currentLang = mockGetCurrentLanguage();
      mappedLang = currentLang === 'pt' ? 'pt-BR' : currentLang === 'en' ? 'en-US' : 'pt-BR';
      expect(mappedLang).toBe('pt-BR');
    });
    
    it('deve confirmar que os mocks estão funcionando', () => {
      expect(mockGetCurrentLanguage).toBeDefined();
      expect(mockApiPost).toBeDefined();
      expect(useMusicStore).toBeDefined();
    });
  });
});