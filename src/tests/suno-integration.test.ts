import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sunoApi } from '../config/api';
import type { SunoGenerateRequest, SunoToAppSong } from '../types/suno';

// Mock da função fetch
global.fetch = vi.fn();

describe('Suno API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sunoApi.generate', () => {
    it('deve gerar músicas com sucesso', async () => {
      const mockResponse = {
        success: true,
        data: {
          task_id: 'test-task-id',
          clips: [
            {
              id: 'clip-1',
              title: 'Test Song 1',
              audio_url: 'https://example.com/audio1.mp3',
              image_url: 'https://example.com/image1.jpg',
              status: 'complete'
            },
            {
              id: 'clip-2', 
              title: 'Test Song 2',
              audio_url: 'https://example.com/audio2.mp3',
              image_url: 'https://example.com/image2.jpg',
              status: 'complete'
            }
          ]
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request: SunoGenerateRequest = {
        prompt: 'Create a happy song',
        custom_mode: false
      };

      const result = await sunoApi.generate(request);

      expect(result.success).toBe(true);
      expect(result.data?.clips).toHaveLength(2);
      expect(result.data?.clips[0].title).toBe('Test Song 1');
    });

    it('deve tratar erros da API', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const request: SunoGenerateRequest = {
        prompt: 'Create a song',
        custom_mode: false
      };

      const result = await sunoApi.generate(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });
  });

  describe('sunoApi.convertToAppSong', () => {
    it('deve converter música da Suno para formato da aplicação', () => {
      const sunoSong: SunoToAppSong = {
        id: 'suno-123',
        title: 'Amazing Song',
        audio_url: 'https://suno.com/audio.mp3',
        image_url: 'https://suno.com/cover.jpg',
        status: 'complete'
      };

      const appSong = sunoApi.convertToAppSong(sunoSong);

      expect(appSong.id).toBe('suno-123');
      expect(appSong.title).toBe('Amazing Song');
      expect(appSong.audioUrl).toBe('https://suno.com/audio.mp3');
      expect(appSong.coverUrl).toBe('https://suno.com/cover.jpg');
      expect(appSong.style).toBe('Suno AI');
    });

    it('deve usar URLs padrão quando não fornecidas', () => {
      const sunoSong: SunoToAppSong = {
        id: 'suno-456',
        title: 'Song Without URLs',
        status: 'complete'
      };

      const appSong = sunoApi.convertToAppSong(sunoSong);

      expect(appSong.audioUrl).toBeUndefined();
      expect(appSong.coverUrl).toContain('trae-api-us.mchost.guru');
    });
  });

  describe('sunoApi.getExampleSongs', () => {
    it('deve retornar músicas de exemplo', async () => {
      const examples = await sunoApi.getExampleSongs();

      expect(examples).toHaveLength(2);
      expect(examples[0].title).toBe('Melodia Relaxante');
      expect(examples[0].artist).toBe('Suno AI');
      expect(examples[0].audioUrl).toBeTruthy();
      expect(examples[0].coverUrl).toBeTruthy();
    });
  });
});