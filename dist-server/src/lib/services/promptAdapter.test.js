import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPromptAdapter, generatePrompt, validatePromptOptions } from './promptAdapter';
import { AppError } from '@/types/app';
// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;
// Mock do logger
vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn()
    }
}));
describe('promptAdapter', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });
    describe('validatePromptOptions', () => {
        it('deve retornar opções padrão quando nenhuma opção é fornecida', () => {
            const options = validatePromptOptions({});
            expect(options).toEqual({
                temperature: 0.7,
                maxTokens: 1000,
                stopSequences: [],
                provider: 'openai',
                model: 'gpt-3.5-turbo',
                stream: false
            });
        });
        it('deve lançar erro para temperatura inválida', () => {
            expect(() => validatePromptOptions({ temperature: 1.5 }))
                .toThrow(AppError);
            expect(() => validatePromptOptions({ temperature: -0.5 }))
                .toThrow(AppError);
        });
        it('deve lançar erro para maxTokens inválido', () => {
            expect(() => validatePromptOptions({ maxTokens: 0 }))
                .toThrow(AppError);
            expect(() => validatePromptOptions({ maxTokens: 5000 }))
                .toThrow(AppError);
        });
    });
    describe('OpenAIAdapter', () => {
        const mockApiKey = 'test-api-key';
        const mockOptions = {
            temperature: 0.5,
            maxTokens: 100,
            model: 'gpt-3.5-turbo'
        };
        it('deve gerar prompt com sucesso', async () => {
            const mockResponse = {
                text: 'Generated text',
                usage: {
                    promptTokens: 10,
                    completionTokens: 20,
                    totalTokens: 30
                },
                provider: 'openai',
                model: 'gpt-3.5-turbo'
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: mockResponse.text } }],
                    usage: {
                        prompt_tokens: mockResponse.usage?.promptTokens,
                        completion_tokens: mockResponse.usage?.completionTokens,
                        total_tokens: mockResponse.usage?.totalTokens
                    }
                })
            });
            const adapter = createPromptAdapter('openai', mockApiKey, mockOptions);
            const result = await adapter.generatePrompt('Test input');
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mockApiKey}`
                }
            }));
        });
        it('deve incluir contexto no prompt OpenAI', async () => {
            const context = {
                systemPrompt: 'You are a helpful assistant',
                messages: [
                    { role: 'user', content: 'Hello' },
                    { role: 'assistant', content: 'Hi there!' }
                ]
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: 'Response with context' } }],
                    usage: {
                        prompt_tokens: 10,
                        completion_tokens: 20,
                        total_tokens: 30
                    }
                })
            });
            const adapter = createPromptAdapter('openai', mockApiKey);
            await adapter.generatePrompt('Test input', context);
            const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(requestBody.messages).toEqual([
                { role: 'system', content: context.systemPrompt },
                ...context.messages,
                { role: 'user', content: 'Test input' }
            ]);
        });
        it('deve tratar erro da API OpenAI', async () => {
            const errorResponse = {
                error: {
                    message: 'API error',
                    type: 'invalid_request_error'
                }
            };
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve(errorResponse)
            });
            const adapter = createPromptAdapter('openai', mockApiKey);
            await expect(adapter.generatePrompt('Test input'))
                .rejects
                .toThrow(AppError);
        });
    });
    describe('AnthropicAdapter', () => {
        const mockApiKey = 'test-api-key';
        const mockOptions = {
            temperature: 0.5,
            maxTokens: 100,
            model: 'claude-2'
        };
        it('deve gerar prompt com sucesso', async () => {
            const mockResponse = {
                text: 'Generated text',
                provider: 'anthropic',
                model: 'claude-2'
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    completion: mockResponse.text
                })
            });
            const adapter = createPromptAdapter('anthropic', mockApiKey, mockOptions);
            const result = await adapter.generatePrompt('Test input');
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/complete', expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': mockApiKey
                }
            }));
        });
        it('deve incluir contexto no prompt Anthropic', async () => {
            const context = {
                systemPrompt: 'You are a helpful assistant',
                messages: [
                    { role: 'user', content: 'Hello' },
                    { role: 'assistant', content: 'Hi there!' }
                ]
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    completion: 'Response with context'
                })
            });
            const adapter = createPromptAdapter('anthropic', mockApiKey);
            await adapter.generatePrompt('Test input', context);
            const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(requestBody.prompt).toContain(context.systemPrompt);
            expect(requestBody.prompt).toContain('user: Hello');
            expect(requestBody.prompt).toContain('assistant: Hi there!');
            expect(requestBody.prompt).toContain('Test input');
        });
        it('deve tratar erro da API Anthropic', async () => {
            const errorResponse = {
                error: {
                    message: 'API error',
                    type: 'invalid_request'
                }
            };
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve(errorResponse)
            });
            const adapter = createPromptAdapter('anthropic', mockApiKey);
            await expect(adapter.generatePrompt('Test input'))
                .rejects
                .toThrow(AppError);
        });
    });
    describe('generatePrompt helper', () => {
        it('deve gerar prompt usando o adaptador correto', async () => {
            const mockResponse = {
                text: 'Generated text',
                provider: 'openai',
                model: 'gpt-3.5-turbo'
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: mockResponse.text } }],
                    usage: {
                        prompt_tokens: 10,
                        completion_tokens: 20,
                        total_tokens: 30
                    }
                })
            });
            const result = await generatePrompt('Test input', 'openai', 'test-api-key', { temperature: 0.5 });
            expect(result.text).toBe(mockResponse.text);
            expect(result.provider).toBe('openai');
        });
        it('deve passar contexto para o adaptador', async () => {
            const context = {
                systemPrompt: 'You are a helpful assistant',
                messages: [
                    { role: 'user', content: 'Hello' },
                    { role: 'assistant', content: 'Hi there!' }
                ]
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: 'Response with context' } }],
                    usage: {
                        prompt_tokens: 10,
                        completion_tokens: 20,
                        total_tokens: 30
                    }
                })
            });
            await generatePrompt('Test input', 'openai', 'test-api-key', { temperature: 0.5 }, context);
            const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(requestBody.messages).toEqual([
                { role: 'system', content: context.systemPrompt },
                ...context.messages,
                { role: 'user', content: 'Test input' }
            ]);
        });
        it('deve lançar erro para provedor inválido', () => {
            expect(() => generatePrompt('Test input', 'invalid', 'test-api-key')).rejects.toThrow(AppError);
        });
    });
});
//# sourceMappingURL=promptAdapter.test.js.map