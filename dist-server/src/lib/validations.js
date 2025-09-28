import { z } from 'zod';
import { useTranslatedSchemas, getTranslatedValidationErrors } from './zodTranslations';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import i18n from '@/i18n';
// Schema para o Passo 1 - Briefing (versão estática para compatibilidade)
export const briefingSchema = z.object({
    occasion: z.string({
        required_error: () => i18n.t('validations.briefing.occasion.required'),
    }).min(1, () => i18n.t('validations.briefing.occasion.required')),
    recipientName: z.string({
        required_error: () => i18n.t('validations.briefing.recipientName.required'),
    }).min(1, () => i18n.t('validations.briefing.recipientName.required'))
        .max(50, () => i18n.t('validations.briefing.recipientName.maxLength')),
    relationship: z.string({
        required_error: () => i18n.t('validations.briefing.relationship.required'),
    }).min(1, () => i18n.t('validations.briefing.relationship.required')),
    senderName: z.string().max(50, () => i18n.t('validations.briefing.senderName.maxLength')).optional(),
    hobbies: z.string().min(1, () => i18n.t('validations.briefing.hobbies.required')).max(500, () => i18n.t('validations.briefing.hobbies.maxLength')),
    qualities: z.string().min(1, () => i18n.t('validations.briefing.qualities.required')).max(500, () => i18n.t('validations.briefing.qualities.maxLength')),
    uniqueTraits: z.string().min(1, () => i18n.t('validations.briefing.uniqueTraits.required')).max(500, () => i18n.t('validations.briefing.uniqueTraits.maxLength')),
    memories: z.string().min(1, () => i18n.t('validations.briefing.memories.required')).max(1000, () => i18n.t('validations.briefing.memories.maxLength')),
});
// Schema para o Passo 2 - Letra (versão estática para compatibilidade)
export const lyricsSchema = z.object({
    lyrics: z.string({
        required_error: () => i18n.t('validations.lyrics.lyrics.required'),
    }).min(10, () => i18n.t('validations.lyrics.lyrics.minLength'))
        .max(2000, () => i18n.t('validations.lyrics.lyrics.maxLength')),
});
// Schema para o Passo 3 - Estilo (versão estática para compatibilidade)
export const styleSchema = z.object({
    genre: z.string({
        required_error: () => i18n.t('validations.style.genre.required'),
    }).min(1, () => i18n.t('validations.style.genre.required')),
    emotion: z.string({
        required_error: () => i18n.t('validations.style.emotion.required'),
    }).min(1, () => i18n.t('validations.style.emotion.required')),
    vocalPreference: z.string({
        required_error: () => i18n.t('validations.style.vocalPreference.required'),
    }).min(1, () => i18n.t('validations.style.vocalPreference.required')),
});
// Schema completo para todos os passos
export const fullMusicSchema = briefingSchema.merge(lyricsSchema).merge(styleSchema);
// Função utilitária para validar um passo específico
export const validateStep = (step, data) => {
    switch (step) {
        case 0:
            return briefingSchema.safeParse(data);
        case 1:
            return lyricsSchema.safeParse(data);
        case 2:
            return styleSchema.safeParse(data);
        case 3:
            // Para o passo de prévia, validamos todos os dados
            return fullMusicSchema.safeParse(data);
        default:
            // Retorna um erro estruturado, não lança uma exceção
            return {
                success: false,
                error: {
                    issues: [{ message: `Passo inválido: ${step}` }]
                }
            };
    }
};
// Função para extrair mensagens de erro formatadas (mantida para compatibilidade)
export function getValidationErrors(error) {
    const errors = {};
    error.errors.forEach((err) => {
        if (err.path && err.path.length > 0) {
            errors[err.path[0]] = err.message;
        }
    });
    return errors;
}
// Nova função que usa traduções dinâmicas
export function getTranslatedErrors(error, namespace) {
    return getTranslatedValidationErrors(error, namespace);
}
// Hook para obter esquemas traduzidos
export function useValidationSchemas(namespace) {
    return useTranslatedSchemas(namespace);
}
// Função para verificar se um passo pode ser avançado
export function canAdvanceStep(step, formData) {
    try {
        switch (step) {
            case 1:
                briefingSchema.parse(formData);
                return true;
            case 2:
                lyricsSchema.parse(formData);
                return true;
            case 3:
                styleSchema.parse(formData);
                return true;
            default:
                return true;
        }
    }
    catch {
        return false;
    }
}
// Mensagens de erro personalizadas para campos específicos (DEPRECATED - use traduções dinâmicas)
// @deprecated Use useTranslatedSchemas() ou getTranslatedValidationErrors() para traduções dinâmicas
export const customErrorMessages = {
    occasion: 'Por favor, selecione uma ocasião',
    recipientName: 'Por favor, informe o nome da pessoa',
    relationship: 'Por favor, selecione o relacionamento',
    hobbies: 'Por favor, descreva os hobbies e interesses (obrigatório)',
    qualities: 'Por favor, descreva as qualidades da pessoa (obrigatório)',
    uniqueTraits: 'Por favor, descreva características únicas (obrigatório)',
    memories: 'Por favor, compartilhe algumas memórias especiais (obrigatório)',
    lyrics: 'Por favor, escreva a letra da música',
    genre: 'Por favor, selecione um estilo musical',
    emotion: 'Selecione a emoção que deseja transmitir.',
    vocalPreference: 'Por favor, selecione uma preferência vocal'
};
// Hook para obter mensagens de erro traduzidas dinamicamente
export function useCustomErrorMessages(namespace = 'validations') {
    const { t } = useTranslation(namespace);
    return {
        occasion: t('customMessages.occasion'),
        recipientName: t('customMessages.recipientName'),
        relationship: t('customMessages.relationship'),
        hobbies: t('customMessages.hobbies'),
        qualities: t('customMessages.qualities'),
        uniqueTraits: t('customMessages.uniqueTraits'),
        memories: t('customMessages.memories'),
        lyrics: t('customMessages.lyrics'),
        genre: t('customMessages.genre'),
        emotion: t('customMessages.emotion'),
        vocalPreference: t('customMessages.vocalPreference')
    };
}
//# sourceMappingURL=validations.js.map