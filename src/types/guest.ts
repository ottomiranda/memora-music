// Tipos para o sistema de identidade de convidado

export interface GuestIdentity {
  guestId: string;
  createdAt: Date;
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  error?: string;
  message?: string;
}

export interface Song {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  lyrics?: string;
  genre?: string;
  mood?: string;
  userId?: string;
  guestId?: string;
  createdAt: string;
}

export interface SongsResponse {
  songs: Song[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown> | FormData | string | null;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Tipos para autenticação
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

export interface SignupResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

// Constantes do sistema
export const GUEST_ID_KEY = 'memora-guest-id';
export const GUEST_ID_HEADER = 'X-Guest-ID';