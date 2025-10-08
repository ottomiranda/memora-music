import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import OpenAI from 'openai';
import { PromptAdapter } from '../../src/lib/services/promptAdapter.js';
const router = express.Router();
const upload = multer();
// Schema de validação (mesmo do original)
const generatePreviewSchema = z.object({
    songTitle: z.string().optional(),
    description: z.string().optional(),
    recipientName: z.string().min(1, 'Nome do destinatário é obrigatório'),
    occasion: z.string().min(1, 'Ocasião é obrigatória'),
    relationship: z.string().min(1, 'Relacionamento é obrigatório'),
    emotionalTone: z.string().optional(),
    specialMemories: z.string().optional(),
    memories: z.string().optional(),
    personalMessage: z.string().optional(),
    senderName: z.string().optional(),
    hobbies: z.string().optional(),
    qualities: z.string().optional(),
    uniqueTraits: z.string().optional(),
    genre: z.string().optional(),
    mood: z.string().optional(),
    tempo: z.string().optional(),
    duration: z.string().min(1, 'Duração é obrigatória'),
    instruments: z.array(z.string()).optional(),
    lyricsOnly: z.boolean().optional(),
    language: z.string().optional().default('en-US')
});
// FUNÇÃO MODIFICADA PARA USAR PROMPT ADAPTER
function createEnglishLyricsPrompt(data) {
    const language = data.language || 'en-US';
    const request = {
        songTitle: data.songTitle,
        recipientName: data.recipientName,
        occasion: data.occasion,
        relationship: data.relationship,
        emotionalTone: data.emotionalTone,
        specialMemories: data.specialMemories || data.memories,
        personalMessage: data.personalMessage,
        senderName: data.senderName,
        hobbies: data.hobbies,
        qualities: data.qualities,
        uniqueTraits: data.uniqueTraits,
        genre: data.genre,
        mood: data.mood,
        tempo: data.tempo,
        duration: data.duration,
        instruments: data.instruments
    };
    return PromptAdapter.adaptPrompt('generateLyrics', language, request);
}
// FUNÇÃO MODIFICADA PARA USAR PROMPT ADAPTER COM TÍTULO
function createEnglishLyricsAndTitlePrompt(data) {
    const language = data.language || 'en-US';
    const prompt = data.description;
    const genre = data.genre || '';
    const mood = data.mood || '';
    return PromptAdapter.adaptForLanguage(prompt, language, genre, mood);
}
// Função para criar prompt para geração de música na Suno API (mantida igual)
function createSunoMusicPrompt(data, lyrics) {
    const instrumentsText = data.instruments && data.instruments.length > 0
        ? ` with ${data.instruments.join(', ')}`
        : '';
    const genre = data.genre || 'pop';
    const mood = data.mood || 'happy';
    const tempo = data.tempo || 'moderate';
    const emotionalTone = data.emotionalTone || 'emotional';
    return `A ${genre.toLowerCase()} ${mood.toLowerCase()} song in ${tempo.toLowerCase()} tempo${instrumentsText}. ${emotionalTone.toLowerCase()} emotional tone for ${data.occasion.toLowerCase()}. Lyrics: ${lyrics.substring(0, 200)}...`;
}
function createSunoPrompt(formData, lyrics) {
    return `${lyrics}

[Style: ${formData.genre}, ${formData.mood}, ${formData.tempo}]`;
}
// Função para parsear resposta da IA
function parseAIResponse(response) {
    const lines = response.trim().split('\n');
    // Procurar por padrão TITLE: e LYRICS:
    let title;
    let lyrics = '';
    let foundLyrics = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('TITLE:') || line.startsWith('Title:')) {
            title = line.replace(/^TITLE:\s*/i, '').replace(/^Title:\s*/i, '').trim();
        }
        else if (line.startsWith('LYRICS:') || line.startsWith('Lyrics:')) {
            foundLyrics = true;
            const lyricsStart = line.replace(/^LYRICS:\s*/i, '').replace(/^Lyrics:\s*/i, '').trim();
            if (lyricsStart) {
                lyrics = lyricsStart + '\n';
            }
        }
        else if (foundLyrics) {
            lyrics += line + '\n';
        }
    }
    // Se não encontrou o padrão, considerar tudo como lyrics
    if (!foundLyrics && !title) {
        lyrics = response.trim();
    }
    return {
        title: title || undefined,
        lyrics: lyrics.trim() || response.trim()
    };
}
// Endpoint de teste para inglês
router.post('/test-english', upload.none(), async (req, res) => {
    try {
        console.log('\n=== TESTE DE GERAÇÃO EM INGLÊS ===');
        console.log('🔍 Timestamp:', new Date().toISOString());
        console.log('🔍 Body recebido:', JSON.stringify(req.body, null, 2));
        // Validar dados de entrada
        const validationResult = generatePreviewSchema.safeParse(req.body);
        if (!validationResult.success) {
            console.log('❌ Validação falhou:', validationResult.error.errors);
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos',
                details: validationResult.error.errors
            });
        }
        const formData = validationResult.data;
        console.log('✅ Dados validados:', formData);
        // Verificar chaves de API
        const openaiApiKey = process.env.OPENAI_API_KEY;
        const sunoApiKey = process.env.SUNO_API_KEY;
        if (!openaiApiKey) {
            return res.status(500).json({
                success: false,
                error: 'OPENAI_API_KEY não configurada'
            });
        }
        if (!sunoApiKey) {
            return res.status(500).json({
                success: false,
                error: 'SUNO_API_KEY não configurada'
            });
        }
        // Inicializar OpenAI
        const openai = new OpenAI({
            apiKey: openaiApiKey
        });
        console.log('🤖 Gerando letra em inglês com OpenAI...');
        // Criar prompt em inglês
        const prompt = formData.songTitle
            ? createEnglishLyricsPrompt(formData)
            : createEnglishLyricsAndTitlePrompt(formData);
        console.log('📝 Prompt criado:', prompt.substring(0, 200) + '...');
        console.log('🎵 [TESTE] Prompt gerado:', prompt);
        console.log('🌍 [TESTE] Idioma detectado:', formData.language || 'en-US');
        // Retornar apenas o prompt para testar a internacionalização
        return res.json({
            success: true,
            prompt,
            language: formData.language || 'en-US',
            message: 'Prompt gerado com sucesso - teste de internacionalização'
        });
    }
    catch (error) {
        console.error('❌ Erro no teste:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            details: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString()
        });
    }
});
export default router;
//# sourceMappingURL=generate-preview-english-test.js.map