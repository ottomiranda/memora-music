// Script de diagnóstico para verificar o processo de signup do usuário mari@marianadoces.com.br
// Execute este script no console do navegador na página da aplicação

(async function debugSignupMari() {
  console.log('🔍 Iniciando diagnóstico do signup para mari@marianadoces.com.br');
  
  try {
    // 1. Verificar se o Supabase está inicializado
    const { getSupabaseBrowserClient } = await import('./src/lib/supabase-public.js');
    const supabase = await getSupabaseBrowserClient();
    
    if (!supabase) {
      console.error('❌ Supabase não está inicializado');
      return;
    }
    
    console.log('✅ Supabase inicializado com sucesso');
    
    // 2. Verificar configuração atual
    const config = supabase.supabaseUrl;
    console.log('📋 URL do Supabase:', config);
    
    // 3. Tentar fazer signup com dados de teste
    const testEmail = 'mari@marianadoces.com.br';
    const testPassword = 'TestPassword123!';
    const testName = 'Maria Doces';
    
    console.log('🧪 Testando signup com:', { email: testEmail, name: testName });
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { name: testName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (signUpError) {
      console.error('❌ Erro no signup:', signUpError);
      
      // Verificar se é erro de usuário já existente
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️ Usuário já existe, tentando fazer login...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });
        
        if (loginError) {
          console.error('❌ Erro no login:', loginError);
        } else {
          console.log('✅ Login realizado com sucesso:', loginData);
        }
      }
      return;
    }
    
    console.log('✅ Signup realizado com sucesso:', signUpData);
    
    // 4. Verificar se o usuário foi criado
    if (signUpData.user) {
      console.log('👤 Usuário criado:', {
        id: signUpData.user.id,
        email: signUpData.user.email,
        email_confirmed_at: signUpData.user.email_confirmed_at,
        created_at: signUpData.user.created_at,
        user_metadata: signUpData.user.user_metadata
      });
    }
    
    // 5. Verificar sessão atual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError);
    } else {
      console.log('📱 Sessão atual:', sessionData.session ? 'Ativa' : 'Inativa');
      if (sessionData.session) {
        console.log('👤 Usuário da sessão:', sessionData.session.user.email);
      }
    }
    
    // 6. Verificar se precisa de confirmação de email
    if (signUpData.user && !signUpData.user.email_confirmed_at) {
      console.log('📧 Email de confirmação necessário');
      console.log('⏳ Aguardando confirmação do email...');
    }
    
    // 7. Listar todos os usuários (se possível)
    try {
      const { data: users, error: usersError } = await supabase
        .from('auth.users')
        .select('id, email, email_confirmed_at, created_at')
        .eq('email', testEmail);
        
      if (usersError) {
        console.log('ℹ️ Não foi possível consultar diretamente a tabela auth.users (esperado)');
      } else {
        console.log('👥 Usuários encontrados:', users);
      }
    } catch (e) {
      console.log('ℹ️ Consulta direta à tabela auth.users não permitida (esperado)');
    }
    
  } catch (error) {
    console.error('💥 Erro durante diagnóstico:', error);
  }
  
  console.log('🏁 Diagnóstico concluído');
})();

// Função auxiliar para verificar o estado do authStore
function checkAuthStore() {
  console.log('🔍 Verificando estado do authStore...');
  
  // Tentar acessar o store do Zustand
  if (window.useAuthStore) {
    const state = window.useAuthStore.getState();
    console.log('📊 Estado atual do authStore:', {
      isLoggedIn: state.isLoggedIn,
      user: state.user,
      token: state.token ? 'Presente' : 'Ausente',
      error: state.error
    });
  } else {
    console.log('⚠️ authStore não encontrado no window');
  }
  
  // Verificar localStorage
  console.log('💾 localStorage:', {
    authToken: localStorage.getItem('authToken') ? 'Presente' : 'Ausente',
    deviceId: localStorage.getItem('deviceId'),
    guestId: localStorage.getItem('guestId')
  });
}

// Exportar função para uso manual
window.checkAuthStore = checkAuthStore;
window.debugSignupMari = debugSignupMari;

console.log('🛠️ Funções de diagnóstico carregadas:');
console.log('- debugSignupMari(): Testa o processo completo de signup');
console.log('- checkAuthStore(): Verifica o estado atual do authStore');