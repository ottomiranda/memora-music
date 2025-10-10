import { z } from 'zod';

export const SongSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  audioUrl: z.string().optional(),
  audioUrlOption1: z.string().optional(),
  audioUrlOption2: z.string().optional(),
  coverUrl: z.string().optional(),
  duration: z.number().optional(),
  lyrics: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  error: z.string().optional(),
});

export type Song = z.infer<typeof SongSchema>;

export interface SongWithVersions extends Song {
  audioUrlOption1?: string;
  audioUrlOption2?: string;
}

export interface SongResponse {
  songs: Song[];
  total: number;
  page: number;
  limit: number;
}

export interface SongError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface SongStats {
  totalSongs: number;
  totalArtists: number;
  totalDuration: number;
  averageDuration: number;
}

export interface SongFilter {
  artist?: string;
  title?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}