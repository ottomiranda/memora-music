import { z } from 'zod';
import OpenAI from 'openai';
// Usar fetch nativo do Node.js 18+ em vez de node-fetch
const fetchWithTimeout = async (url, options = {}) => {
    const { timeout = 30000, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    }
    catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};
// Validação dos dados do formulário com Zod - Schema flexível para wizard em duas etapas
const generatePreviewSchema = z.object({
    // Campos do briefing (obrigatórios para ambas as etapas)
    occasion: z.string().min(1, "Ocasião é obrigatória"),
    recipientName: z.string().min(1, "Nome do destinatário é obrigatório"),
    relationship: z.string().min(1, "Relação é obrigatória"),
    senderName: z.string().min(1, "Seu nome é obrigatório"),
    hobbies: z.string().optional(),
    qualities: z.string().optional(),
    uniqueTraits: z.string().optional(),
    memories: z.string().optional(),
    // Campos que serão usados na Etapa 2 (agora opcionais)
    songTitle: z.string().optional(),
    emotionalTone: z.string().optional(),
    genre: z.string().optional(),
    mood: z.string().optional(),
    tempo: z.string().optional(),
    duration: z.string().default("3:00"), // Definimos um padrão
    // Flag de controle
    lyricsOnly: z.boolean().optional(),
    // Campos adicionais que podem existir
    personalMessage: z.string().optional(),
    vocalPreference: z.string().optional(),
    instruments: z.array(z.string()).optional(),
    specialMemories: z.string().optional(),
    emotion: z.string().optional(),
    lyrics: z.string().optional()
});
// Inicializar cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
// Configuração da API da Suno
const SUNO_API_BASE = 'https://api.sunoapi.org/api/v1';
const SUNO_API_KEY = process.env.SUNO_API_KEY;
// Classe para integração com Suno API
class SunoAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = SUNO_API_BASE;
    }
    async generateMusic(options) {
        // Adicionar callBackUrl obrigatório para a API Suno
        const requestBody = {
            ...options,
            callBackUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
        };
        // === LOGS DE DEPURAÇÃO DETALHADOS ===
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
        console.log('[DEBUG SUNO] Headers que serão enviados:', headers);
        console.log('[DEBUG SUNO] URL da requisição:', `${this.baseUrl}/generate`);
        console.log('[DEBUG SUNO] Body da requisição:', JSON.stringify(requestBody, null, 2));
        console.log('[DEBUG SUNO] Método:', 'POST');
        const response = await fetchWithTimeout(`${this.baseUrl}/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        }, 30000);
        // === LOGS DE RESPOSTA DA API SUNO ===
        console.log('[DEBUG SUNO] Status da resposta:', response.status);
        console.log('[DEBUG SUNO] Status text:', response.statusText);
        console.log('[DEBUG SUNO] Headers da resposta:', Object.fromEntries(response.headers.entries()));
        const result = await response.json();
        console.log('[DEBUG SUNO] Resposta completa da API:', JSON.stringify(result, null, 2));
        if (result.code !== 200) {
            console.log('[DEBUG SUNO] ❌ Erro na API Suno:');
            console.log('  - Code:', result.code);
            console.log('  - Message:', result.msg);
            console.log('  - Data:', result.data);
            // Verificar se é erro de autenticação
            if (response.status === 401 || response.status === 403) {
                throw new Error(`Erro de autenticação com a API Suno: ${result.msg || 'Chave de API inválida ou sem permissões'}`);
            }
            throw new Error(`Geração falhou: ${result.msg}`);
        }
        console.log('[DEBUG SUNO] ✅ Geração iniciada com sucesso. TaskId:', result.data.taskId);
        return result.data.taskId;
    }
    async getTaskStatus(taskId) {
        const response = await fetchWithTimeout(`${this.baseUrl}/generate/record-info?taskId=${taskId}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        }, 30000);
        const result = await response.json();
        if (result.code !== 200) {
            throw new Error(`Erro ao verificar status: ${result.msg}`);
        }
        return result.data;
    }
    async waitForCompletion(taskId, maxWaitTime = 600000) {
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitTime) {
            const status = await this.getTaskStatus(taskId);
            if (status.status === 'SUCCESS') {
                return status.response;
            }
            else if (status.status === 'FAILED') {
                throw new Error(`Geração falhou: ${status.errorMessage || 'Erro desconhecido'}`);
            }
            // Aguardar 30 segundos antes de verificar novamente
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
        throw new Error('Timeout na geração da música');
    }
}
// Inicializar cliente Suno
const sunoClient = new SunoAPI(SUNO_API_KEY || '');
// Função auxiliar para fetch com retry e logs detalhados
async function fetchWithRetry(url, options, maxRetries = 3) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[FETCH RETRY] Tentativa ${attempt}/${maxRetries} para: ${url}`);
            const response = await fetchWithTimeout(url, options, 30000);
            // Se a resposta for bem-sucedida, retornar
            if (response.ok || response.status < 500) {
                console.log(`[FETCH RETRY] ✅ Sucesso na tentativa ${attempt}`);
                return response;
            }
            // Se for erro 5xx, tentar novamente
            console.log(`[FETCH RETRY] ❌ Erro ${response.status} na tentativa ${attempt}`);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        catch (error) {
            console.log(`[FETCH RETRY] ❌ Erro de conectividade na tentativa ${attempt}:`);
            const errorObj = error;
            console.log(`  - Tipo: ${errorObj?.constructor?.name || 'Unknown'}`);
            console.log(`  - Mensagem: ${errorObj?.message || 'Mensagem não disponível'}`);
            console.log(`  - Code: ${errorObj?.code || 'N/A'}`);
            console.log(`  - Errno: ${errorObj?.errno || 'N/A'}`);
            console.log(`  - Syscall: ${errorObj?.syscall || 'N/A'}`);
            // Diagnóstico específico do erro
            if (errorObj?.code === 'ENOTFOUND') {
                console.log(`  - 🔍 DIAGNÓSTICO: Erro de DNS - não foi possível resolver ${url}`);
            }
            else if (errorObj?.code === 'ECONNREFUSED') {
                console.log(`  - 🔍 DIAGNÓSTICO: Conexão recusada - servidor não está respondendo`);
            }
            else if (errorObj?.code === 'ETIMEDOUT') {
                console.log(`  - 🔍 DIAGNÓSTICO: Timeout de conexão`);
            }
            else if (errorObj?.message?.includes('certificate') || errorObj?.message?.includes('SSL') || errorObj?.message?.includes('TLS')) {
                console.log(`  - 🔍 DIAGNÓSTICO: Erro de certificado SSL/TLS`);
            }
            else if (errorObj?.message?.includes('fetch failed')) {
                console.log(`  - 🔍 DIAGNÓSTICO: Falha geral do fetch - pode ser firewall, proxy ou conectividade`);
            }
            lastError = error instanceof Error ? error : new Error(String(error));
        }
        // Se não for a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000; // Backoff exponencial
            console.log(`[FETCH RETRY] ⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    // Se chegou aqui, todas as tentativas falharam
    console.log(`[FETCH RETRY] ❌ Todas as ${maxRetries} tentativas falharam`);
    throw lastError || new Error('Falha em todas as tentativas de fetch');
}
// Função auxiliar para criar prompt da Etapa 1 (apenas letra e título)
function createLyricsAndTitlePrompt(data) {
    return `
Você é um compositor. Baseado no briefing a seguir, crie um título e a letra para uma música.
Responda EXATAMENTE no seguinte formato, sem explicações:
[TÍTULO]: Título da Música Aqui
[LETRA]:
(Verso 1)
...
(Refrão)
...

Briefing:
- Ocasião: ${data.occasion}
- Para: ${data.recipientName} (Relação: ${data.relationship})
- De: ${data.senderName}
- Detalhes: Hobbies (${data.hobbies}), Qualidades (${data.qualities}), Traços únicos (${data.uniqueTraits}).
- Memória principal: ${data.memories}
`;
}
// Função auxiliar para extrair título e letra da resposta da IA
function parseAIResponse(responseText) {
    if (!responseText)
        return { songTitle: "Erro na Geração", lyrics: "A IA não retornou conteúdo." };
    const titleMatch = responseText.match(/\[TÍTULO\]:\s*(.*)/);
    const lyricsMatch = responseText.match(/\[LETRA\]:\s*([\s\S]*)/);
    const songTitle = titleMatch ? titleMatch[1].trim() : "Título Gerado Automaticamente";
    const lyrics = lyricsMatch ? lyricsMatch[1].trim() : responseText; // Fallback
    return { songTitle, lyrics };
}
// Função para gerar prompt detalhado para o ChatGPT (mantida para compatibilidade)
function createLyricsPrompt(data) {
    return `Você é um compositor experiente da "Memora.music", especializado em criar letras de música personalizadas e emocionantes.

Crie uma letra de música única e tocante com base nas seguintes informações:

**INFORMAÇÕES PESSOAIS:**
- Título da música: ${data.songTitle || 'A definir'}
- Destinatário: ${data.recipientName}
- Ocasião: ${data.occasion}
- Relacionamento: ${data.relationship}
- Tom emocional desejado: ${data.emotionalTone || 'Emotivo'}
- Memórias especiais: ${data.specialMemories || data.memories || 'Não especificado'}
- Mensagem pessoal: ${data.personalMessage || 'Não especificado'}
- Remetente: ${data.senderName || 'Não especificado'}
- Hobbies: ${data.hobbies || 'Não especificado'}
- Qualidades: ${data.qualities || 'Não especificado'}
- Traços únicos: ${data.uniqueTraits || 'Não especificado'}

**ESTILO MUSICAL:**
- Gênero: ${data.genre || 'Pop'}
- Humor/Atmosfera: ${data.mood || 'Alegre'}
- Tempo: ${data.tempo || 'Moderado'}
- Duração aproximada: ${data.duration}
- Instrumentos: ${data.instruments?.join(', ') || 'Não especificado'}

**INSTRUÇÕES:**
1. Crie uma letra original, emotiva e personalizada
2. Use o tom emocional ${data.emotionalTone || 'emotivo'} como guia principal
3. Incorpore as memórias e mensagens pessoais de forma natural
4. Adapte o estilo de escrita ao gênero ${data.genre || 'pop'}
5. A letra deve ser adequada para a ocasião: ${data.occasion}
6. Mantenha o foco no relacionamento ${data.relationship}

**FORMATO DE RESPOSTA:**
Retorne APENAS a letra da música, sem comentários adicionais, explicações ou formatação extra. A letra deve estar pronta para ser cantada.`;
}
// Função para processar tarefa em background
async function processTaskInBackground(taskId) {
    console.log(`🎵 Iniciando processamento em background para taskId: ${taskId}`);
    const task = global.musicTasks?.get(taskId);
    if (!task) {
        console.log(`❌ Tarefa ${taskId} não encontrada`);
        return;
    }
    const maxAttempts = 45;
    const initialWait = 10000; // 10 segundos
    const pollInterval = 7000; // 7 segundos entre tentativas
    try {
        // Esperar 10 segundos antes da primeira verificação
        console.log(`🎵 [${taskId}] Aguardando 10 segundos antes da primeira verificação...`);
        await new Promise(resolve => setTimeout(resolve, initialWait));
        let attempts = 0;
        while (attempts < maxAttempts && task.status === 'PROCESSING') {
            attempts++;
            console.log(`🎵 [${taskId}] Tentativa ${attempts}/${maxAttempts} - Verificando status dos jobs...`);
            try {
                const statusResponse = await fetchWithRetry(`${SUNO_API_BASE}/generate/record-info?taskId=${task.idsString}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }, 2);
                if (!statusResponse.ok) {
                    const errorText = await statusResponse.text();
                    console.log(`❌ [${taskId}] Erro na verificação de status (tentativa ${attempts}):`, statusResponse.status, errorText);
                    // Se não for a última tentativa, continuar
                    if (attempts < maxAttempts) {
                        console.log(`🎵 [${taskId}] Continuando para próxima tentativa...`);
                        await new Promise(resolve => setTimeout(resolve, pollInterval));
                        continue;
                    }
                    else {
                        throw new Error(`Erro na verificação de status: ${statusResponse.status} - ${errorText}`);
                    }
                }
                const statusData = await statusResponse.json();
                console.log(`✅ [${taskId}] Status dos jobs (tentativa ${attempts}):`, JSON.stringify(statusData, null, 2));
                // Verificar a estrutura da resposta da Suno API
                if (!statusData.data) {
                    console.log(`❌ [${taskId}] Resposta de status inválida: campo data ausente`);
                    throw new Error('Resposta de status inválida: campo data ausente');
                }
                const jobData = statusData.data;
                console.log(`🎵 [${taskId}] Status do job:`, jobData.status);
                // Verificar se o job está completo
                if ((jobData.status === 'SUCCESS' || jobData.status === 'FIRST_SUCCESS') && jobData.response) {
                    // Job completo - extrair os dados dos clipes
                    const jobsArray = Array.isArray(jobData.response) ? jobData.response : [jobData.response];
                    console.log(`🎵 [${taskId}] Job completo! Dados extraídos:`, JSON.stringify(jobsArray, null, 2));
                    // Processar novos clipes
                    const newAudioClips = [];
                    jobsArray.forEach((job, jobIndex) => {
                        if (job.sunoData && Array.isArray(job.sunoData)) {
                            job.sunoData.forEach((clip, clipIndex) => {
                                if (clip.audioUrl || clip.sourceAudioUrl) {
                                    const clipId = clip.id || `clip_${jobIndex}_${clipIndex}`;
                                    // Verificar se este clipe já foi processado
                                    const existingClip = task.audioClips.find((existing) => existing.id === clipId);
                                    if (!existingClip) {
                                        const newClip = {
                                            id: clipId,
                                            title: clip.title || `${task.metadata.songTitle} - Opção ${task.audioClips.length + newAudioClips.length + 1}`,
                                            audio_url: clip.audioUrl || clip.sourceAudioUrl,
                                            image_url: clip.imageUrl || clip.sourceImageUrl
                                        };
                                        newAudioClips.push(newClip);
                                        console.log(`🎵 [${taskId}] Novo clipe encontrado:`, newClip.title);
                                    }
                                }
                            });
                        }
                    });
                    // Atualizar tarefa com novos clipes
                    if (newAudioClips.length > 0) {
                        task.audioClips.push(...newAudioClips);
                        task.completedClips = task.audioClips.length;
                        task.lastUpdate = Date.now();
                        console.log(`✅ [${taskId}] ${newAudioClips.length} novos clipes adicionados. Total: ${task.audioClips.length}`);
                    }
                    // Verificar se todas as músicas estão prontas
                    if (task.audioClips.length >= task.totalExpected) {
                        task.status = 'COMPLETED';
                        task.metadata.totalClips = task.audioClips.length;
                        task.metadata.processingTime = `${attempts} tentativas`;
                        console.log(`🎉 [${taskId}] Todas as músicas foram processadas!`);
                        break;
                    }
                }
                else if (jobData.status === 'PENDING' || jobData.status === 'PROCESSING') {
                    console.log(`⏳ [${taskId}] Job ainda em processamento, continuando polling...`);
                }
                else {
                    console.log(`⚠️ [${taskId}] Status do job não reconhecido:`, jobData.status);
                }
            }
            catch (error) {
                console.log(`❌ [${taskId}] Erro na tentativa ${attempts}:`, error.message);
                // Se não for a última tentativa, continuar
                if (attempts < maxAttempts) {
                    console.log(`🎵 [${taskId}] Continuando para próxima tentativa após erro...`);
                }
                else {
                    throw error;
                }
            }
            // Aguardar antes da próxima tentativa (se não for a última)
            if (attempts < maxAttempts && task.status === 'PROCESSING') {
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }
        // Verificar se conseguimos obter pelo menos alguns resultados
        if (task.status === 'PROCESSING') {
            if (task.audioClips.length > 0) {
                // Temos pelo menos algumas músicas, marcar como parcialmente completo
                task.status = 'PARTIAL';
                task.metadata.totalClips = task.audioClips.length;
                task.metadata.processingTime = `${attempts} tentativas (parcial)`;
                console.log(`⚠️ [${taskId}] Timeout, mas ${task.audioClips.length} músicas foram processadas`);
            }
            else {
                // Nenhuma música foi processada
                task.status = 'FAILED';
                task.error = `Timeout: A geração da música está demorando mais que o esperado. Por favor, tente novamente mais tarde.`;
                console.log(`❌ [${taskId}] Timeout: Nenhuma música foi processada após ${maxAttempts} tentativas`);
            }
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.log(`❌ [${taskId}] Erro no processamento em background:`, errorMessage);
        task.status = 'FAILED';
        task.error = errorMessage;
    }
}
export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-guest-id');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    try {
        // ---> PASSO DE DEBUG: Log do payload recebido <---
        console.log('\n=== DEBUG GENERATE PREVIEW ENDPOINT ===');
        console.log('🔍 Timestamp:', new Date().toISOString());
        console.log('🔍 Method:', req.method);
        console.log('🔍 URL:', req.url);
        console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
        console.log('🔍 Body completo recebido:', JSON.stringify(req.body, null, 2));
        console.log('🔍 Tipo do body:', typeof req.body);
        console.log('🔍 Keys do body:', Object.keys(req.body || {}));
        // Verificar campos específicos importantes
        const importantFields = ['songTitle', 'recipientName', 'occasion', 'relationship', 'emotionalTone', 'genre', 'mood', 'tempo', 'duration', 'lyricsOnly'];
        console.log('🔍 Campos importantes:');
        importantFields.forEach(field => {
            const value = req.body?.[field];
            console.log(`  - ${field}: ${JSON.stringify(value)} (${typeof value})`);
        });
        if (req.method === 'POST') {
            // Validar dados de entrada
            console.log('🔍 Iniciando validação com Zod...');
            const validationResult = generatePreviewSchema.safeParse(req.body);
            if (!validationResult.success) {
                console.log('❌ Validação Zod falhou!');
                console.log('❌ Erros de validação:', JSON.stringify(validationResult.error.errors, null, 2));
                // Criar mensagem de erro mais detalhada
                const errorDetails = validationResult.error.errors.map(err => {
                    return `Campo '${err.path.join('.')}': ${err.message}`;
                }).join('; ');
                console.log('❌ Mensagem de erro formatada:', errorDetails);
                return res.status(400).json({
                    success: false,
                    error: 'Dados do formulário inválidos',
                    details: validationResult.error.errors,
                    message: errorDetails
                });
            }
            console.log('✅ Validação Zod passou com sucesso!');
            const formData = validationResult.data;
            const lyricsOnly = req.body.lyricsOnly === true;
            console.log('🔍 FormData validado:', JSON.stringify(formData, null, 2));
            console.log('🔍 LyricsOnly flag:', lyricsOnly);
            console.log('🔍 Modo de operação:', lyricsOnly ? 'APENAS LETRAS' : 'LETRA + ÁUDIO');
            if (lyricsOnly) {
                console.log('✅ Modo lyricsOnly: Gerando letra e título...');
                if (!process.env.OPENAI_API_KEY) {
                    console.log('❌ OpenAI API Key não configurada!');
                    return res.status(500).json({
                        success: false,
                        error: 'Configuração da API OpenAI não encontrada'
                    });
                }
                const prompt = createLyricsAndTitlePrompt(formData);
                const aiResponse = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 1000,
                    temperature: 0.7,
                });
                const content = aiResponse.choices[0].message.content;
                const { songTitle, lyrics } = parseAIResponse(content);
                console.log(`🎶 Título Gerado: ${songTitle}`);
                console.log(`📝 Letra Gerada: ${lyrics.substring(0, 100)}...`);
                return res.json({ success: true, songTitle, lyrics });
            }
            else {
                // Verificar se as chaves de API estão configuradas
                console.log('🔍 Verificando configurações de API...');
                console.log('🔍 OpenAI API Key presente:', !!process.env.OPENAI_API_KEY);
                console.log('🔍 Suno API Key presente:', !!process.env.SUNO_API_KEY);
                if (!process.env.OPENAI_API_KEY) {
                    console.log('❌ OpenAI API Key não configurada!');
                    return res.status(500).json({
                        success: false,
                        error: 'Configuração da API OpenAI não encontrada'
                    });
                }
                if (!process.env.SUNO_API_KEY) {
                    console.log('❌ Suno API Key não configurada para geração de áudio!');
                    return res.status(500).json({
                        success: false,
                        error: 'Configuração da API Suno não encontrada'
                    });
                }
                console.log('✅ Configurações de API verificadas com sucesso!');
                // Gerar letra com OpenAI
                console.log('🎵 Iniciando geração de letra com OpenAI...');
                const prompt = createLyricsPrompt(formData);
                console.log('🎵 Prompt criado para OpenAI:');
                console.log('---START PROMPT---');
                console.log(prompt);
                console.log('---END PROMPT---');
                console.log('🎵 Fazendo chamada para OpenAI...');
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: 'Você é um compositor profissional especializado em criar letras de música personalizadas e emocionais.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.8
                });
                console.log('🎵 Resposta completa da OpenAI:', JSON.stringify(completion, null, 2));
                const lyrics = completion.choices[0]?.message?.content;
                console.log('🎵 Letra extraída:', lyrics);
                console.log('🎵 Tamanho da letra:', lyrics?.length || 0, 'caracteres');
                console.log('=== RESPOSTA DA OPENAI ===');
                console.log('Prompt enviado:', prompt.substring(0, 200) + '...');
                console.log('Letra gerada:', lyrics?.substring(0, 300) + '...');
                console.log('Tokens usados:', completion.usage?.total_tokens);
                console.log('========================');
                if (!lyrics) {
                    return res.status(500).json({
                        success: false,
                        error: 'Não foi possível gerar a letra da música. Tente novamente.'
                    });
                }
                // === PARTE A: INICIAR GERAÇÃO COM SUNO API ===
                console.log('🎵 Iniciando geração assíncrona com Suno AI...');
                // === LOGS DE DEPURAÇÃO SUNO API ===
                console.log(`[DEBUG SUNO] Tentando autenticar com a chave que termina em: ...${process.env.SUNO_API_KEY?.slice(-4)}`);
                console.log('[DEBUG SUNO] SUNO_API_KEY está definida:', !!process.env.SUNO_API_KEY);
                console.log('[DEBUG SUNO] Tamanho da chave:', process.env.SUNO_API_KEY?.length || 0);
                console.log('[DEBUG SUNO] Base URL da Suno:', SUNO_API_BASE);
                // Preparar parâmetros para chamada da API oficial da Suno
                const style = `${formData.genre}, ${formData.mood}, ${formData.vocalPreference || 'male'} vocals`;
                const generatePayload = {
                    prompt: lyrics,
                    style: style,
                    title: formData.songTitle,
                    customMode: true,
                    instrumental: false,
                    model: 'V4_5PLUS', // Modelo V4_5PLUS "Advanced" conforme documentação oficial
                    callBackUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/suno-callback` // URL de callback obrigatória
                };
                console.log('[DEBUG SUNO] Payload para API oficial:');
                console.log('  - prompt:', lyrics.substring(0, 100) + '...');
                console.log('  - style:', style);
                console.log('  - title:', formData.songTitle);
                console.log('  - customMode:', generatePayload.customMode);
                console.log('  - instrumental:', generatePayload.instrumental);
                console.log('  - model:', generatePayload.model);
                // Fazer chamada POST para API oficial da Suno com retry logic
                console.log('🎵 Fazendo chamada POST para /generate...');
                // ---> PASSO 1 DE DEBUG: Logar o que estamos enviando
                console.log('[DEBUG SUNO] Enviando payload para /generate:', JSON.stringify(generatePayload, null, 2));
                console.log('[DEBUG SUNO] Modelo utilizado: chirp-bluejay (V4_5PLUS)');
                const generateResponse = await fetchWithRetry(`${SUNO_API_BASE}/generate`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(generatePayload)
                }, 3);
                if (!generateResponse.ok) {
                    const errorText = await generateResponse.text();
                    console.log('❌ Erro na chamada /generate:', generateResponse.status, errorText);
                    throw new Error(`Erro na geração Suno: ${generateResponse.status} - ${errorText}`);
                }
                const responseBodyText = await generateResponse.text();
                // ---> PASSO 2 DE DEBUG: Logar a resposta bruta que recebemos
                console.log('[DEBUG SUNO] Resposta bruta do /generate:', responseBodyText);
                // Tente fazer o parse do JSON APÓS logar o texto
                const generateData = JSON.parse(responseBodyText);
                console.log('✅ Resposta do /generate:', JSON.stringify(generateData, null, 2));
                // Verificar se a resposta tem o formato esperado da Suno API
                if (!generateData || typeof generateData !== 'object') {
                    throw new Error('Resposta inválida do /generate: formato inesperado');
                }
                // A Suno API retorna: {"code":200,"msg":"success","data":{"taskId":"..."}}
                if (generateData.code !== 200 || !generateData.data) {
                    throw new Error(`Erro da Suno API: ${generateData.msg || 'Resposta inválida'}`);
                }
                // Extrair taskId da resposta
                const taskId = generateData.data.taskId;
                if (!taskId) {
                    throw new Error('TaskId não encontrado na resposta da Suno API');
                }
                console.log('🎵 TaskId extraído:', taskId);
                // Para o polling, usaremos o taskId
                const jobIds = [taskId];
                console.log('🎵 IDs dos jobs extraídos:', jobIds);
                if (jobIds.length === 0) {
                    throw new Error('Nenhum ID de job válido encontrado na resposta');
                }
                // === PARTE B: MONITORAR (POLLING) OS JOBS ===
                console.log('🎵 Iniciando monitoramento dos jobs...');
                // Juntar IDs em string separada por vírgula
                const idsString = jobIds.join(',');
                console.log('🎵 String de IDs para polling:', idsString);
                // Gerar taskId único para este processo
                const backgroundTaskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                console.log('🎵 TaskId gerado:', backgroundTaskId);
                // Armazenar informações da tarefa em memória (em produção, usar Redis ou DB)
                if (!global.musicTasks) {
                    global.musicTasks = new Map();
                }
                // Inicializar tarefa
                global.musicTasks.set(backgroundTaskId, {
                    status: 'PROCESSING',
                    jobIds: jobIds,
                    idsString: idsString,
                    audioClips: [],
                    completedClips: 0,
                    totalExpected: 2, // Esperamos 2 músicas
                    lyrics: lyrics.trim(),
                    metadata: {
                        songTitle: formData.songTitle,
                        recipientName: formData.recipientName,
                        occasion: formData.occasion,
                        genre: formData.genre,
                        duration: formData.duration,
                        model: 'V4_5PLUS'
                    },
                    startTime: Date.now(),
                    lastUpdate: Date.now()
                });
                // Iniciar processamento em background
                processTaskInBackground(backgroundTaskId);
                // Retornar taskId imediatamente
                res.status(200).json({
                    success: true,
                    taskId: backgroundTaskId,
                    status: 'PROCESSING',
                    message: 'Geração iniciada. Use o taskId para verificar o progresso.',
                    expectedClips: 2
                });
            }
        }
        else {
            return res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }
    }
    catch (error) {
        console.log('\n❌ === ERRO CAPTURADO NO ENDPOINT ===');
        console.log('❌ Timestamp:', new Date().toISOString());
        const errorObj = error;
        console.log('❌ Tipo do erro:', typeof error);
        console.log('❌ Nome do erro:', errorObj?.constructor?.name);
        console.log('❌ Mensagem:', errorObj?.message);
        console.log('❌ Stack trace:', errorObj?.stack);
        // Logs específicos para erros de rede/conectividade
        if (errorObj?.code) {
            console.log('❌ Código do erro:', errorObj.code);
            console.log('❌ Errno:', errorObj.errno);
            console.log('❌ Syscall:', errorObj.syscall);
            console.log('❌ Hostname:', errorObj.hostname);
            // Diagnóstico detalhado baseado no código de erro
            switch (errorObj.code) {
                case 'ENOTFOUND':
                    console.log('🔍 DIAGNÓSTICO: Erro de DNS - Verifique:');
                    console.log('  - Conectividade com a internet');
                    console.log('  - Configurações de DNS');
                    console.log('  - Se o domínio suno-api.suno.ai está acessível');
                    break;
                case 'ECONNREFUSED':
                    console.log('🔍 DIAGNÓSTICO: Conexão recusada - Verifique:');
                    console.log('  - Se o servidor está online');
                    console.log('  - Configurações de firewall');
                    console.log('  - Se a porta está correta');
                    break;
                case 'ETIMEDOUT':
                    console.log('🔍 DIAGNÓSTICO: Timeout - Verifique:');
                    console.log('  - Velocidade da conexão');
                    console.log('  - Configurações de proxy');
                    console.log('  - Latência da rede');
                    break;
                case 'CERT_HAS_EXPIRED':
                case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
                case 'SELF_SIGNED_CERT_IN_CHAIN':
                    console.log('🔍 DIAGNÓSTICO: Erro de certificado SSL/TLS - Verifique:');
                    console.log('  - Versão do Node.js (recomendado: v18+)');
                    console.log('  - Certificados do sistema');
                    console.log('  - Configurações de SSL');
                    break;
                default:
                    console.log('🔍 DIAGNÓSTICO: Erro de rede não identificado');
            }
        }
        // Logs para erros de resposta HTTP
        if (errorObj?.response) {
            const response = errorObj.response;
            console.log('❌ Resposta da API externa:', JSON.stringify(response.data, null, 2));
            console.log('❌ Status da API externa:', response.status);
            console.log('❌ Headers da resposta:', response.headers);
        }
        // Log do erro completo para depuração
        console.log('❌ Erro completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        // Informações do ambiente
        console.log('🔧 INFORMAÇÕES DO AMBIENTE:');
        console.log('  - Node.js version:', process.version);
        console.log('  - Platform:', process.platform);
        console.log('  - Arch:', process.arch);
        console.log('  - SUNO_API_KEY definida:', !!process.env.SUNO_API_KEY);
        console.log('  - SUNO_API_BASE:', SUNO_API_BASE);
        console.log('❌ === FIM DO LOG DE ERRO ===\n');
        // Tratamento de erros específicos
        let errorMessage = 'Ocorreu um erro interno. Tente novamente em alguns instantes.';
        let statusCode = 500;
        if (error instanceof Error) {
            // Diagnóstico específico para erros de fetch/conectividade
            if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
                errorMessage = 'Erro de conectividade com a API de música - DNS não resolvido';
                statusCode = 502;
            }
            else if (error.message.includes('ECONNREFUSED')) {
                errorMessage = 'Erro de conectividade - conexão recusada pela API de música';
                statusCode = 502;
            }
            else if (error.message.includes('ETIMEDOUT')) {
                errorMessage = 'Timeout na conexão com a API de música';
                statusCode = 504;
            }
            else if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
                errorMessage = 'Erro de certificado SSL/TLS na API de música';
                statusCode = 502;
            }
            else if (error.message.includes('OpenAI')) {
                errorMessage = 'Não foi possível contactar o nosso compositor de IA. Tente novamente.';
            }
            else if (error.message.includes('Geração falhou')) {
                errorMessage = 'Falha na geração da música';
                statusCode = 422;
            }
            else if (error.message.includes('Timeout')) {
                errorMessage = 'Tempo limite excedido na geração da música';
                statusCode = 408;
            }
            else if (error.message.includes('Authorization')) {
                errorMessage = 'Erro de autenticação com a API Suno';
                statusCode = 401;
            }
            else if (error.message.includes('Suno')) {
                errorMessage = 'Não foi possível gerar a música. Tente novamente.';
            }
        }
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString()
        });
    }
}
//# sourceMappingURL=generate-preview.js.map