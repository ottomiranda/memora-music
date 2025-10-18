/**
 * Adaptador de Prompts Multilíngue
 * Responsável por adaptar prompts do OpenAI para diferentes idiomas
 * conforme especificado no plano de internacionalização
 */
/**
 * Templates de prompts para cada idioma
 */
const PROMPT_TEMPLATES = {
    'pt-BR': {
        lyricsGeneration: `Crie uma letra de música em português brasileiro sobre: "{prompt}"

Gênero musical: {genre}
Clima/Mood: {mood}

Instruções:
- A letra deve ser em português brasileiro
- Mantenha o estilo do gênero {genre}
- Transmita o clima {mood}
- Use linguagem natural e fluida
- Inclua estrutura de versos e refrão
- Seja criativo e original
- A letra deve ter entre 8-16 linhas
- Use rimas quando apropriado para o gênero

Letra:`,
        genreDescription: `Descreva as características musicais do gênero {genre} em português, incluindo ritmo, instrumentação típica e elementos estilísticos.`,
        moodDescription: `Explique como transmitir o clima/mood "{mood}" em uma música, considerando elementos como melodia, harmonia e letra.`,
        structureGuidance: `Forneça orientações sobre a estrutura típica de uma música do gênero {genre}, incluindo introdução, versos, refrão e ponte.`
    },
    'en-US': {
        lyricsGeneration: `Create song lyrics in English about: "{prompt}"

Musical Genre: {genre}
Mood/Vibe: {mood}

Instructions:
- The lyrics must be in English
- Maintain the style of {genre} genre
- Convey the {mood} mood
- Use natural and flowing language
- Include verse and chorus structure
- Be creative and original
- The lyrics should have 8-16 lines
- Use rhymes when appropriate for the genre

Lyrics:`,
        genreDescription: `Describe the musical characteristics of {genre} genre in English, including rhythm, typical instrumentation, and stylistic elements.`,
        moodDescription: `Explain how to convey the "{mood}" mood in a song, considering elements like melody, harmony, and lyrics.`,
        structureGuidance: `Provide guidance on the typical structure of a {genre} song, including intro, verses, chorus, and bridge.`
    }
};
/**
 * Mapeamento de idiomas do i18n para o formato do adaptador
 */
const LANGUAGE_MAPPING = {
    'pt': 'pt-BR',
    'pt-BR': 'pt-BR',
    'en': 'en-US',
    'en-US': 'en-US'
};
/**
 * Classe principal do adaptador de prompts
 */
