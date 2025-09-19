const { createClient } = require('@supabase/supabase-js');

// Simular diferentes cenários de variáveis de ambiente que podem estar acontecendo no Render
async function testProductionScenarios() {
  console.log('=== DIAGNÓSTICO DE PROBLEMAS EM PRODUÇÃO ===\n');

  // Cenário 1: Variáveis corretas (baseline)
  console.log('1. TESTE COM VARIÁVEIS CORRETAS:');
  try {
    const correctClient = createClient(
      'https://nvhaylwuvdmsjuwjsfva.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c'
    );
    
    const { data, error } = await correctClient
      .from('user_creations')
      .select('device_id, freesongsused')
      .eq('device_id', '18db2f6c-2ef9-41a1-966a-a50a9f847ecb')
      .maybeSingle();
    
    console.log('   ✅ Resultado:', { data: !!data, error: !!error });
    if (error) {
      console.log('   ❌ Error code:', error.code);
      console.log('   ❌ Error message:', error.message);
    }
  } catch (e) {
    console.log('   💥 Exception:', e.message);
  }

  // Cenário 2: SUPABASE_URL undefined/empty
  console.log('\n2. TESTE COM SUPABASE_URL UNDEFINED:');
  try {
    const noUrlClient = createClient(
      undefined,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c'
    );
    
    const { data, error } = await noUrlClient
      .from('user_creations')
      .select('device_id')
      .maybeSingle();
    
    console.log('   ✅ Resultado:', { data: !!data, error: !!error });
    if (error) {
      console.log('   ❌ Error code:', error.code);
      console.log('   ❌ Error message:', error.message);
    }
  } catch (e) {
    console.log('   💥 Exception:', e.message);
  }

  // Cenário 3: SERVICE_ROLE_KEY undefined/empty
  console.log('\n3. TESTE COM SERVICE_ROLE_KEY UNDEFINED:');
  try {
    const noKeyClient = createClient(
      'https://nvhaylwuvdmsjuwjsfva.supabase.co',
      undefined
    );
    
    const { data, error } = await noKeyClient
      .from('user_creations')
      .select('device_id')
      .maybeSingle();
    
    console.log('   ✅ Resultado:', { data: !!data, error: !!error });
    if (error) {
      console.log('   ❌ Error code:', error.code);
      console.log('   ❌ Error message:', error.message);
    }
  } catch (e) {
    console.log('   💥 Exception:', e.message);
  }

  // Cenário 4: Chave expirada ou inválida
  console.log('\n4. TESTE COM CHAVE EXPIRADA/INVÁLIDA:');
  try {
    const expiredKeyClient = createClient(
      'https://nvhaylwuvdmsjuwjsfva.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTU1Njc2NzAzOSwiZXhwIjoxNTcyMzQzMDM5fQ.invalid-signature'
    );
    
    const { data, error } = await expiredKeyClient
      .from('user_creations')
      .select('device_id')
      .maybeSingle();
    
    console.log('   ✅ Resultado:', { data: !!data, error: !!error });
    if (error) {
      console.log('   ❌ Error code:', error.code);
      console.log('   ❌ Error message:', error.message);
    }
  } catch (e) {
    console.log('   💥 Exception:', e.message);
  }

  // Cenário 5: URL com trailing slash ou formato incorreto
  console.log('\n5. TESTE COM URL MAL FORMATADA:');
  try {
    const malformedUrlClient = createClient(
      'https://nvhaylwuvdmsjuwjsfva.supabase.co/',  // trailing slash
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c'
    );
    
    const { data, error } = await malformedUrlClient
      .from('user_creations')
      .select('device_id')
      .maybeSingle();
    
    console.log('   ✅ Resultado:', { data: !!data, error: !!error });
    if (error) {
      console.log('   ❌ Error code:', error.code);
      console.log('   ❌ Error message:', error.message);
    }
  } catch (e) {
    console.log('   💥 Exception:', e.message);
  }

  console.log('\n=== RESUMO ===');
  console.log('Se o erro em produção for:');
  console.log('- "Invalid API key" → Problema com SUPABASE_SERVICE_ROLE_KEY');
  console.log('- "fetch failed" → Problema com SUPABASE_URL ou conectividade');
  console.log('- "PGRST205" → Tabela não encontrada (problema de schema)');
  console.log('- "42703" → Coluna não encontrada');
  console.log('- Exception → Variável undefined ou problema de configuração');
}

testProductionScenarios().catch(console.error);