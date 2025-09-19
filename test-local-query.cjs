const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase usando as mesmas variáveis do .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  console.log('SUPABASE_URL:', supabaseUrl ? 'definida' : 'undefined');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'definida' : 'undefined');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLocalQuery() {
  console.log('🔍 Testando query local com service role key...');
  console.log('URL:', supabaseUrl);
  console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...');
  
  try {
    // Teste 1: Verificar se consegue conectar
    console.log('\n📡 Teste 1: Conectividade básica');
    const { data: healthCheck, error: healthError } = await supabase
      .from('user_creations')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro de conectividade:', healthError);
      return;
    }
    console.log('✅ Conectividade OK');
    
    // Teste 2: Query exata da rota paywall
    console.log('\n🎯 Teste 2: Query exata do paywall');
    const deviceId = 'a284fdeb-72ad-4e90-8715-e9092472b66e'; // Device ID de teste
    const selectColumns = 'device_id, freesongsused, user_id';
    
    const { data, error } = await supabase
      .from('user_creations')
      .select(selectColumns)
      .eq('device_id', deviceId)
      .maybeSingle();
    
    console.log('Query executada:', {
      table: 'user_creations',
      select: selectColumns,
      filter: `device_id = ${deviceId}`,
      method: 'maybeSingle()'
    });
    
    if (error) {
      console.error('❌ Erro na query:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Análise do erro
      if (error.code === 'PGRST116') {
        console.log('📝 Análise: Tabela não encontrada ou sem dados');
      } else if (error.code === '42703') {
        console.log('📝 Análise: Coluna não existe');
      } else if (error.code === 'PGRST301') {
        console.log('📝 Análise: Problema de permissão/RLS');
      } else {
        console.log('📝 Análise: Erro desconhecido');
      }
    } else {
      console.log('✅ Query executada com sucesso');
      console.log('Resultado:', data);
    }
    
    // Teste 3: Verificar estrutura da tabela
    console.log('\n🔍 Teste 3: Verificar estrutura da tabela');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_creations')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError);
    } else {
      console.log('✅ Tabela acessível');
      if (tableInfo && tableInfo.length > 0) {
        console.log('Colunas disponíveis:', Object.keys(tableInfo[0]));
      } else {
        console.log('Tabela vazia');
      }
    }
    
    // Teste 4: Verificar permissões
    console.log('\n🔐 Teste 4: Verificar permissões');
    const { data: permissions, error: permError } = await supabase
      .rpc('check_table_permissions', { table_name: 'user_creations' })
      .single();
    
    if (permError) {
      console.log('⚠️ Não foi possível verificar permissões via RPC:', permError.message);
      
      // Teste alternativo: tentar inserir um registro de teste
      console.log('🧪 Teste alternativo: Verificar permissão de escrita');
      const testRecord = {
        device_id: 'test-permission-check',
        freesongsused: 0,
        user_id: null
      };
      
      const { error: insertError } = await supabase
        .from('user_creations')
        .insert(testRecord);
      
      if (insertError) {
        console.log('❌ Sem permissão de escrita:', insertError.message);
      } else {
        console.log('✅ Permissão de escrita OK');
        
        // Limpar registro de teste
        await supabase
          .from('user_creations')
          .delete()
          .eq('device_id', 'test-permission-check');
      }
    } else {
      console.log('✅ Permissões:', permissions);
    }
    
  } catch (error) {
    console.error('💥 Exceção durante teste:', error);
  }
}

// Executar teste
testLocalQuery().then(() => {
  console.log('\n🏁 Teste concluído');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});