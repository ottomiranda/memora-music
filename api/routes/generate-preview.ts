import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { SongService } from '../../src/lib/services/songService.js';
import { createClient } from '@supabase/supabase-js';

// Função para obter cliente Supabase
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

const router = express.Router();

// Validação dos dados do formulário com Zod - Schema flexível para wizard em duas etapas
const generatePreviewSchema = z.object({
  // Campos do briefing (obrigatórios para ambas as etapas)
  occasion: z.string().min(1, "Ocasião é obrigatória"),
  recipientName: z.string().min(1, "Nome do destinatário é obrigatório"),
  relationship: z.string().min(1, "Relação é obrigatória"),
  senderName: z.string().min(1, "Seu nome é obrigatório"),
  hobbies: z.string().min(1, "Hobbies são obrigatórios"),
  qualities: z.string().min(1, "Qualidades são obrigatórias"),
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

// Tipo inferido do schema para uso em TypeScript
type GenerateMusicPayload = z.infer<typeof generatePreviewSchema>;

// Função para obter cliente OpenAI (lazy initialization)
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não está configurada');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Configuração da API da Suno
const SUNO_API_BASE = 'https://api.sunoapi.org/api/v1';
const SUNO_API_KEY = process.env.SUNO_API_KEY;

// Classe para integração com Suno API
class SunoAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = SUNO_API_BASE;
  }

  async generateMusic(options: {
    prompt: string;
    customMode: boolean;
    style: string;
    title: string;
    instrumental: boolean;
    model: string;
  }) {
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

    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

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

  async getTaskStatus(taskId: string) {
    const response = await fetch(`${this.baseUrl}/generate/record-info?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(`Erro ao verificar status: ${result.msg}`);
    }
    
    return result.data;
  }

  async waitForCompletion(taskId: string, maxWaitTime = 600000) { // 10 minutos max
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getTaskStatus(taskId);
      
      if (status.status === 'SUCCESS') {
        return status.response;
      } else if (status.status === 'FAILED') {
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

// Função para salvamento automático de músicas no banco de dados
async function autoSaveSongToDatabase(task: Record<string, unknown>, userId?: string, guestId?: string) {
  try {
    // --- INÍCIO DA INSTRUMENTAÇÃO ---
    console.log(`[DB_SAVE] Iniciando salvamento para taskId: ${task.taskId}`);
    console.log(`[DB_SAVE] UserID: ${userId}, GuestID: ${guestId}`);
    console.log(`[DB_SAVE] Parâmetros recebidos:`, {
      taskId: task.taskId,
      userId: userId,
      guestId: guestId,
      hasAudioClips: !!task.audioClips,
      audioClipsLength: task.audioClips?.length || 0,
      hasMetadata: !!task.metadata
    });
    
    // Verificar se há clipes de áudio para salvar
    if (!task.audioClips || task.audioClips.length === 0) {
      console.log(`[DB_SAVE] ⚠️ Nenhum clipe de áudio encontrado para salvar - taskId: ${task.taskId}`);
      return;
    }
    
    // Preparar dados da música
    const songData = {
      userId: userId || null,
      guestId: guestId || null,
      title: task.metadata?.songTitle || 'Música Gerada',
      lyrics: task.lyrics || null,
      prompt: `Música para ${task.metadata?.recipientName} na ocasião: ${task.metadata?.occasion}. Relacionamento: ${task.metadata?.relationship}. Tom emocional: ${task.metadata?.emotionalTone}`,
      genre: task.metadata?.genre || null,
      mood: task.metadata?.mood || task.metadata?.emotionalTone || null,
      audioUrlOption1: task.audioClips[0]?.audio_url || null,
      audioUrlOption2: task.audioClips[1]?.audio_url || null,
      sunoTaskId: task.taskId
    };
    
    console.log('[DB_SAVE] Dados a serem inseridos:', songData);
    
    // Salvar no banco de dados
    const savedSong = await SongService.createSong(songData);
    
    if (!savedSong || !savedSong.id) {
      console.error(`[DB_SAVE_ERROR] Falha ao inserir música no DB para taskId ${task.taskId}: savedSong é null ou sem ID`);
      return; // Interrompe a função se o salvamento falhar
    }
    
    console.log(`[DB_SAVE] Música para taskId ${task.taskId} inserida com sucesso. ID: ${savedSong.id}`);
    
    // Lógica de incremento do paywall
    if (userId) {
      console.log(`[PAYWALL] Verificando e atualizando contador para userId: ${userId}`);
      
      try {
        const supabase = getSupabaseClient();
        
        // Primeiro, buscar o valor atual
        console.log(`[PAYWALL] Executando SELECT para buscar dados do usuário ${userId}`);
        const { data: userData, error: selectError } = await supabase
          .from('users')
          .select('freesongsused')
          .eq('id', userId)
          .single();
        
        if (selectError) {
          console.error(`[PAYWALL_ERROR] Falha ao buscar usuário ${userId}:`, selectError);
          return;
        }
        
        console.log(`[PAYWALL] Dados do usuário encontrados:`, userData);
        const currentCount = userData?.freesongsused || 0;
        console.log(`[PAYWALL] Contagem atual de músicas gratuitas: ${currentCount}`);
        
        // Incrementar o contador APENAS quando for a primeira música (currentCount === 0)
        if (currentCount === 0) {
          const newCount = currentCount + 1;
          console.log(`[PAYWALL] Primeira música detectada - incrementando contador para: ${newCount}`);
          
          console.log(`[PAYWALL] Executando UPDATE para usuário ${userId} com novo valor: ${newCount}`);
          const { error: updateError } = await supabase
            .from('users')
            .update({ freesongsused: newCount })
            .eq('id', userId);

          if (updateError) {
            console.error(`[PAYWALL_ERROR] Falha ao atualizar contador para usuário ${userId}:`, updateError);
          } else {
            console.log(`[PAYWALL] Contador para usuário ${userId} atualizado com sucesso de ${currentCount} para ${newCount}`);
          }
        } else {
          console.log(`[PAYWALL] Usuário ${userId} já tem ${currentCount} música(s) - não incrementando contador`);
        }


      } catch (error) {
        console.error(`[PAYWALL_ERROR] Erro geral ao atualizar contador de músicas para usuário ${userId}:`, error);
      }
    } else {
      console.log(`[PAYWALL] Usuário não logado (userId é null/undefined) - não incrementando contador`);
    }
    
    // Adicionar informação do salvamento à tarefa
    task.metadata.savedToDatabase = true;
    task.metadata.savedSongId = savedSong.id;
    console.log(`[DB_SAVE] Metadados da tarefa atualizados - savedToDatabase: true, savedSongId: ${savedSong.id}`);
    // --- FIM DA INSTRUMENTAÇÃO ---
    
  } catch (error) {
    console.error(`[DB_SAVE_ERROR] Erro geral ao salvar música no banco de dados para taskId ${task.taskId}:`, error.message);
    console.error(`[DB_SAVE_ERROR] Stack trace:`, error.stack);
    // Não interromper o fluxo principal em caso de erro no salvamento
    task.metadata.saveError = error.message;
  }
}

// Função auxiliar para fetch com retry e logs detalhados
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[FETCH RETRY] Tentativa ${attempt}/${maxRetries} para: ${url}`);
      
      const response = await fetch(url, options);
      
      // Se a resposta for bem-sucedida, retornar
      if (response.ok || response.status < 500) {
        console.log(`[FETCH RETRY] ✅ Sucesso na tentativa ${attempt}`);
        return response;
      }
      
      // Se for erro 5xx, tentar novamente
      console.log(`[FETCH RETRY] ❌ Erro ${response.status} na tentativa ${attempt}`);
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error: unknown) {
      console.log(`[FETCH RETRY] ❌ Erro de conectividade na tentativa ${attempt}:`);
      
      const errorObj = error as Record<string, unknown>;
      console.log(`  - Tipo: ${errorObj?.constructor?.name || 'Unknown'}`);
      console.log(`  - Mensagem: ${errorObj?.message || 'Mensagem não disponível'}`);
      console.log(`  - Code: ${errorObj?.code || 'N/A'}`);
      console.log(`  - Errno: ${errorObj?.errno || 'N/A'}`);
      console.log(`  - Syscall: ${errorObj?.syscall || 'N/A'}`);
      
      // Diagnóstico específico do erro
      if (errorObj?.code === 'ENOTFOUND') {
        console.log(`  - 🔍 DIAGNÓSTICO: Erro de DNS - não foi possível resolver ${url}`);
      } else if (errorObj?.code === 'ECONNREFUSED') {
        console.log(`  - 🔍 DIAGNÓSTICO: Conexão recusada - servidor não está respondendo`);
      } else if (errorObj?.code === 'ETIMEDOUT') {
        console.log(`  - 🔍 DIAGNÓSTICO: Timeout de conexão`);
      } else if (errorObj?.message?.includes('certificate') || errorObj?.message?.includes('SSL') || errorObj?.message?.includes('TLS')) {
        console.log(`  - 🔍 DIAGNÓSTICO: Erro de certificado SSL/TLS`);
      } else if (errorObj?.message?.includes('fetch failed')) {
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
function createLyricsAndTitlePrompt(data: z.infer<typeof generatePreviewSchema>): string {
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
function parseAIResponse(responseText: string | null): { songTitle: string, lyrics: string } {
  if (!responseText) return { songTitle: "Erro na Geração", lyrics: "A IA não retornou conteúdo." };

  const titleMatch = responseText.match(/\[TÍTULO\]:\s*(.*)/);
  const lyricsMatch = responseText.match(/\[LETRA\]:\s*([\s\S]*)/); 
  
  const songTitle = titleMatch ? titleMatch[1].trim() : "Título Gerado Automaticamente";
  const lyrics = lyricsMatch ? lyricsMatch[1].trim() : responseText; // Fallback
  
  return { songTitle, lyrics };
}

// Função para gerar prompt detalhado para o ChatGPT (mantida para compatibilidade)
function createLyricsPrompt(data: z.infer<typeof generatePreviewSchema>): string {
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

// Função para criar prompt para geração de música na Suno API
function createSunoMusicPrompt(data: z.infer<typeof generatePreviewSchema>, lyrics: string): string {
  const instrumentsText = data.instruments && data.instruments.length > 0 
    ? ` com ${data.instruments.join(', ')}` 
    : '';
  
  const genre = data.genre || 'pop';
  const mood = data.mood || 'alegre';
  const tempo = data.tempo || 'moderado';
  const emotionalTone = data.emotionalTone || 'emotivo';
  
  return `Uma música ${genre.toLowerCase()} ${mood.toLowerCase()} em ritmo ${tempo.toLowerCase()}${instrumentsText}. Tom emocional ${emotionalTone.toLowerCase()} para ${data.occasion.toLowerCase()}. Letra: ${lyrics.substring(0, 200)}...`;
}

function createSunoPrompt(formData: z.infer<typeof generatePreviewSchema>, lyrics: string): string {
  return `${lyrics}

[Estilo: ${formData.genre}, ${formData.mood}, ${formData.tempo}]`;
}

// Função para mapear gênero para estilo Suno
function mapGenreToSunoStyle(genre: string): string {
  const genreMap: { [key: string]: string } = {
    'pop': 'pop',
    'rock': 'rock',
    'jazz': 'jazz',
    'blues': 'blues',
    'country': 'country',
    'folk': 'folk',
    'r&b': 'r&b',
    'soul': 'soul',
    'reggae': 'reggae',
    'hip-hop': 'hip-hop',
    'rap': 'rap',
    'electronic': 'electronic',
    'dance': 'dance',
    'classical': 'classical',
    'acoustic': 'acoustic'
  };
  
  return genreMap[genre.toLowerCase()] || 'pop';
}

// Função para mapear duração para formato Suno
function mapDurationToSunoLength(duration: string): string {
  const durationMap: { [key: string]: string } = {
    '1-2 minutos': 'short',
    '2-3 minutos': 'medium', 
    '3-4 minutos': 'long',
    '4+ minutos': 'extended'
  };
  
  return durationMap[duration] || 'medium';
}

// Função para mapear duração para modelo Suno
function mapDurationToModel(duration: string): string {
  // Durações mais longas usam modelos mais avançados
  if (duration.includes('4-6') || duration.includes('6-8')) {
    return 'V4_5PLUS'; // Suporta até 8 minutos
  } else if (duration.includes('3-4')) {
    return 'V4'; // Melhor qualidade de áudio
  } else {
    return 'V3_5'; // Diversidade criativa
  }
}

// Endpoint principal
router.post('/', async (req: Request, res: Response) => {
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
    
    // Extrair userId e guestId da requisição
    const authHeader = req.headers.authorization;
    const guestId = req.headers['x-guest-id'] as string;
    let userId: string | null = null;
    
    // Se há token de autorização, extrair userId usando Supabase Auth
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = authHeader.substring(7);
      console.log('[AUTH] Token JWT recebido:', jwt.substring(0, 20) + '...');
      
      try {
        const supabase = getSupabaseClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
        
        if (userError) {
          console.error('[AUTH_ERROR] Erro ao obter usuário do token:', userError);
          console.error('[AUTH_ERROR] Detalhes:', {
            message: userError.message,
            status: userError.status
          });
          // Não retornar erro aqui - continuar como usuário não autenticado
        } else if (user) {
          userId = user.id;
          console.log('[AUTH] Usuário autenticado com UUID:', userId);
          console.log('[AUTH] Email do usuário:', user.email);
        } else {
          console.log('[AUTH] Token válido mas usuário não encontrado');
        }
      } catch (authError) {
        console.error('[AUTH_EXCEPTION] Exceção ao validar token:', authError);
        // Continuar como usuário não autenticado
      }
    }
    
    console.log('🔍 FormData validado:', JSON.stringify(formData, null, 2));
    console.log('🔍 LyricsOnly flag:', lyricsOnly);
    console.log('🔍 Modo de operação:', lyricsOnly ? 'APENAS LETRAS' : 'LETRA + ÁUDIO');
    console.log('🔍 UserId extraído:', userId);
    console.log('🔍 GuestId extraído:', guestId);

    // ===== PROTEÇÃO DO PAYWALL =====
    // Definir limite de músicas gratuitas
    const FREE_SONG_LIMIT = 1;
    
    // Verificar se o usuário pode criar uma nova música
    if (userId && !lyricsOnly) {
      console.log('[PAYWALL] Verificando proteção do paywall para usuário:', userId);
      console.log('[PAYWALL] Tipo do userId:', typeof userId);
      console.log('[PAYWALL] Valor do userId:', JSON.stringify(userId));
      
      try {
        // Buscar dados do usuário no Supabase
        console.log('[PAYWALL] Executando query para contar músicas do userId:', userId);
        const supabase = getSupabaseClient();
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('freesongsused')
          .eq('id', userId)
          .single();

        console.log('[PAYWALL] Resultado da query - userData:', userData);
        console.log('[PAYWALL] Resultado da query - userError:', userError);

        if (userError) {
          console.error('[PAYWALL_ERROR] Erro ao buscar dados do usuário:', userError);
          console.error('[PAYWALL_ERROR] Detalhes do erro:', {
            message: userError.message,
            details: userError.details,
            hint: userError.hint,
            code: userError.code
          });
          return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: 'Não foi possível verificar seu status de usuário.',
            debug: process.env.NODE_ENV === 'development' ? userError : undefined
          });
        }

        const freeSongsUsed = userData?.freesongsused || 0;
        console.log('[PAYWALL] Músicas gratuitas usadas:', freeSongsUsed);
        console.log('[PAYWALL] Status do usuário:', {
          userId,
          freeSongsUsed,
          maxFreeSongs: FREE_SONG_LIMIT,
          canCreateMore: freeSongsUsed < FREE_SONG_LIMIT
        });

        // Verificar se excedeu o limite de músicas gratuitas
        if (freeSongsUsed >= FREE_SONG_LIMIT) {
          console.log(`[PAYWALL_BLOCK] Acesso bloqueado para o usuário ${userId}. Limite de ${FREE_SONG_LIMIT} música(s) gratuita(s) atingido.`);
          
          // A palavra-chave 'return' é essencial e não negociável.
          // Ela interrompe a função aqui e envia a resposta.
          return res.status(402).json({
            success: false,
            error: 'PAYMENT_REQUIRED',
            message: 'Você já usou sua criação de música gratuita. Por favor, faça um upgrade para criar mais.',
            freeSongsUsed,
            maxFreeSongs: FREE_SONG_LIMIT,
            requiresPayment: true
          });
        }

        // O código abaixo só pode ser executado se a condição acima for falsa.
        console.log(`[PAYWALL_ALLOW] Acesso permitido para o usuário ${userId}.`);
        console.log('[PAYWALL] Usuário pode criar música - prosseguindo. Músicas restantes:', FREE_SONG_LIMIT - freeSongsUsed);
      } catch (error) {
        console.error('[PAYWALL_DB_ERROR] Erro na verificação do paywall:', error);
        console.error('[PAYWALL_DB_ERROR] Stack trace:', error instanceof Error ? error.stack : 'N/A');
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          message: 'Não foi possível verificar seu status de usuário.',
          debug: process.env.NODE_ENV === 'development' ? error : undefined
        });
      }
    }
    // ===== FIM DA PROTEÇÃO DO PAYWALL =====

    if (lyricsOnly) {
      console.log('✅ Modo lyricsOnly: Gerando letra e título...');
      
      if (!process.env.OPENAI_API_KEY) {
        console.log('❌ OpenAI API Key não configurada!');
        return res.status(500).json({
          success: false,
          error: 'Configuração da API OpenAI não encontrada'
        });
      }
      
      try {
        const prompt = createLyricsAndTitlePrompt(formData);
        console.log('🎵 Fazendo chamada para OpenAI (lyricsOnly)...');
        
        const aiResponse = await getOpenAIClient().chat.completions.create({
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
        
      } catch (error) {
        console.error('[OPENAI_ERROR] Erro na geração de letra (lyricsOnly):', error);
        
        // Verificar se é um erro da API da OpenAI
        if (error instanceof OpenAI.APIError) {
          if (error.status === 429) {
            // Erro de cota/faturamento
            console.error('[OPENAI_QUOTA] Cota da OpenAI excedida! Verificar faturamento.');
            return res.status(503).json({
              success: false,
              error: 'SERVICE_UNAVAILABLE',
              message: 'Nosso serviço de criação está com uma demanda muito alta no momento. Por favor, tente novamente em alguns minutos.'
            });
          } else if (error.status === 401) {
            // Erro de autenticação
            console.error('[OPENAI_AUTH] Erro de autenticação da OpenAI:', error.message);
            return res.status(500).json({
              success: false,
              error: 'INTERNAL_SERVER_ERROR',
              message: 'Ocorreu um erro de configuração. Nossa equipe já foi notificada.'
            });
          } else {
            // Outros erros da API da OpenAI
            console.error('[OPENAI_API] Erro da API OpenAI:', error.status, error.message);
            return res.status(500).json({
              success: false,
              error: 'INTERNAL_SERVER_ERROR',
              message: 'Ocorreu um erro inesperado ao gerar a letra. Nossa equipe já foi notificada.'
            });
          }
        } else {
          // Outros tipos de erro (rede, timeout, etc.)
          console.error('[OPENAI_NETWORK] Erro de rede ou timeout:', error.message);
          return res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Ocorreu um erro inesperado ao gerar a letra. Nossa equipe já foi notificada.'
          });
        }
      }
      
    } else {
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
      
      let lyrics;
      try {
        const prompt = createLyricsPrompt(formData);
        
        console.log('🎵 Prompt criado para OpenAI:');
        console.log('---START PROMPT---');
        console.log(prompt);
        console.log('---END PROMPT---');
        
        console.log('🎵 Fazendo chamada para OpenAI...');
        const completion = await getOpenAIClient().chat.completions.create({
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
        lyrics = completion.choices[0]?.message?.content;
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
        
      } catch (error) {
        console.error('[OPENAI_ERROR] Erro na geração de letra (modo completo):', error);
        
        // Verificar se é um erro da API da OpenAI
        if (error instanceof OpenAI.APIError) {
          if (error.status === 429) {
            // Erro de cota/faturamento
            console.error('[OPENAI_QUOTA] Cota da OpenAI excedida! Verificar faturamento.');
            return res.status(503).json({
              success: false,
              error: 'SERVICE_UNAVAILABLE',
              message: 'Nosso serviço de criação está com uma demanda muito alta no momento. Por favor, tente novamente em alguns minutos.'
            });
          } else if (error.status === 401) {
            // Erro de autenticação
            console.error('[OPENAI_AUTH] Erro de autenticação da OpenAI:', error.message);
            return res.status(500).json({
              success: false,
              error: 'INTERNAL_SERVER_ERROR',
              message: 'Ocorreu um erro de configuração. Nossa equipe já foi notificada.'
            });
          } else {
            // Outros erros da API da OpenAI
            console.error('[OPENAI_API] Erro da API OpenAI:', error.status, error.message);
            return res.status(500).json({
              success: false,
              error: 'INTERNAL_SERVER_ERROR',
              message: 'Ocorreu um erro inesperado ao gerar a letra. Nossa equipe já foi notificada.'
            });
          }
        } else {
          // Outros tipos de erro (rede, timeout, etc.)
          console.error('[OPENAI_NETWORK] Erro de rede ou timeout:', error.message);
          return res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Ocorreu um erro inesperado ao gerar a letra. Nossa equipe já foi notificada.'
          });
        }
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
          model: 'V4_5PLUS',
          userId: userId,
          guestId: guestId,
          // Dados adicionais para o salvamento
          senderName: formData.senderName,
          relationship: formData.relationship,
          emotionalTone: formData.emotionalTone,
          mood: formData.mood,
          tempo: formData.tempo
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

  } catch (error: unknown) {
    console.log('\n❌ === ERRO CAPTURADO NO ENDPOINT ===');
    console.log('❌ Timestamp:', new Date().toISOString());
    const errorObj = error as Record<string, unknown>;
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
      console.log('❌ Resposta da API externa:', JSON.stringify(errorObj.response.data, null, 2));
      console.log('❌ Status da API externa:', errorObj.response.status);
      console.log('❌ Headers da resposta:', errorObj.response.headers);
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
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Erro de conectividade - conexão recusada pela API de música';
        statusCode = 502;
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Timeout na conexão com a API de música';
        statusCode = 504;
      } else if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
        errorMessage = 'Erro de certificado SSL/TLS na API de música';
        statusCode = 502;
      } else if (error.message.includes('OpenAI')) {
        errorMessage = 'Não foi possível contactar o nosso compositor de IA. Tente novamente.';
      } else if (error.message.includes('Geração falhou')) {
        errorMessage = 'Falha na geração da música';
        statusCode = 422;
      } else if (error.message.includes('Timeout')) {
        errorMessage = 'Tempo limite excedido na geração da música';
        statusCode = 408;
      } else if (error.message.includes('Authorization')) {
        errorMessage = 'Erro de autenticação com a API Suno';
        statusCode = 401;
      } else if (error.message.includes('Suno')) {
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
});

// Função para processar tarefa em background
async function processTaskInBackground(taskId: string) {
  console.log(`🎵 Iniciando processamento em background para taskId: ${taskId}`);
  
  const task = global.musicTasks.get(taskId);
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
          } else {
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
                  const existingClip = task.audioClips.find(existing => existing.id === clipId);
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
            
            // Salvar automaticamente no banco de dados
            await autoSaveSongToDatabase(task, task.metadata.userId, task.metadata.guestId);
            
            break;
          }
          
        } else if (jobData.status === 'PENDING' || jobData.status === 'PROCESSING') {
          console.log(`⏳ [${taskId}] Job ainda em processamento, continuando polling...`);
        } else {
          console.log(`⚠️ [${taskId}] Status do job não reconhecido:`, jobData.status);
        }
        
      } catch (error) {
        console.log(`❌ [${taskId}] Erro na tentativa ${attempts}:`, error.message);
        
        // Se não for a última tentativa, continuar
        if (attempts < maxAttempts) {
          console.log(`🎵 [${taskId}] Continuando para próxima tentativa após erro...`);
        } else {
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
        
        // Salvar automaticamente no banco de dados mesmo com resultado parcial
        await autoSaveSongToDatabase(task, task.metadata.userId, task.metadata.guestId);
      } else {
        // Nenhuma música foi processada
        task.status = 'FAILED';
        task.error = `Timeout: A geração da música está demorando mais que o esperado. Por favor, tente novamente mais tarde.`;
        console.log(`❌ [${taskId}] Timeout: Nenhuma música foi processada após ${maxAttempts} tentativas`);
        
        // Retornar erro 504 para o frontend se ainda não foi enviada resposta
        if (!res.headersSent) {
          return res.status(504).json({
            success: false,
            error: 'A geração da música está demorando mais que o esperado. Por favor, tente novamente mais tarde.',
            status: 'TIMEOUT',
            taskId
          });
        }
      }
    }
    
 } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.log(`❌ [${taskId}] Erro no processamento em background:`, errorMessage);
      task.status = 'FAILED';
      task.error = errorMessage;
    }
}

