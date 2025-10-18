import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura da tabela user_creations...\n');
  
  try {
    // Tentar fazer uma query na tabela para ver quais colunas existem
    const { data, error } = await supabase
      .from('user_creations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar user_creations:', error.message);
      return;
    }
    
    console.log('✅ Tabela user_creations acessível');
    
    if (data && data.length > 0) {
      console.log('📋 Colunas encontradas na tabela user_creations:');
      const columns = Object.keys(data[0]);
      columns.forEach((col, index) => {
        console.log(`  ${index + 1}. ${col}`);
      });
      
      // Verificar colunas específicas
      console.log('\n🔍 Verificação de colunas específicas:');
      console.log(`  - guest_id: ${columns.includes('guest_id') ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`  - creations_count: ${columns.includes('creations_count') ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`  - creations: ${columns.includes('creations') ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`  - freesongsused: ${columns.includes('freesongsused') ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`  - device_id: ${columns.includes('device_id') ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`  - user_id: ${columns.includes('user_id') ? '✅ SIM' : '❌ NÃO'}`);
      
      console.log('\n📊 Exemplo de registro:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️ Tabela user_creations está vazia');
      
      // Tentar inserir um registro de teste para ver a estrutura
      console.log('🧪 Tentando inserir registro de teste para verificar estrutura...');
      
      const testData = {
        device_id: 'test-device-structure-check',
        creations: 0
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('user_creations')
        .insert(testData)
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Erro ao inserir teste:', insertError.message);
      } else {
        console.log('✅ Registro de teste inserido com sucesso:');
        console.log(JSON.stringify(insertData, null, 2));
        
        // Limpar o teste
        await supabase
          .from('user_creations')
          .delete()
          .eq('device_id', 'test-device-structure-check');
        
        console.log('🧹 Registro de teste removido');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTableStructure();