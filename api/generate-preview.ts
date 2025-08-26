/**
 * Vercel serverless function for generate-preview endpoint
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import OpenAI from 'openai';
import { SunoAPI } from 'suno-api';

// Configurar CORS
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Schema de validação
const generatePreviewSchema = z.object({
  recipientName: z.string().min(1, 'Nome do destinatário é obrigatório'),
  occasion: z.string().min(1, 'Ocasião é obrigatória'),
  relationship: z.string().min(1, 'Relacionamento é obrigatório'),
  senderName: z.string().min(1, 'Nome do remetente é obrigatório'),
  hobbies: z.string().optional(),
  qualities: z.string().optional(),
  uniqueTraits: z.string().optional(),
  memories: z.string().optional(),
  emotionalTone: z.string().optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  tempo: z.string().optional(),
  duration: z.string().optional(),
  lyrics: z.string().optional(),
  songTitle: z.string().optional(),
  emotion: z.string().optional(),
  vocalPreference: z.string().optional(),
  lyricsOnly: z.boolean().optional().default(false)
});

// Inicializar clientes
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

const sunoClient = new SunoAPI(process.env.SUNO_API_KEY || '');

// Função para criar prompt de letra
function createLyricsPrompt(data: any): string {
  const {
    recipientName,
    occasion,
    relationship,
    senderName,
    hobbies,
    qualities,
    uniqueTraits,
    memories
  } = data;

  return `Crie uma letra de música personalizada em português brasileiro com as seguintes características:

Destinatário: ${recipientName}
Ocasião: ${occasion}
Relacionamento: ${relationship}
Remetente: ${senderName}
${hobbies ? `Hobbies: ${hobbies}` : ''}
${qualities ? `Qualidades: ${qualities}` : ''}
${uniqueTraits ? `Características únicas: ${uniqueTraits}` : ''}
${memories ? `Memórias especiais: ${memories}` : ''}

A letra deve:
- Ser emotiva e personalizada
- Mencionar o nome do destinatário
- Refletir a ocasião e o relacionamento
- Ter entre 2-3 estrofes com refrão
- Ser adequada para ser cantada
- Usar linguagem carinhosa e apropriada

Formato de resposta:
[Título da música]

[Estrofe 1]
[Refrão]
[Estrofe 2]
[Refrão]
[Ponte/Estrofe final]
[Refrão]`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  setCorsHeaders(res);

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🎵 === INÍCIO GENERATE PREVIEW ===');
    console.log('📝 Body recebido:', JSON.stringify(req.body, null, 2));

    // Validar dados de entrada
    const validationResult = generatePreviewSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.log('❌ Erro de validação:', validationResult.error.errors);
      res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
      return;
    }

    const data = validationResult.data;
    console.log('✅ Dados validados:', data);

    // Se for apenas para gerar letra
    if (data.lyricsOnly) {
      console.log('📝 Gerando apenas letra...');
      
      const prompt = createLyricsPrompt(data);
      console.log('📝 Prompt criado:', prompt.substring(0, 200) + '...');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um compositor especializado em criar letras de música personalizadas e emotivas em português brasileiro.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.8
      });

      const lyrics = completion.choices[0]?.message?.content;
      
      if (!lyrics) {
        throw new Error('Não foi possível gerar a letra');
      }

      console.log('✅ Letra gerada com sucesso');
      
      res.status(200).json({
        success: true,
        lyrics: lyrics,
        type: 'lyrics_only'
      });
      return;
    }

    // Lógica para geração completa com música (implementar conforme necessário)
    res.status(200).json({
      success: true,
      message: 'Funcionalidade de geração completa em desenvolvimento'
    });

  } catch (error) {
    console.error('❌ Erro no generate-preview:', error);
    
    let errorMessage = 'Ocorreu um erro interno. Tente novamente em alguns instantes.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        errorMessage = 'Erro de conectividade com a API de música';
        statusCode = 502;
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Erro de conectividade - conexão recusada';
        statusCode = 502;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout na requisição - tente novamente';
        statusCode = 504;
      }
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}