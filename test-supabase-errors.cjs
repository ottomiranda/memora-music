const { createClient } = require('@supabase/supabase-js');

async function testSupabaseErrors() {
  console.log('=== TESTE 1: URL inválida ===');
  try {
    const invalidClient = createClient('https://invalid-url.supabase.co', 'invalid-key');
    const { data, error } = await invalidClient
      .from('user_creations')
      .select('device_id, freesongsused')
      .eq('device_id', 'test-device')
      .maybeSingle();
    
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Error code:', error?.code);
    console.log('Error message:', error?.message);
  } catch (e) {
    console.log('Exception:', e.message);
  }

  console.log('\n=== TESTE 2: Chave inválida ===');
  try {
    const invalidKeyClient = createClient('https://nvhaylwuvdmsjuwjsfva.supabase.co', 'invalid-service-key');
    const { data, error } = await invalidKeyClient
      .from('user_creations')
      .select('device_id, freesongsused')
      .eq('device_id', 'test-device')
      .maybeSingle();
    
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Error code:', error?.code);
    console.log('Error message:', error?.message);
  } catch (e) {
    console.log('Exception:', e.message);
  }

  console.log('\n=== TESTE 3: Tabela inexistente ===');
  try {
    const validClient = createClient(
      'https://nvhaylwuvdmsjuwjsfva.supabase.co', 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c'
    );
    const { data, error } = await validClient
      .from('tabela_inexistente')
      .select('*')
      .maybeSingle();
    
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Error code:', error?.code);
    console.log('Error message:', error?.message);
  } catch (e) {
    console.log('Exception:', e.message);
  }

  console.log('\n=== TESTE 4: Coluna inexistente ===');
  try {
    const validClient = createClient(
      'https://nvhaylwuvdmsjuwjsfva.supabase.co', 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c'
    );
    const { data, error } = await validClient
      .from('user_creations')
      .select('coluna_inexistente')
      .maybeSingle();
    
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Error code:', error?.code);
    console.log('Error message:', error?.message);
  } catch (e) {
    console.log('Exception:', e.message);
  }
}

testSupabaseErrors().catch(console.error);