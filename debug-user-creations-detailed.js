// Script para investigar detalhadamente a tabela user_creations
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEVICE_ID = "0315a2fe-220a-401b-b1b9-055a27733360";

async function investigateUserCreations() {
  console.log('🔍 [INVESTIGAÇÃO] Investigando tabela user_creations em detalhes');
  console.log('📋 [INVESTIGAÇÃO] Device ID:', DEVICE_ID);
  
  try {
    // 1. Buscar TODOS os registros na tabela user_creations
    console.log('\n1️⃣ [INVESTIGAÇÃO] Buscando TODOS os registros em user_creations...');
    const { data: allRecords, error: allError } = await supabase
      .from('user_creations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ [INVESTIGAÇÃO] Erro ao consultar user_creations:', allError.message);
      return;
    }
    
    console.log(`📊 [INVESTIGAÇÃO] Total de registros encontrados: ${allRecords.length}`);
    
    if (allRecords.length > 0) {
      console.log('\n📋 [INVESTIGAÇÃO] Todos os registros:');
      allRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. Device ID: ${record.device_id}`);
        console.log(`      User ID: ${record.user_id}`);
        console.log(`      Criações: ${record.creations}`);
        console.log(`      Músicas gratuitas: ${record.freesongsused}`);
        console.log(`      Criado em: ${record.created_at}`);
        console.log(`      Atualizado em: ${record.updated_at}`);
        console.log('      ---');
      });
    }
    
    // 2. Buscar especificamente pelo device_id fornecido
    console.log('\n2️⃣ [INVESTIGAÇÃO] Buscando especificamente pelo device_id...');
    const { data: specificRecord, error: specificError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', DEVICE_ID);
    
    if (specificError) {
      console.error('❌ [INVESTIGAÇÃO] Erro ao buscar device_id específico:', specificError.message);
    } else {
      console.log(`📊 [INVESTIGAÇÃO] Registros para device_id ${DEVICE_ID}:`, specificRecord.length);
      if (specificRecord.length > 0) {
        console.log('📋 [INVESTIGAÇÃO] Dados encontrados:', JSON.stringify(specificRecord, null, 2));
      }
    }
    
    // 3. Buscar também pelo user_id (caso seja o mesmo valor)
    console.log('\n3️⃣ [INVESTIGAÇÃO] Buscando também pelo user_id...');
    const { data: userRecord, error: userError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('user_id', DEVICE_ID);
    
    if (userError) {
      console.error('❌ [INVESTIGAÇÃO] Erro ao buscar user_id específico:', userError.message);
    } else {
      console.log(`📊 [INVESTIGAÇÃO] Registros para user_id ${DEVICE_ID}:`, userRecord.length);
      if (userRecord.length > 0) {
        console.log('📋 [INVESTIGAÇÃO] Dados encontrados:', JSON.stringify(userRecord, null, 2));
      }
    }
    
    // 4. Verificar se existe o registro mencionado pelo usuário
    console.log('\n4️⃣ [INVESTIGAÇÃO] Procurando registro com freesongsused = 2...');
    const { data: problematicRecord, error: problematicError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('freesongsused', 2);
    
    if (problematicError) {
      console.error('❌ [INVESTIGAÇÃO] Erro ao buscar registros com freesongsused = 2:', problematicError.message);
    } else {
      console.log(`📊 [INVESTIGAÇÃO] Registros com freesongsused = 2:`, problematicRecord.length);
      if (problematicRecord.length > 0) {
        console.log('📋 [INVESTIGAÇÃO] Registros problemáticos encontrados:');
        problematicRecord.forEach((record, index) => {
          console.log(`   ${index + 1}. Device ID: ${record.device_id}`);
          console.log(`      User ID: ${record.user_id}`);
          console.log(`      Criações: ${record.creations}`);
          console.log(`      Músicas gratuitas: ${record.freesongsused}`);
          console.log(`      Criado em: ${record.created_at}`);
          console.log(`      Atualizado em: ${record.updated_at}`);
          console.log('      ---');
        });
      }
    }
    
    // 5. Verificar estrutura da tabela
    console.log('\n5️⃣ [INVESTIGAÇÃO] Verificando estrutura da tabela...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'user_creations' })
      .single();
    
    if (tableError) {
      console.log('⚠️ [INVESTIGAÇÃO] Não foi possível obter estrutura da tabela via RPC');
      
      // Tentar uma consulta simples para ver as colunas
      const { data: sampleData, error: sampleError } = await supabase
        .from('user_creations')
        .select('*')
        .limit(1);
      
      if (!sampleError && sampleData && sampleData.length > 0) {
        console.log('📋 [INVESTIGAÇÃO] Colunas detectadas:', Object.keys(sampleData[0]));
      }
    } else {
      console.log('📋 [INVESTIGAÇÃO] Estrutura da tabela:', tableInfo);
    }
    
  } catch (error) {
    console.error('💥 [INVESTIGAÇÃO] Erro geral:', error.message);
  }
}

// Executar investigação
investigateUserCreations()
  .then(() => {
    console.log('\n🎉 [INVESTIGAÇÃO] Investigação detalhada concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ [INVESTIGAÇÃO] Falha na investigação:', error.message);
    process.exit(1);
  });