import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProtectedRoutes() {
  console.log('🔒 Testando proteção de rotas...');
  
  try {
    // 1. Verificar se há usuário logado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Erro ao verificar usuário:', userError.message);
    }
    
    console.log('👤 Usuário atual:', user ? `${user.email} (${user.id})` : 'Não logado');
    
    // 2. Testar acesso às rotas protegidas via API
    const protectedRoutes = [
      '/api/songs',
      '/api/songs/stats',
      '/api/user/profile'
    ];
    
    console.log('\n🌐 Testando acesso às rotas da API...');
    
    for (const route of protectedRoutes) {
      try {
        const response = await fetch(`http://localhost:5173${route}`, {
          headers: {
            'Authorization': user ? `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` : '',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`${route}: ${response.status} ${response.statusText}`);
        
        if (response.status === 401) {
          console.log('  ✅ Rota protegida corretamente (401 Unauthorized)');
        } else if (response.status === 200) {
          console.log('  ⚠️  Rota acessível (pode estar OK se usuário logado)');
        } else {
          console.log(`  ❓ Status inesperado: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ Erro ao acessar ${route}:`, error.message);
      }
    }
    
    // 3. Verificar estado da sessão
    console.log('\n🔑 Verificando estado da sessão...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao obter sessão:', sessionError.message);
    } else {
      console.log('📋 Sessão ativa:', session.session ? 'Sim' : 'Não');
      if (session.session) {
        console.log('  - Token expira em:', new Date(session.session.expires_at * 1000));
        console.log('  - Refresh token:', session.session.refresh_token ? 'Presente' : 'Ausente');
      }
    }
    
    // 4. Testar localStorage (simulação)
    console.log('\n💾 Verificando armazenamento local...');
    
    // Simular verificação do que seria armazenado no localStorage
    const projectId = supabaseUrl.split('//')[1].split('.')[0];
    const tokenKey = `sb-${projectId}-auth-token`;
    const mockLocalStorage = {
      [tokenKey]: session.session ? 'presente' : 'ausente'
    };
    
    console.log('Token no localStorage:', mockLocalStorage[tokenKey]);
    
    // 5. Resumo da proteção
    console.log('\n📊 RESUMO DA PROTEÇÃO DE ROTAS:');
    console.log('================================');
    
    if (!user) {
      console.log('✅ Usuário não está logado - proteção deve estar ativa');
      console.log('🔍 Verifique se o frontend redireciona para login ao acessar /minhas-musicas');
      console.log('🔍 Verifique se as APIs retornam 401 para requisições sem token');
    } else {
      console.log('⚠️  Usuário está logado - rotas devem estar acessíveis');
      console.log('🔍 Para testar proteção, faça logout e tente acessar as rotas novamente');
    }
    
    // 6. Instruções para teste manual
    console.log('\n🧪 TESTE MANUAL RECOMENDADO:');
    console.log('1. Abra o navegador em modo anônimo');
    console.log('2. Acesse diretamente: http://localhost:5173/minhas-musicas');
    console.log('3. Verifique se é redirecionado para login ou se aparece modal');
    console.log('4. Tente acessar as APIs diretamente sem token de autenticação');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testProtectedRoutes().catch(console.error);