/**
 * Script para testar o comportamento de visibilidade das músicas
 * Investiga por que as músicas desaparecem quando user_creations é limpa
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjcwMzksImV4cCI6MjA3MjM0MzAzOX0.WNZc_C9DAHTmjOaJpm-1TbH4-ZGKbO4oZR5c-KlPuzg';

async function testSongsVisibility() {
  console.log('🔍 Testando visibilidade das músicas...');
  
  try {
    console.log('✅ Usando configuração do Supabase');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Verificar estado atual das tabelas
    console.log('\n📊 Estado atual das tabelas:');
    
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id, title, user_id, guest_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (songsError) {
      console.error('❌ Erro ao buscar songs:', songsError);
    } else {
      console.log(`📝 Total de músicas encontradas: ${songs.length}`);
      songs.forEach(song => {
        console.log(`  - ${song.title} (ID: ${song.id}, User: ${song.user_id}, Guest: ${song.guest_id})`);
      });
    }
    
    const { data: userCreations, error: creationsError } = await supabase
      .from('user_creations')
      .select('user_id, creations, updated_at')
      .order('updated_at', { ascending: false });
    
    if (creationsError) {
      console.error('❌ Erro ao buscar user_creations:', creationsError);
    } else {
      console.log(`\n👥 Total de user_creations encontradas: ${userCreations.length}`);
      userCreations.forEach(creation => {
        console.log(`  - User ${creation.user_id}: ${creation.creations} criações`);
      });
    }
    
    // 2. Testar políticas RLS
    console.log('\n🔒 Testando políticas RLS:');
    
    // Testar como usuário anônimo
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: anonSongs, error: anonError } = await anonSupabase
      .from('songs')
      .select('id, title')
      .limit(5);
    
    if (anonError) {
      console.log('❌ Usuário anônimo não pode acessar songs:', anonError.message);
    } else {
      console.log(`✅ Usuário anônimo pode ver ${anonSongs.length} músicas`);
    }
    
    // 3. Simular limpeza de user_creations e verificar impacto
    console.log('\n🧪 Simulando cenário de limpeza:');
    
    // Primeiro, vamos identificar um usuário com músicas
    const userWithSongs = songs.find(song => song.user_id);
    
    if (userWithSongs) {
      const userId = userWithSongs.user_id;
      console.log(`🎯 Testando com usuário: ${userId}`);
      
      // Contar músicas do usuário
      const { data: userSongs, error: userSongsError } = await supabase
        .from('songs')
        .select('id, title')
        .eq('user_id', userId);
      
      if (!userSongsError) {
        console.log(`📊 Usuário tem ${userSongs.length} músicas na tabela songs`);
      }
      
      // Verificar se existe entrada em user_creations
      const { data: userCreation, error: userCreationError } = await supabase
        .from('user_creations')
        .select('creations')
        .eq('user_id', userId)
        .single();
      
      if (userCreationError) {
        console.log(`❌ Usuário não tem entrada em user_creations: ${userCreationError.message}`);
      } else {
        console.log(`📊 user_creations mostra ${userCreation.creations} criações`);
      }
      
      // Testar query que simula o frontend
      console.log('\n🔍 Testando query do frontend:');
      
      // Simular autenticação (usando service_role para simular usuário autenticado)
      const { data: frontendSongs, error: frontendError } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (frontendError) {
        console.log(`❌ Query do frontend falhou: ${frontendError.message}`);
      } else {
        console.log(`✅ Query do frontend retornou ${frontendSongs.length} músicas`);
      }
    }
    
    // 4. Verificar triggers
    console.log('\n⚙️ Verificando triggers:');
    
    const { data: triggers, error: triggersError } = await supabase
      .rpc('get_triggers_info');
    
    if (triggersError) {
      console.log('❌ Não foi possível verificar triggers:', triggersError.message);
    } else {
      console.log('✅ Triggers encontrados:', triggers);
    }
    
    console.log('\n✅ Teste de visibilidade concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testSongsVisibility().catch(console.error);