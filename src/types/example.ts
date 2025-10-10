import { z } from 'zod';
import { Artist } from './artist';
import { Song } from './song';

export const ExampleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  audioUrl: z.string(),
  duration: z.number(),
  artist: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().optional(),
  }),
  song: z.object({
    id: z.string(),
    title: z.string(),
    coverImage: z.string().optional(),
  }),
  tags: z.array(z.string()).optional(),
  stats: z.object({
    plays: z.number().default(0),
    likes: z.number().default(0),
    shares: z.number().default(0),
  }).optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Example = z.infer<typeof ExampleSchema>;

export interface ExampleWithDetails extends Example {
  artist: Artist;
  song: Song;
}

export interface ExampleFilter {
  artistId?: string;
  songId?: string;
  tag?: string;
  search?: string;
  sortBy?: 'plays' | 'likes' | 'shares' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ExampleResponse {
  data: Example[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExampleError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ExampleStats {
  totalPlays: number;
  totalLikes: number;
  totalShares: number;
  topTags: {
    name: string;
    count: number;
  }[];
  playsByDay: {
    date: string;
    plays: number;
  }[];
}

export interface ExampleUpdateInput {
  title?: string;
  description?: string;
  image?: string;
  audioUrl?: string;
  duration?: number;
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface ExampleGridProps {
  examples: Example[];
  loading?: boolean;
  error?: ExampleError;
  onExampleClick?: (example: Example) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface ExampleCardProps {
  example: Example;
  onClick?: (example: Example) => void;
  className?: string;
}

export interface ExamplePlayerProps {
  example: Example;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onError?: (error: Error) => void;
}