export class PromptAdapter {
    /**
     * Mantém compatibilidade com instâncias existentes usando assinatura antiga.
     */
    adaptPrompt(type, language, request) {
        return PromptAdapter.adaptPrompt(type, language, request);
    }
    /**
     * Adapta prompts para diferentes idiomas, preservando formato legado da API.
     */
    static adaptPrompt(type, language, request) {
        const normalizedLanguage = this.mapI18nLanguage(language);
        switch (type) {
            case 'generateLyrics':
                return this.buildLyricsPrompt(normalizedLanguage, request);
            default:
                console.warn(`Tipo de prompt não suportado: ${type}. Usando geração de letras como fallback.`);
                return this.buildLyricsPrompt(normalizedLanguage, request);
        }
    }
    /**
     * Adapta um prompt para o idioma especificado
     * @param prompt - Prompt original do usuário
     * @param language - Idioma alvo
     * @param genre - Gênero musical
     * @param mood - Clima/mood da música
     * @returns Prompt adaptado para o idioma
     */
    static adaptForLanguage(prompt, language, genre = '', mood = '') {
        const template = PROMPT_TEMPLATES[language];
        if (!template) {
            console.warn(`Idioma não suportado: ${language}. Usando português como fallback.`);
            return this.adaptForLanguage(prompt, 'pt-BR', genre, mood);
        }
        return template.lyricsGeneration
            .replace(/\{prompt\}/g, prompt)
            .replace(/\{genre\}/g, genre)
            .replace(/\{mood\}/g, mood);
    }
    /**
     * Converte idioma do i18n para o formato do adaptador
     * @param i18nLanguage - Idioma no formato do i18n (pt, en)
     * @returns Idioma no formato do adaptador (pt-BR, en-US)
     */
    static mapI18nLanguage(i18nLanguage) {
        return LANGUAGE_MAPPING[i18nLanguage] || 'en-US';
    }
    /**
     * Obtém template de prompt para um idioma específico
     * @param language - Idioma alvo
     * @returns Template de prompts para o idioma
     */
    static getTemplate(language) {
        return PROMPT_TEMPLATES[language] || PROMPT_TEMPLATES['en-US'];
    }
    /**
     * Verifica se um idioma é suportado
     * @param language - Idioma a verificar
     * @returns true se o idioma é suportado
     */
    static isLanguageSupported(language) {
        return Object.keys(PROMPT_TEMPLATES).includes(language);
    }
    /**
     * Obtém lista de idiomas suportados
     * @returns Array com idiomas suportados
     */
    static getSupportedLanguages() {
        return Object.keys(PROMPT_TEMPLATES);
    }
    /**
     * Adapta prompt para geração de descrição de gênero
     * @param genre - Gênero musical
     * @param language - Idioma alvo
     * @returns Prompt adaptado para descrição de gênero
     */
    static adaptGenreDescription(genre, language) {
        const template = this.getTemplate(language);
        return template.genreDescription.replace(/\{genre\}/g, genre);
    }
    /**
     * Adapta prompt para geração de descrição de mood
     * @param mood - Clima/mood da música
     * @param language - Idioma alvo
     * @returns Prompt adaptado para descrição de mood
     */
    static adaptMoodDescription(mood, language) {
        const template = this.getTemplate(language);
        return template.moodDescription.replace(/\{mood\}/g, mood);
    }
    /**
     * Adapta prompt para orientações de estrutura musical
     * @param genre - Gênero musical
     * @param language - Idioma alvo
     * @returns Prompt adaptado para orientações de estrutura
     */
    static adaptStructureGuidance(genre, language) {
        const template = this.getTemplate(language);
        return template.structureGuidance.replace(/\{genre\}/g, genre);
    }
    /**
     * Cria um objeto de requisição completo para geração de letras
     * @param prompt - Prompt do usuário
     * @param genre - Gênero musical
     * @param mood - Clima/mood
     * @param i18nLanguage - Idioma no formato i18n
     * @returns Objeto de requisição formatado
     */
    static createGenerationRequest(prompt, genre, mood, i18nLanguage) {
        const language = this.mapI18nLanguage(i18nLanguage);
        return {
            prompt: this.adaptForLanguage(prompt, language, genre, mood),
            genre,
            mood,
            language
        };
    }
    static buildLyricsPrompt(language, request) {
        const isEnglish = language === 'en-US';
        const missingValue = isEnglish ? 'Not specified' : 'Não especificado';
        const sanitize = (value) => (value?.trim() ? value.trim() : missingValue);
        const formatInstruments = (instruments) => {
            if (!instruments || instruments.length === 0)
                return missingValue;
            return instruments.join(', ');
        };
        const memories = sanitize(request.specialMemories || request.memories);
        const hobbies = sanitize(request.hobbies);
        const qualities = sanitize(request.qualities);
        const traits = sanitize(request.uniqueTraits);
        const personalMessage = sanitize(request.personalMessage);
        const emotionalTone = sanitize(request.emotionalTone);
        const tempo = sanitize(request.tempo);
        const mood = sanitize(request.mood);
        const genre = sanitize(request.genre);
        const duration = sanitize(request.duration);
        const instruments = formatInstruments(request.instruments);
        if (isEnglish) {
            return `You are a composer. Based on the briefing below, create a song title and lyrics.
Respond EXACTLY in the following format, without explanations:
[TITLE]: Song Title Here
[LYRICS]:
(Verse 1)
...
(Chorus)
...

Briefing:
- Occasion: ${request.occasion}
- For: ${request.recipientName} (Relationship: ${request.relationship})
- From: ${request.senderName}
- Details: Hobbies (${hobbies}), Qualities (${qualities}), Unique traits (${traits}).
- Main memory: ${memories}
- Musical guidance: Genre (${genre}), Mood (${mood}), Tempo (${tempo}), Duration (${duration}), Instruments (${instruments})
- Personal message: ${personalMessage}
- Desired emotional tone: ${emotionalTone}
- Write the entire song in ENGLISH.
`;
        }
        return `Você é um compositor. Baseado no briefing a seguir, crie um título e a letra para uma música.
Responda EXATAMENTE no seguinte formato, sem explicações:
[TÍTULO]: Título da Música Aqui
[LETRA]:
(Verso 1)
...
(Refrão)
...

Briefing:
- Ocasião: ${request.occasion}
- Para: ${request.recipientName} (Relação: ${request.relationship})
- De: ${request.senderName}
- Detalhes: Hobbies (${hobbies}), Qualidades (${qualities}), Traços únicos (${traits}).
- Memória principal: ${memories}
- Diretrizes musicais: Gênero (${genre}), Clima (${mood}), Tempo (${tempo}), Duração (${duration}), Instrumentos (${instruments})
- Mensagem pessoal: ${personalMessage}
- Tom emocional desejado: ${emotionalTone}
- Escreva toda a música em PORTUGUÊS BRASILEIRO.
`;
    }
}
/**
 * Função utilitária para uso direto
 * @param prompt - Prompt original
 * @param i18nLanguage - Idioma do i18n
 * @param genre - Gênero musical
 * @param mood - Clima/mood
 * @returns Prompt adaptado
 */
export function adaptPromptForLanguage(prompt, i18nLanguage, genre = '', mood = '') {
    const language = PromptAdapter.mapI18nLanguage(i18nLanguage);
    return PromptAdapter.adaptForLanguage(prompt, language, genre, mood);
}
/**
 * Função utilitária para detectar idioma e criar requisição
 * @param prompt - Prompt do usuário
 * @param genre - Gênero musical
 * @param mood - Clima/mood
 * @param i18nLanguage - Idioma detectado pelo i18n
 * @returns Requisição formatada para geração
 */
export function createMultilingualRequest(prompt, genre, mood, i18nLanguage) {
    return PromptAdapter.createGenerationRequest(prompt, genre, mood, i18nLanguage);
}
export default PromptAdapter;
//# sourceMappingURL=promptAdapter.js.map