import { z } from 'zod';

// Schema para o Passo 1 - Briefing
export const briefingSchema = z.object({
  occasion: z.string({
    required_error: 'Por favor, selecione uma ocasião especial.',
  }).min(1, 'A ocasião é obrigatória.'),
  
  recipientName: z.string({
    required_error: 'Por favor, informe o nome da pessoa.',
  }).min(1, 'O nome da pessoa é obrigatório.')
    .max(50, 'O nome deve ter no máximo 50 caracteres.'),
  
  relationship: z.string({
    required_error: 'Por favor, selecione o tipo de relação.',
  }).min(1, 'A relação é obrigatória.'),
  
  senderName: z.string().max(50, 'O nome deve ter no máximo 50 caracteres.').optional(),
  
  hobbies: z.string().max(500, 'Os hobbies devem ter no máximo 500 caracteres.').optional(),
  
  qualities: z.string().max(500, 'As qualidades devem ter no máximo 500 caracteres.').optional(),
  
  uniqueTraits: z.string().max(500, 'Os traços únicos devem ter no máximo 500 caracteres.').optional(),
  
  memories: z.string().max(1000, 'As memórias devem ter no máximo 1000 caracteres.').optional(),
});

// Schema para o Passo 2 - Letra
export const lyricsSchema = z.object({
  lyrics: z.string({
    required_error: 'A letra da música é obrigatória.',
  }).min(10, 'A letra deve ter pelo menos 10 caracteres.')
    .max(2000, 'A letra deve ter no máximo 2000 caracteres.'),
});

// Schema para o Passo 3 - Estilo
export const styleSchema = z.object({
  genre: z.string({
    required_error: 'Por favor, selecione um gênero musical.',
  }).min(1, 'O gênero musical é obrigatório.'),
  
  emotion: z.string({
    required_error: 'Por favor, selecione uma emoção.',
  }).min(1, 'A emoção é obrigatória.'),
  
  vocalPreference: z.string({
    required_error: 'Por favor, selecione uma preferência vocal.',
  }).min(1, 'A preferência vocal é obrigatória.'),
});

// Schema completo para todos os passos
export const fullMusicSchema = briefingSchema.merge(lyricsSchema).merge(styleSchema);

// Tipos TypeScript inferidos dos schemas
export type BriefingData = z.infer<typeof briefingSchema>;
export type LyricsData = z.infer<typeof lyricsSchema>;
export type StyleData = z.infer<typeof styleSchema>;
export type FullMusicData = z.infer<typeof fullMusicSchema>;

// Função utilitária para validar um passo específico
export const validateStep = (step: number, data: Record<string, unknown>) => {
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

// Função para extrair mensagens de erro formatadas
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    if (err.path && err.path.length > 0) {
      errors[err.path[0]] = err.message;
    }
  });
  
  return errors;
}

// Função para verificar se um passo pode ser avançado
export function canAdvanceStep(step: number, formData: FormData): boolean {
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
  } catch {
    return false;
  }
}

// Mensagens de erro personalizadas para campos específicos
export const customErrorMessages = {
  occasion: 'Selecione a ocasião especial para sua música.',
  recipientName: 'Informe o nome da pessoa especial.',
  relationship: 'Defina qual é a sua relação com essa pessoa.',
  lyrics: 'A letra da música precisa ser gerada ou aprovada.',
  genre: 'Escolha o estilo musical da sua preferência.',
  emotion: 'Selecione a emoção que deseja transmitir.',
  vocalPreference: 'Defina sua preferência de vocais.',
};