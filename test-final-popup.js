/**
 * Teste final do popup de validação
 * Este script testa o fluxo completo do popup
 */

const API_URL = 'http://localhost:3001';

// Função para testar a API save-feedback
async function testSaveFeedback() {
  console.log('🧪 Testando API save-feedback...');
  
  const testData = {
    difficulty: 3,
    wouldRecommend: true,
    priceWillingness: '10-20'
  };
  
  try {
    const response = await fetch(`${API_URL}/api/save-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API funcionando:', result);
      return true;
    } else {
      console.log('❌ Erro na API:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
}

// Função para testar conexão com Supabase
async function testSupabaseConnection() {
  console.log('🔗 Testando conexão com Supabase...');
  
  try {
    const response = await fetch(`${API_URL}/api/health`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Supabase conectado:', result);
      return true;
    } else {
      console.log('❌ Erro na conexão Supabase:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão Supabase:', error.message);
    return false;
  }
}

// Função principal de teste
async function runTests() {
  console.log('🚀 Iniciando testes do popup de validação\n');
  
  const apiTest = await testSaveFeedback();
  const supabaseTest = await testSupabaseConnection();
  
  console.log('\n📊 Resumo dos testes:');
  console.log(`API save-feedback: ${apiTest ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Conexão Supabase: ${supabaseTest ? '✅ OK' : '❌ FALHOU'}`);
  
  if (apiTest && supabaseTest) {
    console.log('\n🎉 Todos os testes passaram! O popup está funcionando corretamente.');
    console.log('\n📝 Para testar o popup na interface:');
    console.log('1. Acesse http://localhost:5173/criar');
    console.log('2. Gere uma música');
    console.log('3. Aguarde 45 segundos de reprodução');
    console.log('4. O popup de validação deve aparecer automaticamente');
  } else {
    console.log('\n❌ Alguns testes falharam. Verifique a configuração.');
  }
}

// Executar testes
runTests().catch(console.error);