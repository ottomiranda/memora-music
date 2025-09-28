// Script para simular login no navegador
console.log('🚀 Iniciando simulação de login...');

// Verificar se o authStore está disponível
if (typeof window !== 'undefined' && window.useAuthStore) {
  const authStore = window.useAuthStore;
  
  // Simular usuário logado
  const mockUser = {
    id: 'test-user-123',
    name: 'João Silva',
    email: 'joao@example.com',
    created_at: new Date().toISOString()
  };
  
  const mockToken = 'mock-jwt-token-123';
  
  // Definir estado no authStore
  authStore.setState({
    user: mockUser,
    token: mockToken,
    isLoggedIn: true,
    isLoading: false,
    error: null
  });
  
  // Salvar no localStorage para consistência
  localStorage.setItem('authToken', mockToken);
  
  console.log('✅ Login simulado com sucesso!');
  console.log('👤 Usuário:', mockUser);
  console.log('🔑 Token:', mockToken);
  console.log('📊 Estado atual do authStore:', authStore.getState());
  
  // Forçar re-render
  window.dispatchEvent(new Event('storage'));
  
} else {
  console.error('❌ authStore não encontrado no window object');
  console.log('🔍 Objetos disponíveis no window:', Object.keys(window).filter(key => key.includes('auth') || key.includes('store')));
}

// Função para limpar o login simulado
window.clearSimulatedLogin = function() {
  if (window.useAuthStore) {
    window.useAuthStore.setState({
      user: null,
      token: null,
      isLoggedIn: false,
      isLoading: false,
      error: null
    });
    localStorage.removeItem('authToken');
    console.log('🧹 Login simulado removido');
  }
};

console.log('💡 Para remover o login simulado, execute: clearSimulatedLogin()');
