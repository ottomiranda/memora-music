import { z } from 'zod';

// Esquema base para login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  password: z
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .max(100, 'A senha deve ter no máximo 100 caracteres'),
});

// Esquema para signup (inclui nome)
export const signupSchema = loginSchema.extend({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
});

// Tipos TypeScript inferidos dos esquemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// Esquema dinâmico baseado no modo (login/signup)
export const getAuthSchema = (isLogin: boolean) => {
  return isLogin ? loginSchema : signupSchema;
};

// Tipo união para os dados do formulário
export type AuthFormData = LoginFormData | SignupFormData;