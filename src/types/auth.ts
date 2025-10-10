import { z } from 'zod';

export const UserMetadataSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
  provider: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  preferences: z.record(z.unknown()).optional(),
});

export type UserMetadata = z.infer<typeof UserMetadataSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  user_metadata: UserMetadataSchema,
  app_metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  last_sign_in_at: z.string().datetime().optional(),
  confirmed_at: z.string().datetime().optional(),
  email_confirmed_at: z.string().datetime().optional(),
  banned_until: z.string().datetime().optional(),
  aud: z.string().optional(),
  role: z.string().optional(),
  is_anonymous: z.boolean().optional(),
});

export type User = z.infer<typeof UserSchema>;

export interface AuthState {
  user: User | null;
  session: unknown | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthError extends Error {
  code: string;
  details?: Record<string, unknown>;
}

export interface AuthOptions {
  provider?: string;
  redirectTo?: string;
  scopes?: string[];
  queryParams?: Record<string, string>;
  onSuccess?: (user: User) => void;
  onError?: (error: AuthError) => void;
}