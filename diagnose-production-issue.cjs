const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Configurações corretas (do .env local)
const CORRECT_URL = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const CORRECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';

// Device IDs para teste
const TEST_DEVICE_IDS = [
  '18db2f6c-2ef9-41a1-966a-a50a9f847ecb', // Existente na base
  'test-device-new-123', // Novo device
  'a284fdeb-72ad-4e90-8715-e9092472b66e' // Outro existente
];

async function testProductionAPI(deviceId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'memora-music.onrender.com',
      port: 443,
      path: '/api/user/creation-status',
      method: 'GET',
      headers: {
        'x-device-id': deviceId,
        'User-Agent': 'Diagnostic-Script/1.0'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            response: parsed,
            error: null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            response: data,
            error: 'JSON parse error'
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        status: null,
        response: null,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: null,
        response: null,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function testSupabaseQuery(deviceId, url = CORRECT_URL, key = CORRECT_KEY) {
  try {
    const client = createClient(url, key);
    
    const { data, error } = await client
      .from('user_creations')
      .select('device_id, freesongsused, user_id')
      .eq('device_id', deviceId)
      .maybeSingle();
    
    return { data, error, exception: null };
  } catch (e) {
    return { data: null, error: null, exception: e.message };
  }
}

async function diagnoseProductionIssue() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO PROBLEMA EM PRODUÇÃO\n');
  console.log('=' .repeat(60));

  // 1. Testar API de produção
  console.log('\n📡 1. TESTANDO API DE PRODUÇÃO:');
  for (const deviceId of TEST_DEVICE_IDS) {
    console.log(`\n   Device ID: ${deviceId}`);
    const result = await testProductionAPI(deviceId);
    
    if (result.error) {
      console.log(`   ❌ Erro de rede: ${result.error}`);
    } else {
      console.log(`   📊 Status: ${result.status}`);
      if (result.response && typeof result.response === 'object') {
        console.log(`   📝 Resposta: ${JSON.stringify(result.response, null, 2)}`);
        
        // Verificar se é fallback por erro
        if (result.response.message && result.response.message.includes('fallback por erro')) {
          console.log('   🚨 CONFIRMADO: API está retornando fallback por erro!');
        }
      } else {
        console.log(`   📝 Resposta raw: ${result.response}`);
      }
    }
  }

  // 2. Testar queries locais
  console.log('\n\n🔧 2. TESTANDO QUERIES LOCAIS (BASELINE):');
  for (const deviceId of TEST_DEVICE_IDS) {
    console.log(`\n   Device ID: ${deviceId}`);
    const result = await testSupabaseQuery(deviceId);
    
    if (result.exception) {
      console.log(`   💥 Exception: ${result.exception}`);
    } else if (result.error) {
      console.log(`   ❌ Error code: ${result.error.code || 'undefined'}`);
      console.log(`   ❌ Error message: ${result.error.message}`);
    } else {
      console.log(`   ✅ Dados encontrados: ${!!result.data}`);
      if (result.data) {
        console.log(`   📊 Free songs used: ${result.data.freesongsused}`);
      }
    }
  }

  // 3. Simular problemas de configuração
  console.log('\n\n⚠️  3. SIMULANDO PROBLEMAS DE CONFIGURAÇÃO:');
  
  console.log('\n   3.1 URL undefined:');
  const undefinedUrlResult = await testSupabaseQuery(TEST_DEVICE_IDS[0], undefined, CORRECT_KEY);
  if (undefinedUrlResult.exception) {
    console.log(`   💥 Exception: ${undefinedUrlResult.exception}`);
  }

  console.log('\n   3.2 Key undefined:');
  const undefinedKeyResult = await testSupabaseQuery(TEST_DEVICE_IDS[0], CORRECT_URL, undefined);
  if (undefinedKeyResult.exception) {
    console.log(`   💥 Exception: ${undefinedKeyResult.exception}`);
  }

  console.log('\n   3.3 Key inválida:');
  const invalidKeyResult = await testSupabaseQuery(TEST_DEVICE_IDS[0], CORRECT_URL, 'invalid-key');
  if (invalidKeyResult.error) {
    console.log(`   ❌ Error: ${invalidKeyResult.error.message}`);
  }

  // 4. Conclusões
  console.log('\n\n📋 4. ANÁLISE E PRÓXIMOS PASSOS:');
  console.log('\n   Se a API de produção retorna "fallback por erro":');
  console.log('   → O código está capturando um erro do Supabase');
  console.log('   → Erro não é PGRST116 (not found)');
  console.log('   → Possíveis causas:');
  console.log('     • SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY undefined no Render');
  console.log('     • Chave de API expirada ou inválida');
  console.log('     • Problema de conectividade entre Render e Supabase');
  console.log('     • Variáveis de ambiente não carregadas corretamente');
  
  console.log('\n   ✅ SOLUÇÃO RECOMENDADA:');
  console.log('   1. Verificar variáveis de ambiente no Render');
  console.log('   2. Adicionar logs detalhados temporariamente');
  console.log('   3. Reiniciar o serviço no Render após verificar as variáveis');
  
  console.log('\n' + '=' .repeat(60));
}

diagnoseProductionIssue().catch(console.error);