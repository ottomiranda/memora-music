import { z } from 'zod';

// Main Song schema
export const SongSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  guestId: z.string().nullable(),
  title: z.string().min(1).max(500),
  lyrics: z.string().nullable(),
  prompt: z.string().nullable(),
  genre: z.string().nullable(),
  mood: z.string().nullable(),
  audioUrlOption1: z.string().url().nullable(),
  audioUrlOption2: z.string().url().nullable(),
  sunoTaskId: z.string().nullable(),
  generationStatus: z.enum(['pending', 'processing', 'completed', 'failed']),
  isPaid: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

// Schema for creating a new song
export const CreateSongRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  guestId: z.string().min(1).optional(),
  title: z.string().min(1).max(500),
  lyrics: z.string().optional(),
  prompt: z.string().optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  audioUrlOption1: z.string().url().optional(),
  audioUrlOption2: z.string().url().optional(),
  sunoTaskId: z.string().optional()
}).refine(
  (data) => data.userId || data.guestId,
  { 
    message: "Either userId or guestId must be provided",
    path: ["userId", "guestId"]
  }
);

// Schema for listing songs query parameters
export const ListSongsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  guestId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['created_at', 'title']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).refine(
  (data) => data.userId || data.guestId,
  { 
    message: "Either userId or guestId must be provided",
    path: ["userId", "guestId"]
  }
);

// Schema for migrating guest data
export const MigrateGuestDataSchema = z.object({
  guestId: z.string().min(1, "Guest ID is required")
});

// Schema for checking music status
export const CheckStatusQuerySchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  userId: z.string().uuid().optional(),
  guestId: z.string().optional()
}).refine(
  (data) => data.userId || data.guestId,
  { 
    message: "Either userId or guestId must be provided",
    path: ["userId", "guestId"]
  }
);

// Schema for database row mapping
export const DatabaseSongSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  guest_id: z.string().nullable(),
  title: z.string(),
  lyrics: z.string().nullable(),
  prompt: z.string().nullable(),
  genre: z.string().nullable(),
  mood: z.string().nullable(),
  image_url: z.string().nullable().optional(),
  audio_url_option1: z.string().nullable(),
  audio_url_option2: z.string().nullable(),
  suno_task_id: z.string().nullable().optional(),
  task_id: z.string().nullable().optional(),
  generation_status: z.string().default('completed'),
  webhook_received_at: z.string().nullable().optional(),
  webhook_payload: z.any().nullable().optional(),
  generation_method: z.string().default('polling').optional(),
  created_at: z.string(),
  updated_at: z.string()
});

// Type exports (commented out for JavaScript compatibility)
// export type Song = z.infer<typeof SongSchema>;
// export type CreateSongRequest = z.infer<typeof CreateSongRequestSchema>;
// export type ListSongsQuery = z.infer<typeof ListSongsQuerySchema>;
// export type MigrateGuestData = z.infer<typeof MigrateGuestDataSchema>;
// export type CheckStatusQuery = z.infer<typeof CheckStatusQuerySchema>;
// export type DatabaseSong = z.infer<typeof DatabaseSongSchema>;

// Utility function to validate guest ID format
export function isValidGuestId(guestId) {
  // Should be a UUID v4 or alphanumeric string of 20-50 characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const alphanumericRegex = /^[a-zA-Z0-9_-]{20,50}$/;
  
  return uuidRegex.test(guestId) || alphanumericRegex.test(guestId);
}

// Utility function to sanitize song title
export function sanitizeSongTitle(title) {
  return title
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 500); // Ensure max length
}

// Utility function to validate audio URL
export function isValidAudioUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}
