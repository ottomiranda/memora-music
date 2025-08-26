import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { difficulty, would_recommend, price_willingness } = req.body;

    // Validate input
    if (typeof difficulty !== 'number' || difficulty < 1 || difficulty > 10) {
      return res.status(400).json({ error: 'Difficulty must be a number between 1 and 10' });
    }

    if (typeof would_recommend !== 'boolean') {
      return res.status(400).json({ error: 'would_recommend must be a boolean' });
    }

    if (typeof price_willingness !== 'number' || price_willingness < 0) {
      return res.status(400).json({ error: 'price_willingness must be a positive number' });
    }

    // Insert feedback into Supabase
    const { data, error } = await supabase
      .from('mvp_feedback')
      .insert([
        {
          difficulty,
          would_recommend,
          price_willingness
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save feedback' });
    }

    return res.status(201).json({ 
      message: 'Feedback saved successfully',
      data: data[0]
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}