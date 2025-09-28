import { z } from 'zod';
import { useTranslation } from '@/i18n/hooks/useTranslation';
// Função para criar esquemas Zod com traduções dinâmicas
export function createTranslatedSchema(schemaDefinition) {
    return (namespace = 'validation') => {
        const { t } = useTranslation(namespace);
        return z.object(schemaDefinition(t));
    };
}
// Função para criar mensagens de erro traduzidas para esquemas existentes
export function getTranslatedErrorMap(namespace = 'validation') {
    const { t } = useTranslation(namespace);
    return (issue, ctx) => {
        switch (issue.code) {
            case z.ZodIssueCode.invalid_type:
                if (issue.expected === 'string') {
                    return { message: t('errors.required') };
                }
                break;
            case z.ZodIssueCode.too_small:
                if (issue.type === 'string') {
                    if (issue.minimum === 1) {
                        return { message: t('errors.required') };
                    }
                    return { message: t('errors.tooShort', { min: issue.minimum }) };
                }
                break;
            case z.ZodIssueCode.too_big:
                if (issue.type === 'string') {
                    return { message: t('errors.tooLong', { max: issue.maximum }) };
                }
                break;
            case z.ZodIssueCode.invalid_string:
                if (issue.validation === 'email') {
                    return { message: t('errors.invalidEmail') };
                }
                if (issue.validation === 'regex') {
                    return { message: t('errors.invalidFormat') };
                }
                break;
            default:
                break;
        }
        return { message: ctx.defaultError };
    };
}
// Hook para criar esquemas com traduções
export function useTranslatedSchemas(namespace = 'validations') {
    const { t } = useTranslation(namespace);
    // Esquema de briefing traduzido
    const briefingSchema = z.object({
        occasion: z.string({
            required_error: t('briefing.occasion.required'),
        }).min(1, t('briefing.occasion.min')),
        recipientName: z.string({
            required_error: t('briefing.recipientName.required'),
        }).min(1, t('briefing.recipientName.min'))
            .max(50, t('briefing.recipientName.max')),
        relationship: z.string({
            required_error: t('briefing.relationship.required'),
        }).min(1, t('briefing.relationship.min')),
        senderName: z.string().max(50, t('briefing.senderName.max')).optional(),
        hobbies: z.string()
            .min(1, t('briefing.hobbies.min'))
            .max(500, t('briefing.hobbies.max')),
        qualities: z.string()
            .min(1, t('briefing.qualities.min'))
            .max(500, t('briefing.qualities.max')),
        uniqueTraits: z.string()
            .min(1, t('briefing.uniqueTraits.min'))
            .max(500, t('briefing.uniqueTraits.max')),
        memories: z.string()
            .min(1, t('briefing.memories.min'))
            .max(1000, t('briefing.memories.max')),
    });
    // Esquema de letra traduzido
    const lyricsSchema = z.object({
        lyrics: z.string({
            required_error: t('lyrics.lyrics.required'),
        }).min(10, t('lyrics.lyrics.min'))
            .max(2000, t('lyrics.lyrics.max')),
    });
    // Esquema de estilo traduzido
    const styleSchema = z.object({
        genre: z.string({
            required_error: t('style.genre.required'),
        }).min(1, t('style.genre.min')),
        emotion: z.string({
            required_error: t('style.emotion.required'),
        }).min(1, t('style.emotion.min')),
        vocalPreference: z.string({
            required_error: t('style.vocalPreference.required'),
        }).min(1, t('style.vocalPreference.min')),
    });
    // Esquema de autenticação traduzido
    const loginSchema = z.object({
        email: z
            .string()
            .min(1, t('auth.email.required'))
            .email(t('auth.email.invalid')),
        password: z
            .string()
            .min(6, t('auth.password.minLength'))
            .max(100, t('auth.password.maxLength')),
    });
    const signupSchema = loginSchema.extend({
        name: z
            .string()
            .min(2, t('auth.name.minLength'))
            .max(100, t('auth.name.maxLength'))
            .regex(/^[a-zA-ZÀ-ÿ\s]+$/, t('auth.name.invalidFormat')),
    });
    return {
        briefingSchema,
        lyricsSchema,
        styleSchema,
        loginSchema,
        signupSchema,
        fullMusicSchema: briefingSchema.merge(lyricsSchema).merge(styleSchema),
        getAuthSchema: (isLogin) => isLogin ? loginSchema : signupSchema,
    };
}
// Função para extrair mensagens de erro traduzidas
export function getTranslatedValidationErrors(error, namespace = 'validations') {
    const { t } = useTranslation(namespace);
    const errors = {};
    error.errors.forEach((err) => {
        if (err.path && err.path.length > 0) {
            const fieldName = err.path[0];
            // Tenta usar uma tradução específica para o campo, senão usa a mensagem padrão
            const translationKey = `errors.fields.${fieldName}`;
            errors[fieldName] = t(translationKey, { defaultValue: err.message });
        }
    });
    return errors;
}
//# sourceMappingURL=zodTranslations.js.map