import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { executeSupabaseQuery, getSupabaseServiceClient } from '../../src/lib/supabase-client.js';

// Criar router
const router = Router();

// Função para obter cliente Supabase (lazy loading)
function getSupabase() {
  return getSupabaseServiceClient();
}

// Interface para os dados do feedback
interface FeedbackData {
  difficulty: number;
  wouldRecommend: boolean;
  priceWillingness: string;
}

// Função para converter string de preço para número
function parsePriceWillingness(priceString: string): number {
  // Mapear valores predefinidos para números
  const priceMap: { [key: string]: number } = {
    'gratuito': 0,
    '5-10': 7.5,
    '10-20': 15,
    '20-50': 35
  };
  
  // Se é um valor predefinido, usar o mapeamento
  if (priceMap[priceString]) {
    return priceMap[priceString];
  }
  
  // Se é um valor customizado, extrair o número
  const cleanPrice = priceString.replace(/R\$\s*/g, '').replace(/[^0-9.,]/g, '').replace(',', '.');
  const numericValue = parseFloat(cleanPrice);
  
  if (isNaN(numericValue)) {
    // Se não conseguir parsear, usar 0 como fallback
    return 0;
  }
  
  return numericValue;
}

// Validação dos dados de entrada
function validateFeedbackData(data: unknown): data is FeedbackData {
  return (
    typeof data.difficulty === 'number' &&
    data.difficulty >= 1 &&
    data.difficulty <= 5 &&
    typeof data.wouldRecommend === 'boolean' &&
    typeof data.priceWillingness === 'string' &&
    data.priceWillingness.length > 0
  );
}

// POST /api/save-feedback
router.post('/', async (req: Request, res: Response) => {
  try {
    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false, 
        error: 'Method not allowed. Use POST.' 
      });
    }

    // Validar dados de entrada
    const feedbackData = req.body;
    
    if (!validateFeedbackData(feedbackData)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid feedback data. Required: difficulty (1-5), wouldRecommend (boolean), priceWillingness (string)'
      });
    }

    // Converter preço para número
    const priceAsNumber = parsePriceWillingness(feedbackData.priceWillingness);

    // Salvar no Supabase
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('mvp_feedback')
      .insert({
        difficulty: feedbackData.difficulty,
        would_recommend: feedbackData.wouldRecommend,
        price_willingness: priceAsNumber
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar feedback no Supabase:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save feedback to database'
      });
    }

    // Resposta de sucesso
    return res.status(201).json({
      success: true,
      message: 'Feedback saved successfully',
      data: {
        id: data.id,
        created_at: data.created_at
      }
    });

  } catch (error) {
    console.error('Erro interno no endpoint save-feedback:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/save-feedback (health check)
router.get('/', async (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    endpoint: 'save-feedback',
    timestamp: new Date().toISOString()
  });
});

export default router;