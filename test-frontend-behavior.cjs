/**
 * Script para testar o comportamento específico do frontend
 * Simula exatamente o que acontece quando user_creations é limpa
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjcwMzksImV4cCI6MjA3MjM0MzAzOX0.WNZc_C9DAHTmjOaJpm-1TbH4-ZGKbO4oZR5c-KlPuzg';

async function testFrontendBehavior() {
  console.log('🔍 Testando comportamento do frontend...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Identificar o usuário Otto Miranda
    const ottoUserId = '0315a2fe-220a-401b-b1b9-055a27733360';
    console.log(`🎯 Testando com usuário Otto: ${ottoUserId}`);
    
    // 1. Estado inicial - verificar músicas e user_creations
    console.log('\n📊 Estado inicial:');
    
    const { data: initialSongs, error: initialSongsError } = await supabase
      .from('songs')
      .select('id, title')
      .eq('user_id', ottoUserId);
    
    if (!initialSongsError) {
      console.log(`✅ Otto tem ${initialSongs.length} músicas na tabela songs`);
    }
    
    const { data: initialCreations, error: initialCreationsError } = await supabase
      .from('user_creations')
      .select('creations')
      .eq('user_id', ottoUserId)
      .single();
    
    if (!initialCreationsError) {
      console.log(`✅ user_creations mostra ${initialCreations.creations} criações`);
    }
    
    // 2. Simular requisição do frontend (como usuário anônimo)
    console.log('\n🌐 Simulando requisição do frontend como usuário anônimo:');
    
    // Testar a query que o frontend faria (sem autenticação)
    const { data: anonSongs, error: anonError } = await anonSupabase
      .from('songs')
      .select('*')
      .eq('user_id', ottoUserId)
      .order('created_at', { ascending: false });
    
    if (anonError) {
      console.log(`❌ Usuário anônimo não pode ver músicas do Otto: ${anonError.message}`);
    } else {
      console.log(`⚠️  Usuário anônimo pode ver ${anonSongs.length} músicas do Otto (PROBLEMA DE SEGURANÇA!)`);
    }
    
    // 3. Simular limpeza da tabela user_creations
    console.log('\n🧹 Simulando limpeza da tabela user_creations:');
    
    // Fazer backup do estado atual
    const backupCreations = initialCreations;
    
    // Limpar user_creations para Otto
    const { error: deleteError } = await supabase
      .from('user_creations')
      .delete()
      .eq('user_id', ottoUserId);
    
    if (deleteError) {
      console.log(`❌ Erro ao limpar user_creations: ${deleteError.message}`);
    } else {
      console.log('✅ user_creations limpa para Otto');
    }
    
    // 4. Verificar estado após limpeza
    console.log('\n📊 Estado após limpeza:');
    
    const { data: afterSongs, error: afterSongsError } = await supabase
      .from('songs')
      .select('id, title')
      .eq('user_id', ottoUserId);
    
    if (!afterSongsError) {
      console.log(`✅ Otto ainda tem ${afterSongs.length} músicas na tabela songs`);
    }
    
    const { data: afterCreations, error: afterCreationsError } = await supabase
      .from('user_creations')
      .select('creations')
      .eq('user_id', ottoUserId)
      .single();
    
    if (afterCreationsError) {
      console.log(`✅ user_creations não existe mais para Otto: ${afterCreationsError.message}`);
    } else {
      console.log(`⚠️  user_creations ainda existe: ${afterCreations.creations} criações`);
    }
    
    // 5. Testar requisição do frontend após limpeza
    console.log('\n🌐 Testando frontend após limpeza:');
    
    const { data: afterAnonSongs, error: afterAnonError } = await anonSupabase
      .from('songs')
      .select('*')
      .eq('user_id', ottoUserId)
      .order('created_at', { ascending: false });
    
    if (afterAnonError) {
      console.log(`❌ Após limpeza, usuário anônimo não pode ver músicas: ${afterAnonError.message}`);
    } else {
      console.log(`✅ Após limpeza, usuário anônimo ainda vê ${afterAnonSongs.length} músicas`);
    }
    
    // 6. Simular requisição autenticada (como seria no frontend real)
    console.log('\n🔐 Simulando requisição autenticada:');
    
    // Criar um cliente que simula um usuário autenticado
    // (Na prática, isso seria feito com JWT token, mas vamos usar service_role para simular)
    const { data: authSongs, error: authError } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', ottoUserId)
      .order('created_at', { ascending: false });
    
    if (authError) {
      console.log(`❌ Usuário autenticado não pode ver músicas: ${authError.message}`);
    } else {
      console.log(`✅ Usuário autenticado vê ${authSongs.length} músicas`);
    }
    
    // 7. Restaurar estado original
    console.log('\n🔄 Restaurando estado original:');
    
    if (backupCreations) {
      const { error: restoreError } = await supabase
        .from('user_creations')
        .insert({
          user_id: ottoUserId,
          creations: backupCreations.creations
        });
      
      if (restoreError) {
        console.log(`❌ Erro ao restaurar user_creations: ${restoreError.message}`);
      } else {
        console.log('✅ user_creations restaurada');
      }
    }
    
    // 8. Verificar políticas RLS específicas
    console.log('\n🔒 Analisando políticas RLS:');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'songs');
    
    if (policiesError) {
      console.log(`❌ Erro ao verificar políticas: ${policiesError.message}`);
    } else {
      console.log(`✅ Encontradas ${policies.length} políticas para a tabela songs:`);
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} para ${policy.roles}`);
      });
    }
    
    console.log('\n✅ Teste de comportamento do frontend concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testFrontendBehavior().catch(console.error);