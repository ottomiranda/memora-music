import { SunoCallbackSchema, SunoRequestSchema, SunoConfigSchema } from '@/types/suno';
export async function validateSunoCallback(data) {
    return SunoCallbackSchema.parseAsync(data);
}
export async function validateSunoRequest(data) {
    return SunoRequestSchema.parseAsync(data);
}
export async function validateSunoConfig(data) {
    return SunoConfigSchema.parseAsync(data);
}
export function isSunoCallback(data) {
    return SunoCallbackSchema.safeParse(data).success;
}
export function isSunoRequest(data) {
    return SunoRequestSchema.safeParse(data).success;
}
export function isSunoConfig(data) {
    return SunoConfigSchema.safeParse(data).success;
}
//# sourceMappingURL=suno.js.map