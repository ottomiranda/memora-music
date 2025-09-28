import { describe, it, expect } from "vitest";
import { PromptAdapter, type LyricsPromptRequest } from "../lib/services/promptAdapter";

describe("PromptAdapter", () => {
  describe("Geração de prompts", () => {
    it("deve criar prompt em português quando idioma é pt-BR", () => {
      const prompt = PromptAdapter.adaptForLanguage('Uma música sobre amor', 'pt-BR', 'pop', 'romântico');
      
      expect(prompt).toContain('Uma música sobre amor');
      expect(prompt).toContain('pop');
      expect(prompt).toContain('romântico');
      expect(prompt).toContain('português');
    });

    it('deve usar português como padrão para idioma não suportado', () => {
      const prompt = PromptAdapter.adaptForLanguage('Uma música sobre amor', 'fr-FR' as any, 'pop', 'romântico');
      
      expect(prompt).toContain('Uma música sobre amor');
      expect(prompt).toContain('português');
    });

    it('deve criar prompt em inglês quando idioma é en-US', () => {
      const prompt = PromptAdapter.adaptForLanguage('A song about love', 'en-US', 'pop', 'romantic');
      
      expect(prompt).toContain('A song about love');
      expect(prompt).toContain('pop');
      expect(prompt).toContain('romantic');
      expect(prompt).toContain('English');
    });
  });

  describe('Detecção de idioma', () => {
    it('deve mapear pt para pt-BR', () => {
      const language = PromptAdapter.mapI18nLanguage('pt');
      expect(language).toBe('pt-BR');
    });

    it('deve mapear en para en-US', () => {
      const language = PromptAdapter.mapI18nLanguage('en');
      expect(language).toBe('en-US');
    });

    it('deve usar pt-BR como padrão para idiomas não suportados', () => {
      const language = PromptAdapter.mapI18nLanguage('fr');
      expect(language).toBe('pt-BR');
    });
  });

  describe('Verificação de idiomas suportados', () => {
    it('deve verificar se idioma é suportado', () => {
      expect(PromptAdapter.isLanguageSupported('pt-BR')).toBe(true);
      expect(PromptAdapter.isLanguageSupported('en-US')).toBe(true);
      expect(PromptAdapter.isLanguageSupported('fr-FR')).toBe(false);
    });

    it('deve retornar lista de idiomas suportados', () => {
      const languages = PromptAdapter.getSupportedLanguages();
      expect(languages).toContain('pt-BR');
      expect(languages).toContain('en-US');
    });
  });

  describe('Criação de requisição', () => {
    it('deve criar requisição completa com idioma detectado', () => {
      const request = PromptAdapter.createGenerationRequest(
        'Uma música sobre amor',
        'pop',
        'romântico',
        'pt'
      );
      
      expect(request.prompt).toContain('Uma música sobre amor');
      expect(request.genre).toBe('pop');
      expect(request.mood).toBe('romântico');
      expect(request.language).toBe('pt-BR');
    });
  });

  describe('AdaptPrompt legado', () => {
    const baseRequest: LyricsPromptRequest = {
      occasion: 'Aniversário',
      recipientName: 'João',
      relationship: 'Amigo',
      senderName: 'Maria',
      hobbies: 'Futebol',
      qualities: 'Engraçado',
      uniqueTraits: 'Sempre sorrindo',
      memories: 'Nossas viagens',
      personalMessage: 'Você é incrível',
      genre: 'Pop',
      mood: 'Alegre',
      tempo: 'Rápido',
      duration: '3 minutos',
      emotionalTone: 'Emocionante',
      instruments: ['Guitarra', 'Piano']
    };

    it('deve gerar prompt estruturado em português', () => {
      const adapter = new PromptAdapter();
      const prompt = adapter.adaptPrompt('generateLyrics', 'pt-BR', baseRequest);

      expect(prompt).toContain('[TÍTULO]');
      expect(prompt).toContain('PORTUGUÊS BRASILEIRO');
      expect(prompt).toContain('Gênero (Pop)');
    });

    it('deve gerar prompt estruturado em inglês', () => {
      const adapter = new PromptAdapter();
      const prompt = adapter.adaptPrompt('generateLyrics', 'en', baseRequest);

      expect(prompt).toContain('[TITLE]');
      expect(prompt).toContain('Write the entire song in ENGLISH');
      expect(prompt).toContain('Genre (Pop)');
    });
  });
});
