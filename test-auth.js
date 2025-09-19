/**
 * Script de Teste de Autenticação Supabase
 * Testa conexão, autenticação e operações básicas
 */

import dotenv from 'dotenv';
import { 
  testSupabaseConnection,
  getSupabaseServiceClient,
  getSupabaseAnonClient,
  executeSupabaseQuery,
  getSupabaseConnectionStatus
} from './src/lib/supabase-client.js';

// Carregar variáveis de ambiente
dotenv.config();

// Debug das variáveis de ambiente
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Definida' : 'Não definida');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Definida' : 'Não definida');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Definida' : 'Não definida');
console.log('');

async function testSupabaseAuth() {
  console.log('=== TESTE DE AUTENTICAÇÃO SUPABASE ===\n');
  
  try {
    // 1. Teste de conectividade
    console.log('1. Testando conectividade...');
    const isConnected = await testSupabaseConnection();
    console.log(`   Status: ${isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO'}`);
    console.log(`   Status atual: ${getSupabaseConnectionStatus()}\n`);
    
    if (!isConnected) {
      console.error('❌ Falha na conectividade. Abortando testes.');
      return;
    }
    
    // 2. Teste com Service Role Key
    console.log('2. Testando Service Role Key...');
    try {
      const serviceClient = getSupabaseServiceClient();
      const { data: usersData, error: usersError } = await serviceClient
        .from('user_creations')
        .select('id, email')
        .limit(3);
      
      if (usersError) {
        console.error(`   ❌ Erro: ${usersError.message}`);
      } else {
        console.log(`   ✅ Service Role OK - ${usersData?.length || 0} usuários encontrados`);
      }
    } catch (error) {
      console.error(`   ❌ Exceção Service Role: ${error.message}`);
    }
    
    // 3. Teste com Anon Key
    console.log('\n3. Testando Anon Key...');
    try {
      const anonClient = getSupabaseAnonClient();
      const { data: songsData, error: songsError } = await anonClient
        .from('songs')
        .select('id, title')
        .limit(3);
      
      if (songsError) {
        console.error(`   ❌ Erro: ${songsError.message}`);
      } else {
        console.log(`   ✅ Anon Key OK - ${songsData?.length || 0} músicas encontradas`);
      }
    } catch (error) {
      console.error(`   ❌ Exceção Anon Key: ${error.message}`);
    }
    
    // 4. Teste de operações com retry
    console.log('\n4. Testando operações com retry...');
    try {
      const feedbackData = await executeSupabaseQuery(async (client) => {
        return client
          .from('mvp_feedback')
          .select('id, rating')
          .limit(3);
      });
      
      console.log(`   ✅ Query com retry OK - ${feedbackData?.length || 0} feedbacks encontrados`);
    } catch (error) {
      console.error(`   ❌ Erro na query com retry: ${error.message}`);
    }
    
    // 5. Teste de permissões
    console.log('\n5. Testando permissões das tabelas...');
    const tables = ['user_creations', 'songs', 'mvp_feedback'];
    
    for (const table of tables) {
      try {
        const { data, error } = await getSupabaseServiceClient()
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: Acesso OK`);
        }
      } catch (error) {
        console.error(`   ❌ ${table}: Exceção - ${error.message}`);
      }
    }
    
    console.log('\n=== TESTE CONCLUÍDO ===');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testSupabaseAuth().catch(console.error);