const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Verificando configuração do Render...');
console.log('Timestamp:', new Date().toISOString());

// Verificar variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n📋 Variáveis de ambiente:');
console.log('SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'UNDEFINED');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'UNDEFINED');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Listar todas as variáveis que contêm SUPABASE
const supabaseVars = Object.keys(process.env).filter(key => key.includes('SUPABASE'));
console.log('\n🔑 Variáveis SUPABASE encontradas:', supabaseVars);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('- SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'OK' : 'MISSING');
  process.exit(1);
}

// Testar conectividade
async function testSupabaseConnection() {
  try {
    console.log('\n🔌 Testando conectividade com Supabase...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Teste 1: Verificar se consegue conectar
    console.log('\n📡 Teste 1: Verificando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('user_creations')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro na conexão:', {
        code: healthError.code,
        message: healthError.message,
        details: healthError.details,
        hint: healthError.hint
      });
    } else {
      console.log('✅ Conexão OK');
    }
    
    // Teste 2: Query específica que falha
    console.log('\n📡 Teste 2: Query específ