// Endpoint para verificar status de uma tarefa específica
router.get('/check-music-status/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  console.log(`🔍 Verificando status da tarefa: ${taskId}`);
  
  if (!global.musicTasks) {
    global.musicTasks = new Map();
  }
  
  const task = global.musicTasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Tarefa não encontrada',
      taskId
    });
  }
  
  // Calcular tempo decorrido
  const elapsedTime = Date.now() - task.startTime;
  const elapsedMinutes = Math.floor(elapsedTime / 60000);
  const elapsedSeconds = Math.floor((elapsedTime % 60000) / 1000);
  
  const response = {
    success: true,
    taskId,
    status: task.status,
    audioClips: task.audioClips || [],
    completedClips: task.completedClips || 0,
    totalExpected: task.totalExpected || 2,
    lyrics: task.lyrics,
    metadata: {
      ...task.metadata,
      elapsedTime: `${elapsedMinutes}m ${elapsedSeconds}s`,
      lastUpdate: new Date(task.lastUpdate).toISOString()
    }
  };
  
  // Adicionar erro se houver
  if (task.error) {
    response.error = task.error;
  }
  
  console.log(`✅ Status da tarefa ${taskId}:`, {
    status: task.status,
    completedClips: task.completedClips,
    totalExpected: task.totalExpected,
    elapsedTime: `${elapsedMinutes}m ${elapsedSeconds}s`
  });
  
  res.json(response);
});

export default router;