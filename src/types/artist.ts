import { z } from 'zod';

export const ArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  bio: z.string().optional(),
  image: z.string().optional(),
  coverImage: z.string().optional(),
  genres: z.array(z.string()).optional(),
  socialLinks: z.object({
    spotify: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  stats: z.object({
    monthlyListeners: z.number().optional(),
    followers: z.number().optional(),
    totalPlays: z.number().optional(),
  }).optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Artist = z.infer<typeof ArtistSchema>;

export interface ArtistWithSongs extends Artist {
  songs: {
    id: string;
    title: string;
    duration: number;
    plays: number;
    coverImage?: string;
  }[];
}

export interface ArtistStats {
  totalPlays: number;
  monthlyListeners: number;
  followers: number;
  topSongs: {
    id: string;
    title: string;
    plays: number;
  }[];
  topGenres: {
    name: string;
    count: number;
  }[];
  playsByMonth: {
    month: string;
    plays: number;
  }[];
}

export interface ArtistFilter {
  genre?: string;
  search?: string;
  sortBy?: 'name' | 'monthlyListeners' | 'followers' | 'totalPlays';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ArtistResponse {
  data: Artist[];
  total: number;
  limit: number;
  offset: number;
}

export interface ArtistError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ArtistUpdateInput {
  name?: string;
  bio?: string;
  image?: string;
  coverImage?: string;
  genres?: string[];
  socialLinks?: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
  metadata?: Record<string, string>;
}