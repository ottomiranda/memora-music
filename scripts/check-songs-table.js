import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase usando service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSongsTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela songs...');
    
    // Tentar fazer uma query simples para ver as colunas disponíveis
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela songs:', error.message);
      
      // Tentar verificar se a tabela existe
      console.log('\n🔍 Verificando se a tabela songs existe...');
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_table_info', { table_name: 'songs' })
        .single();
      
      if (tablesError) {
        console.log('❌ Tabela songs não encontrada ou erro ao verificar:', tablesError.message);
        console.log('\n💡 A tabela songs precisa ser criada no Supabase.');
      }
      
      return;
    }
    
    console.log('✅ Tabela songs encontrada!');
    
    if (data && data.length > 0) {
      console.log('\n📋 Estrutura da tabela (baseada no primeiro registro):');
      const firstRecord = data[0];
      Object.keys(firstRecord).forEach(column => {
        console.log(`   - ${column}: ${typeof firstRecord[column]}`);
      });
    } else {
      console.log('📭 Tabela songs existe mas está vazia.');
      console.log('\n💡 Não é possível determinar a estrutura sem dados.');
    }
    
    // Tentar inserir um registro de teste para ver quais colunas são obrigatórias
    console.log('\n🧪 Testando inserção para identificar colunas obrigatórias...');
    const { data: insertData, error: insertError } = await supabase
      .from('songs')
      .insert({
        title: 'Teste',
        user_id: '550e8400-e29b-41d4-a716-446655440000'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção de teste:', insertError.message);
      console.log('💡 Isso nos ajuda a entender quais colunas são obrigatórias.');
    } else {
      console.log('✅ Inserção de teste bem-sucedida!');
      console.log('📋 Registro inserido:', insertData[0]);
      
      // Remover o registro de teste
      await supabase
        .from('songs')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🗑️ Registro de teste removido.');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar a verificação
checkSongsTable()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });