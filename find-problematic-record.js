// Script para encontrar o registro problemático mencionado pelo usuário
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEVICE_ID = "0315a2fe-220a-401b-b1b9-055a27733360";

async function findProblematicRecord() {
  console.log('🔍 [BUSCA] Procurando registro problemático mencionado pelo usuário');
  console.log('📋 [BUSCA] Device ID:', DEVICE_ID);
  console.log('📋 [BUSCA] Dados esperados: freesongsused = 2, creations = 1');
  
  try {
    // 1. Verificar se existe alguma tabela similar a "freesound"
    console.log('\n1️⃣ [BUSCA] Verificando tabelas disponíveis...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables')
      .single();
    
    if (tablesError) {
      console.log('⚠️ [BUSCA] Não foi possível listar tabelas via RPC');
      
      // Tentar buscar em tabelas conhecidas
      const knownTables = ['user_creations', 'users', 'songs', 'user_sessions'];
      
      for (const tableName of knownTables) {
        console.log(`\n2️⃣ [BUSCA] Verificando tabela: ${tableName}`);
        
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .or(`device_id.eq.${DEVICE_ID},user_id.eq.${DEVICE_ID},id.eq.${DEVICE_ID}`)
            .limit(5);
          
          if (!error && data && data.length > 0) {
            console.log(`📊 [BUSCA] Registros encontrados em ${tableName}:`, data.length);
            data.forEach((record, index) => {
              console.log(`   ${index + 1}. ${JSON.stringify(record, null, 2)}`);
            });
          } else if (!error) {
            console.log(`📊 [BUSCA] Nenhum registro encontrado em ${tableName}`);
          } else {
            console.log(`❌ [BUSCA] Erro ao consultar ${tableName}:`, error.message);
          }
        } catch (err) {
          console.log(`❌ [BUSCA] Erro ao acessar ${tableName}:`, err.message);
        }
      }
    }
    
    // 3. Buscar especificamente por registros com freesongsused = 2
    console.log('\n3️⃣ [BUSCA] Procurando registros com freesongsused = 2 em todas as tabelas...');
    
    const tablesWithFreesongsused = ['user_creations', 'users'];
    
    for (const tableName of tablesWithFreesongsused) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('freesongsused', 2);
        
        if (!error && data && data.length > 0) {
          console.log(`🎯 [BUSCA] ENCONTRADO! Registros com freesongsused = 2 em ${tableName}:`);
          data.forEach((record, index) => {
            console.log(`   ${index + 1}. ${JSON.stringify(record, null, 2)}`);
          });
        } else if (!error) {
          console.log(`📊 [BUSCA] Nenhum registro com freesongsused = 2 em ${tableName}`);
        } else {
          console.log(`❌ [BUSCA] Erro ao consultar ${tableName}:`, error.message);
        }
      } catch (err) {
        console.log(`❌ [BUSCA] Erro ao acessar ${tableName}:`, err.message);
      }
    }
    
    // 4. Buscar por registros criados recentemente (últimas 24 horas)
    console.log('\n4️⃣ [BUSCA] Procurando registros criados nas últimas 24 horas...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (const tableName of ['user_creations', 'users']) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .gte('created_at', yesterday.toISOString())
          .order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          console.log(`📊 [BUSCA] Registros recentes em ${tableName}:`, data.length);
          data.forEach((record, index) => {
            if (index < 5) { // Mostrar apenas os 5 mais recentes
              console.log(`   ${index + 1}. Device: ${record.device_id || 'N/A'}, User: ${record.user_id || record.id || 'N/A'}, FreeSongs: ${record.freesongsused || 'N/A'}, Created: ${record.created_at}`);
            }
          });
        } else if (!error) {
          console.log(`📊 [BUSCA] Nenhum registro recente em ${tableName}`);
        }
      } catch (err) {
        console.log(`❌ [BUSCA] Erro ao buscar registros recentes em ${tableName}:`, err.message);
      }
    }
    
    // 5. Verificar se o registro pode estar em uma view ou tabela temporária
    console.log('\n5️⃣ [BUSCA] Verificando possíveis views ou tabelas temporárias...');
    
    const possibleTables = [
      'user_creations_view',
      'temp_user_creations', 
      'user_stats',
      'paywall_status',
      'creation_stats'
    ];
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ [BUSCA] Tabela ${tableName} existe!`);
          
          // Buscar o registro específico
          const { data: specificData, error: specificError } = await supabase
            .from(tableName)
            .select('*')
            .or(`device_id.eq.${DEVICE_ID},user_id.eq.${DEVICE_ID}`);
          
          if (!specificError && specificData && specificData.length > 0) {
            console.log(`🎯 [BUSCA] Registros encontrados em ${tableName}:`);
            specificData.forEach((record, index) => {
              console.log(`   ${index + 1}. ${JSON.stringify(record, null, 2)}`);
            });
          }
        }
      } catch (err) {
        // Tabela não existe, continuar
      }
    }
    
  } catch (error) {
    console.error('💥 [BUSCA] Erro geral:', error.message);
  }
}

// Executar busca
findProblematicRecord()
  .then(() => {
    console.log('\n🎉 [BUSCA] Busca pelo registro problemático concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ [BUSCA] Falha na busca:', error.message);
    process.exit(1);
  });