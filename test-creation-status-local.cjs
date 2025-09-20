const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Script para testar localmente a rota /api/user/creation-status
 * Reproduz o comportamento exato da API para diagnosticar problemas
 */

async function testCreationStatusLocal() {
  console.log('🔍 Testando rota /api/user/creation-status localmente\n');
  
  // 1. Verificar variáveis de ambiente
  console.log('📋 Verificando configuração do Supabase:');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log(`- SUPABASE_URL: ${supabaseUrl ? '✅ Configurada' : '❌ Não encontrada'}`);
  console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Configurada' : '❌ Não encontrada'}`);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ Variáveis de ambiente do Supabase não configuradas');
    return;
  }
  
  // 2. Criar cliente Supabase com service role
  console.log('\n🔧 Criando cliente Supabase com service role...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // 3. Testar casos específicos
  const testCases = [
    { deviceId: 'test-device-123', description: 'Device ID de teste' },
    { deviceId: 'device-novo-456', description: 'Device ID novo' },
    { deviceId: '', description: 'Device ID vazio' },
    { deviceId: null, description: 'Device ID null' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testando: ${testCase.description}`);
    console.log(`   Device ID: "${testCase.deviceId}"`);
    
    try {
      // Reproduzir exatamente a query da rota paywall
      const { data, error } = await supabase
        .from('user_creations')
        .select('*')
        .eq('device_id', testCase.deviceId)
        .single();
      
      console.log(`   Resultado:`);
      if (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        console.log(`   📊 Código: ${error.code}`);
        console.log(`   📝 Detalhes: ${error.details}`);
        console.log(`   💡 Hint: ${error.hint}`);
      } else {
        console.log(`   ✅ Sucesso: Dados encontrados`);
        console.log(`   📄 Dados:`, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.log(`   💥 Exceção: ${err.message}`);
      console.log(`   📚 Stack:`, err.stack);
    }
  }
  
  // 4. Testar estrutura da tabela
  console.log('\n🏗️  Verificando estrutura da tabela user_creations...');
  try {
    const { data, error } = await supabase
      .from('user_creations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Erro ao acessar tabela: ${error.message}`);
    } else {
      console.log('✅ Tabela acessível');
      if (data && data.length > 0) {
        console.log('📋 Colunas disponíveis:', Object.keys(data[0]));
      } else {
        console.log('📋 Tabela vazia, verificando esquema...');
      }
    }
  } catch (err) {
    console.log(`💥 Erro ao verificar tabela: ${err.message}`);
  }
  
  // 5. Testar permissões específicas
  console.log('\n🔐 Testando permissões da tabela...');
  try {
    // Tentar inserir um registro de teste
    const testRecord = {
      device_id: 'test-permission-check',
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_creations')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.log(`❌ Erro de inserção: ${insertError.message}`);
    } else {
      console.log('✅ Inserção permitida');
      
      // Limpar o registro de teste
      await supabase
        .from('user_creations')
        .delete()
        .eq('device_id', 'test-permission-check');
      console.log('🧹 Registro de teste removido');
    }
  } catch (err) {
    console.log(`💥 Erro de permissão: ${err.message}`);
  }
  
  console.log('\n✨ Teste local concluído!');
}

// Executar teste
testCreationStatusLocal().catch(console.error);