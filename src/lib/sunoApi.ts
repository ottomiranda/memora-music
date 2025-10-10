import { SunoMusicDetailsResponse } from '@/types/suno';

const SUNO_API_BASE = 'https://api.sunoapi.org/api/v1';

export class SunoAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = SUNO_API_BASE;
  }

  async getMusicDetails(taskId: string): Promise<SunoMusicDetailsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/music/${encodeURIComponent(taskId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[SunoAPI] Error getting music details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateMusic(options: {
    prompt: string;
    customMode: boolean;
    style: string;
    title: string;
    instrumental: boolean;
    model: string;
  }) {
    try {
      const requestBody = {
        ...options,
        callBackUrl:
          (import.meta.env?.VITE_APP_URL as string | undefined) ||
          (import.meta.env?.NEXT_PUBLIC_APP_URL as string | undefined) ||
          (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
      };

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[SunoAPI] Error generating music:', error);
      throw error;
    }
  }
}

// Instância padrão para uso na aplicação
const sunoApiKey =
  (import.meta.env?.VITE_SUNO_API_KEY as string | undefined) ||
  (import.meta.env?.NEXT_PUBLIC_SUNO_API_KEY as string | undefined) ||
  '';
export const sunoApi = new SunoAPI(sunoApiKey);