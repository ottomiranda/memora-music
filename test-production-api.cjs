const fetch = require('node-fetch');

// Configuração da API de produção
const PRODUCTION_API = 'https://memora-music.onrender.com';

async function testProductionAPI() {
  console.log('🌐 Testando API de produção...');
  console.log('URL:', PRODUCTION_API);
  
  const testCases = [
    {
      name: 'Device ID existente (local funciona)',
      deviceId: 'a284fdeb-72ad-4e90-8715-e9092472b66e'
    },
    {
      name: 'Device ID novo (deve criar registro)',
      deviceId: `test-prod-${Date.now()}`
    },
    {
      name: 'Device ID vazio (deve dar erro)',
      deviceId: ''
    },
    {
      name: 'Device ID inválido',
      deviceId: 'invalid-device-id-123'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Teste: ${testCase.name}`);
    console.log(`Device ID: ${testCase.deviceId}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${PRODUCTION_API}/api/user/creation-status`, {
        method: 'GET',
        headers: {
          'x-device-id': testCase.deviceId,
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Script/1.0'
        },
        timeout: 10000 // 10 segundos
      });
      
      const responseTime = Date.now() - startTime;
      const responseText = await response.text();
      
      console.log('📊 Resposta:');
      console.log('  Status:', response.status);
      console.log('  Tempo:', `${responseTime}ms`);
      console.log('  Headers:', Object.fromEntries(response.headers.entries()));
      
      try {
        const responseJson = JSON.parse(responseText);
        console.log('  Body (JSON):', JSON.stringify(responseJson, null, 2));
        
        // Análise da resposta
        if (response.status === 500) {
          console.log('❌ Erro 500 - Problema no servidor');
          if (responseJson.message === 'Não foi possível verificar seu status de dispositivo.') {
            console.log('🎯 Confirmado: Este é o erro que estamos investigando');
          }
        } else if (response.status === 200) {
          console.log('✅ Sucesso');
          if (responseJson.message && responseJson.message.includes('fallback por erro')) {
            console.log('⚠️ Fallback ativado - indica erro interno');
          }
        }
        
      } catch (parseError) {
        console.log('  Body (Text):', responseText);
        console.log('⚠️ Resposta não é JSON válido');
      }
      
    } catch (error) {
      console.error('💥 Erro na requisição:', {
        message: error.message,
        code: error.code,
        type: error.constructor.name
      });
      
      if (error.code === 'ECONNREFUSED') {
        console.log('🔌 Servidor não está respondendo');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('⏰ Timeout - servidor muito lento');
      }
    }
    
    // Aguardar um pouco entre os testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 Resumo dos testes:');
  console.log('- Se todos retornaram fallback, o problema é na configuração do Supabase em produção');
  console.log('- Se alguns funcionaram, o problema pode ser específico de device-id');
  console.log('- Se houve erro 500, verifique os logs do Render para detalhes');
  console.log('\n💡 Próximos passos:');
  console.log('1. Verificar logs do Render para mensagens [SUPABASE_CONFIG] e [PAYWALL_ERROR]');
  console.log('2. Confirmar variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Render');
  console.log('3. Verificar se o serviço foi reiniciado após as mudanças');
}

// Executar teste
testProductionAPI().then(() => {
  console.log('\n🏁 Teste de produção concluído');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});