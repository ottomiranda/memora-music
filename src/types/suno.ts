// Tipos para a integração com a Suno API
// Baseado na documentação: https://docs.sunoapi.org/suno-api/generate-music

export interface SunoGenerateRequest {
  customMode: boolean;
  instrumental: boolean;
  model: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5';
  callBackUrl: string;
  prompt?: string;
  style?: string;
  title?: string;
  negativeTags?: string;
  vocalGender?: 'm' | 'f';
}

export interface SunoSong {
  id: string;
  title: string;
  image_url?: string;
  lyric?: string;
  audio_url?: string;
  video_url?: string;
  created_at: string;
  model_name: string;
  status: 'queued' | 'generating' | 'complete' | 'error';
  gpt_description_prompt?: string;
  prompt?: string;
  type?: string;
  tags?: string;
  duration?: number;
}

export interface SunoGenerateResponse {
  success: boolean;
  data: SunoSong[];
  message?: string;
  error?: string;
}

export interface SunoTaskStatus {
  id: string;
  status: 'queued' | 'generating' | 'complete' | 'error';
  created_at: string;
  updated_at: string;
  songs: SunoSong[];
}

export interface SunoApiError {
  success: false;
  error: string;
  message?: string;
}

// Configuração da API
export interface SunoApiConfig {
  apiKey: string;
  baseUrl?: string;
}

// Tipos para integração com o sistema existente
export interface SunoToAppSong {
  id: string;
  title: string;
  audioUrl?: string;
  audioUrlOption1?: string;
  audioUrlOption2?: string;
  coverUrl?: string;
  duration?: number;
  genre?: string;
  artist?: string;
  createdAt: string;
  source: 'suno';
}

// Tipos para o endpoint GET /v1/music/{task_id}
export interface SunoMusicDetails {
  task_id: string;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
  title?: string;
  artist?: string;
  duration?: number;
  audio_url?: string;
  stream_audio_url?: string;
  image_url?: string;
  created_at?: string;
}

export interface SunoMusicDetailsResponse {
  success: boolean;
  data?: SunoMusicDetails;
  message?: string;
  error?: string;
}

export type SunoApiResponse<T> = 
  | (T & { success: true })
  | SunoApiError;
