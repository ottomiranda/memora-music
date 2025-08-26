// Teste manual do popup de validação
// Este arquivo testa a funcionalidade do popup e a conexão com o Supabase

const API_BASE = 'http://localhost:3001';

// Função para testar o envio de feedback
async function testFeedbackSubmission() {
  console.log('🧪 Iniciando teste do popup de validação...');
  
  // Teste 1: Dados válidos
  const validFeedback = {
    difficulty: 3,
    wouldRecommend: true,
    priceWillingness: '10-20'
  };
  
  try {
    console.log('\n📤 Teste 1: Enviando dados válidos...');
    console.log('Payload:', JSON.stringify(validFeedback, null, 2));
    
    const response = await fetch(`${API_BASE}/api/save-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validFeedback)
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sucesso! Resposta:', result);
    } else {
      const error = await response.text();
      console.log('❌ Erro na resposta:', error);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }
  
  // Teste 2: Dados inválidos (para testar validação)
  const invalidFeedback = {
    difficulty: 'muito difícil', // String em vez de número
    wouldRecommend: 'sim', // String em vez de boolean
    priceWillingness: 999 // Número em vez de string
  };
  
  try {
    console.log('\n📤 Teste 2: Enviando dados inválidos (teste de validação)...');
    console.log('Payload:', JSON.stringify(invalidFeedback, null, 2));
    
    const response = await fetch(`${API_BASE}/api/save-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidFeedback)
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('⚠️ Inesperado: Dados inválidos foram aceitos:', result);
    } else {
      const error = await response.text();
      console.log('✅ Esperado: Validação funcionou, dados rejeitados:', error);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }
  
  // Teste 3: Diferentes valores de preço
  const priceTests = [
    { difficulty: 2, wouldRecommend: false, priceWillingness: '20-50' },
    { difficulty: 4, wouldRecommend: true, priceWillingness: '50-100' },
    { difficulty: 1, wouldRecommend: true, priceWillingness: '100+' }
  ];
  
  for (let i = 0; i < priceTests.length; i++) {
    const testData = priceTests[i];
    
    try {
      console.log(`\n📤 Teste ${3 + i}: Testando diferentes valores de preço...`);
      console.log('Payload:', JSON.stringify(testData, null, 2));
      
      const response = await fetch(`${API_BASE}/api/save-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      console.log('Status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sucesso! ID do feedback:', result.id);
      } else {
        const error = await response.text();
        console.log('❌ Erro:', error);
      }
      
    } catch (error) {
      console.log('❌ Erro na requisição:', error.message);
    }
  }
  
  console.log('\n🏁 Teste concluído!');
}

// Executar o teste
testFeedbackSubmission();