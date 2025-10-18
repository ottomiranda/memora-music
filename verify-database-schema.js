require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ [SCHEMA] Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseSchema() {
  console.log('🔍 [SCHEMA] Verificando esquema atual do banco de dados');
  console.log('📋 [SCHEMA] Supabase URL:', supabaseUrl);
  
  try {
    // 1. Verificar estrutura da tabela user_creations
    console.log('\n1️⃣ [SCHEMA] Verificando estrutura da tabela user_creations...');
    const { data: userCreationsData, error: userCreationsError } = await supabase
      .from('user_creations')
      .select('*')
      .limit(1);
    
    if (userCreationsError) {
      console.log('❌ [SCHEMA] Erro ao acessar user_creations:', userCreationsError.message);
    } else {
      console.log('✅ [SCHEMA] Tabela user_creations acessível');
      console.log('📊 [SCHEMA] Registros atuais:', userCreationsData?.length || 0);
    }

    // 2. Verificar estrutura da tabela songs
    console.log('\n2️⃣ [SCHEMA] Verificando estrutura da tabela songs...');
    const { data: songsData, error: songsError } = await supabase
      .from('songs')
      .select('*')
      .limit(1);
    
    if (songsError) {
      console.log('❌ [SCHEMA] Erro ao acessar songs:', songsError.message);
    } else {
      console.log('✅ [SCHEMA] Tabela songs acessível');
      console.log('📊 [SCHEMA] Registros atuais:', songsData?.length || 0);
      if (songsData && songsData.length > 0) {
        console.log('📋 [SCHEMA] Colunas disponíveis em songs:', Object.keys(songsData[0]));
      }
    }

    // 3. Tentar descobrir as colunas corretas da tabela user_creations
    console.log('\n3️⃣ [SCHEMA] Tentando descobrir colunas da tabela user_creations...');
    const { data: emptyUserCreations, error: emptyError } = await supabase
      .from('user_creations')
      .select('*')
      .limit(0);
    
    if (!emptyError) {
      console.log('✅ [SCHEMA] Query vazia executada com sucesso');
    }

    // 4. Verificar se existem outras tabelas relacionadas
    console.log('\n4️⃣ [SCHEMA] Verificando outras tabelas relacionadas...');
    
    const tablesToCheck = ['users', 'user_sessions', 'profiles'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ [SCHEMA] Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ [SCHEMA] Tabela ${table} acessível com ${data?.length || 0} registros`);
          if (data && data.length > 0) {
            console.log(`📋 [SCHEMA] Colunas em ${table}:`, Object.keys(data[0]));
          }
        }
      } catch (err) {
        console.log(`❌ [SCHEMA] Erro ao verificar tabela ${table}:`, err.message);
      }
    }

    // 5. Tentar inserir um registro de teste em user_creations para ver quais campos são obrigatórios
    console.log('\n5️⃣ [SCHEMA] Testando inserção em user_creations para descobrir campos obrigatórios...');
    
    const testDeviceId = 'test-schema-verification-' + Date.now();
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_creations')
      .insert({
        device_id: testDeviceId,
        creations: 0,
        freesongsused: 0
      })
      .select();
    
    if (insertError) {
      console.log('❌ [SCHEMA] Erro na inserção de teste:', insertError.message);
      console.log('📋 [SCHEMA] Detalhes do erro:', insertError);
    } else {
      console.log('✅ [SCHEMA] Inserção de teste bem-sucedida');
      console.log('📊 [SCHEMA] Dados inseridos:', insertData);
      
      // Limpar o registro de teste
      await supabase
        .from('user_creations')
        .delete()
        .eq('device_id', testDeviceId);
      console.log('🧹 [SCHEMA] Registro de teste removido');
    }

  } catch (error) {
    console.error('❌ [SCHEMA] Erro geral:', error);
  }
  
  console.log('\n🎉 [SCHEMA] Verificação do esquema concluída!');
}

verifyDatabaseSchema().catch(console.error);