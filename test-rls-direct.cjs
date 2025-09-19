const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjcwMzksImV4cCI6MjA3MjM0MzAzOX0.WNZc_C9DAHTmjOaJpm-1TbH4-ZGKbO4oZR5c-KlPuzg';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';

// Criar clientes
const anonClient = createClient(supabaseUrl, anonKey);
const serviceClient = createClient(supabaseUrl, serviceKey);

async function testRLS() {
  console.log('=== TESTE DIRETO DAS POLÍTICAS RLS ===\n');

  try {
    // 1. Teste com cliente anônimo (deve falhar ou retornar vazio)
    console.log('1. Testando acesso anônimo à tabela songs:');
    const { data: anonSongs, error: anonError } = await anonClient
      .from('songs')
      .select('*')
      .limit(5);
    
    if (anonError) {
      console.log('   ✅ CORRETO: Cliente anônimo recebeu erro:', anonError.message);
    } else {
      console.log('   ❌ PROBLEMA: Cliente anônimo conseguiu acessar', anonSongs?.length || 0, 'músicas');
      if (anonSongs?.length > 0) {
        console.log('   Primeira música:', anonSongs[0]);
      }
    }

    // 2. Teste com service role (deve funcionar)
    console.log('\n2. Testando acesso com service role à tabela songs:');
    const { data: serviceSongs, error: serviceError } = await serviceClient
      .from('songs')
      .select('*')
      .limit(5);
    
    if (serviceError) {
      console.log('   ❌ ERRO: Service role falhou:', serviceError.message);
    } else {
      console.log('   ✅ Service role acessou', serviceSongs?.length || 0, 'músicas');
    }

    // 3. Verificar políticas RLS
    console.log('\n3. Verificando se RLS está habilitado:');
    const { data: rlsStatus, error: rlsError } = await serviceClient
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'songs');
    
    if (rlsError) {
      console.log('   Erro ao verificar RLS:', rlsError.message);
    } else {
      console.log('   RLS Status:', rlsStatus);
    }

    // 4. Listar políticas existentes
    console.log('\n4. Listando políticas da tabela songs:');
    const { data: policies, error: policiesError } = await serviceClient
      .rpc('get_policies_for_table', { table_name: 'songs' })
      .catch(() => {
        // Se a função não existir, usar query direta
        return serviceClient
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'songs');
      });
    
    if (policiesError) {
      console.log('   Erro ao listar políticas:', policiesError.message);
    } else {
      console.log('   Políticas encontradas:', policies?.length || 0);
      if (policies?.length > 0) {
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname}: ${policy.cmd} para ${policy.roles}`);
        });
      }
    }

  } catch (error) {
    console.error('Erro geral no teste:', error);
  }
}

testRLS().then(() => {
  console.log('\n=== TESTE CONCLUÍDO ===');
  process.exit(0);
}).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});