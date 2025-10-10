import { 
  SunoCallback, 
  SunoCallbackSchema,
  SunoRequest,
  SunoRequestSchema,
  SunoConfig,
  SunoConfigSchema
} from '@/types/suno';

export async function validateSunoCallback(data: unknown): Promise<SunoCallback> {
  return SunoCallbackSchema.parseAsync(data);
}

export async function validateSunoRequest(data: unknown): Promise<SunoRequest> {
  return SunoRequestSchema.parseAsync(data);
}

export async function validateSunoConfig(data: unknown): Promise<SunoConfig> {
  return SunoConfigSchema.parseAsync(data);
}

export function isSunoCallback(data: unknown): data is SunoCallback {
  return SunoCallbackSchema.safeParse(data).success;
}

export function isSunoRequest(data: unknown): data is SunoRequest {
  return SunoRequestSchema.safeParse(data).success;
}

export function isSunoConfig(data: unknown): data is SunoConfig {
  return SunoConfigSchema.safeParse(data).success;
}