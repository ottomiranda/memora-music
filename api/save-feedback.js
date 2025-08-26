export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Validate environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      });
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Feedback API is working',
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      // Log incoming data for debugging
      console.log('Received feedback data:', JSON.stringify(req.body, null, 2));
      
      // Accept both camelCase (frontend) and snake_case formats
      const { 
        rating, 
        difficulty,
        wouldRecommend, 
        would_recommend, 
        priceWillingness, 
        price_willingness 
      } = req.body;

      // Map camelCase to snake_case for database
      const mappedData = {
        difficulty: difficulty || rating, // Use difficulty if available, fallback to rating
        would_recommend: wouldRecommend !== undefined ? wouldRecommend : would_recommend,
        price_willingness: priceWillingness !== undefined ? priceWillingness : price_willingness
      };

      console.log('Mapped data for database:', JSON.stringify(mappedData, null, 2));

      // Basic validation
      if (!mappedData.difficulty || mappedData.difficulty < 1 || mappedData.difficulty > 5) {
        console.error('Invalid difficulty/rating:', mappedData.difficulty);
        return res.status(400).json({
          success: false,
          error: 'Difficulty must be between 1 and 5'
        });
      }

      // Validate would_recommend if provided
      if (mappedData.would_recommend !== undefined && typeof mappedData.would_recommend !== 'boolean') {
        console.error('Invalid would_recommend type:', typeof mappedData.would_recommend, mappedData.would_recommend);
        return res.status(400).json({
          success: false,
          error: 'would_recommend must be a boolean'
        });
      }

      // Create Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Insert feedback using mapped data
      const insertData = {
        difficulty: parseInt(mappedData.difficulty),
        would_recommend: mappedData.would_recommend !== undefined ? mappedData.would_recommend : null,
        price_willingness: mappedData.price_willingness ? parseFloat(mappedData.price_willingness) : null
      };

      console.log('Inserting data into Supabase:', JSON.stringify(insertData, null, 2));

      const { data, error } = await supabase
        .from('mvp_feedback')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to save feedback'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Feedback saved successfully',
        data: data[0]
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}