// Teste automatizado do dropdown
console.log('🧪 Iniciando teste do dropdown...');

// Função para aguardar um elemento aparecer
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} não encontrado em ${timeout}ms`));
    }, timeout);
  });
}

// Função para simular clique
function simulateClick(element) {
  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(event);
}

// Função principal de teste
async function testDropdown() {
  try {
    console.log('1️⃣ Verificando se authStore está disponível...');
    if (!window.useAuthStore) {
      throw new Error('authStore não encontrado no window');
    }
    
    console.log('2️⃣ Simulando login...');
    const authStore = window.useAuthStore;
    authStore.setState({
      user: {
        id: 'test-user-123',
        name: 'João Silva',
        email: 'joao@example.com',
        created_at: new Date().toISOString()
      },
      token: 'mock-jwt-token-123',
      isLoggedIn: true,
      isLoading: false,
      error: null
    });
    
    localStorage.setItem('authToken', 'mock-jwt-token-123');
    window.dispatchEvent(new Event('storage'));
    
    console.log('3️⃣ Aguardando avatar aparecer...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar re-render
    
    const avatar = document.querySelector('[aria-label="Menu do usuário"]');
    if (!avatar) {
      throw new Error('Avatar não encontrado');
    }
    console.log('✅ Avatar encontrado:', avatar);
    
    console.log('4️⃣ Clicando no avatar...');
    simulateClick(avatar);
    
    console.log('5️⃣ Aguardando dropdown aparecer...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dropdown = document.querySelector('[data-testid="dropdown-content"]');
    if (!dropdown) {
      throw new Error('Dropdown não encontrado após clique');
    }
    
    const dropdownStyles = window.getComputedStyle(dropdown);
    console.log('📊 Estilos do dropdown:', {
      display: dropdownStyles.display,
      opacity: dropdownStyles.opacity,
      visibility: dropdownStyles.visibility,
      zIndex: dropdownStyles.zIndex,
      position: dropdownStyles.position,
      top: dropdownStyles.top,
      left: dropdownStyles.left
    });
    
    if (dropdownStyles.opacity === '0' || dropdownStyles.display === 'none') {
      throw new Error('Dropdown está invisível');
    }
    
    console.log('✅ Dropdown está visível!');
    
    console.log('6️⃣ Testando botão de logout...');
    const logoutButton = dropdown.querySelector('button');
    if (!logoutButton) {
      throw new Error('Botão de logout não encontrado');
    }
    console.log('✅ Botão de logout encontrado:', logoutButton);
    
    console.log('7️⃣ Clicando fora para fechar dropdown...');
    simulateClick(document.body);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dropdownAfterClose = document.querySelector('[data-testid="dropdown-content"]');
    if (dropdownAfterClose) {
      const stylesAfterClose = window.getComputedStyle(dropdownAfterClose);
      if (stylesAfterClose.opacity !== '0' && stylesAfterClose.display !== 'none') {
        console.warn('⚠️ Dropdown pode não ter fechado corretamente');
      } else {
        console.log('✅ Dropdown fechou corretamente');
      }
    }
    
    console.log('🎉 Teste do dropdown concluído com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste do dropdown:', error.message);
    return false;
  }
}

// Executar teste
testDropdown().then(success => {
  if (success) {
    console.log('🎯 RESULTADO: Dropdown funcionando corretamente!');
  } else {
    console.log('💥 RESULTADO: Dropdown com problemas!');
  }
});

// Disponibilizar função globalmente para testes manuais
window.testDropdown = testDropdown;