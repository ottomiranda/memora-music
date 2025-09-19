const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

// Clientes Supabase
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

// Dados de teste
const testUser = {
  email: 'teste@memora.music',
  password: 'testpassword123',
  userId: 'fc3ee46b-2802-413b-a357-0093bb12e435'
};

const testSong = {
  title: 'Teste Fluxo Completo',
  genre: 'Pop',
  mood: 'Happy',
  lyrics: 'Esta é uma música de teste para verificar o fluxo completo',
  ispaid: false
};

async function testCompleteFlow() {
  console.log('🧪 INICIANDO TESTE DO FLUXO COMPLETO\n');
  
  try {
    // 1. TESTE DE PROTEÇÃO DE ROTA (usuário anônimo)
    console.log('1️⃣ TESTANDO PROTEÇÃO DE ROTA (usuário anônimo)');
    const { data: anonSongs, error: anonError } = await anonClient
      .from('songs')
      .select('*')
      .eq('user_id', testUser.userId);
    
    if (anonError) {
      console.log('✅ Proteção funcionando: usuário anônimo não pode ver músicas privadas');
      console.log(`   Erro: ${anonError.message}`);
    } else {
      console.log('❌ PROBLEMA: usuário anônimo conseguiu acessar músicas privadas');
      console.log(`   Músicas encontradas: ${anonSongs?.length || 0}`);
    }
    
    // 2. AUTENTICAÇÃO DO USUÁRIO
    console.log('\n2️⃣ AUTENTICANDO USUÁRIO');
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (authError) {
      console.log('❌ Erro na autenticação:', authError.message);
      return;
    }
    
    console.log('✅ Usuário autenticado com sucesso');
    console.log(`   User ID: ${authData.user.id}`);
    
    // Cliente autenticado
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });
    
    // 3. VERIFICAR CONTADORES ANTES DA CRIAÇÃO
    console.log('\n3️⃣ VERIFICANDO CONTADORES ANTES DA CRIAÇÃO');
    const { data: beforeCreations, error: beforeError } = await serviceClient
      .from('user_creations')
      .select('*')
      .eq('user_id', testUser.userId)
      .single();
    
    if (beforeError) {
      console.log('⚠️  Nenhum registro encontrado em user_creations');
    } else {
      console.log('📊 Estado atual dos contadores:');
      console.log(`   Criações registradas: ${beforeCreations.creations}`);
      console.log(`   Músicas gratuitas usadas: ${beforeCreations.freesongsused}`);
    }
    
    // Contar músicas reais na tabela songs
    const { data: actualSongs, error: songsError } = await serviceClient
      .from('songs')
      .select('id, title, ispaid')
      .eq('user_id', testUser.userId);
    
    if (!songsError) {
      console.log(`   Músicas reais na tabela: ${actualSongs.length}`);
      const freeSongs = actualSongs.filter(s => !s.ispaid).length;
      console.log(`   Músicas gratuitas reais: ${freeSongs}`);
    }
    
    // 4. CRIAR NOVA MÚSICA
    console.log('\n4️⃣ CRIANDO NOVA MÚSICA');
    const { data: newSong, error: createError } = await authClient
      .from('songs')
      .insert({
        ...testSong,
        user_id: testUser.userId,
        generation_status: 'completed'
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar música:', createError.message);
      return;
    }
    
    console.log('✅ Música criada com sucesso');
    console.log(`   ID: ${newSong.id}`);
    console.log(`   Título: ${newSong.title}`);
    
    // 5. VERIFICAR CONTADORES APÓS CRIAÇÃO
    console.log('\n5️⃣ VERIFICANDO CONTADORES APÓS CRIAÇÃO');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar trigger
    
    const { data: afterCreations, error: afterError } = await serviceClient
      .from('user_creations')
      .select('*')
      .eq('user_id', testUser.userId)
      .single();
    
    if (afterError) {
      console.log('❌ Erro ao buscar contadores:', afterError.message);
    } else {
      console.log('📊 Estado dos contadores após criação:');
      console.log(`   Criações registradas: ${afterCreations.creations}`);
      console.log(`   Músicas gratuitas usadas: ${afterCreations.freesongsused}`);
      
      // Verificar se os contadores estão corretos
      const expectedCreations = (beforeCreations?.creations || 0) + 1;
      const expectedFree = (beforeCreations?.freesongsused || 0) + (testSong.ispaid ? 0 : 1);
      
      if (afterCreations.creations === expectedCreations) {
        console.log('✅ Contador de criações está correto');
      } else {
        console.log(`❌ Contador de criações incorreto. Esperado: ${expectedCreations}, Atual: ${afterCreations.creations}`);
      }
      
      if (afterCreations.freesongsused === expectedFree) {
        console.log('✅ Contador de músicas gratuitas está correto');
      } else {
        console.log(`❌ Contador de músicas gratuitas incorreto. Esperado: ${expectedFree}, Atual: ${afterCreations.freesongsused}`);
      }
    }
    
    // 6. TESTAR ACESSO ÀS MÚSICAS (usuário autenticado)
    console.log('\n6️⃣ TESTANDO ACESSO ÀS MÚSICAS (usuário autenticado)');
    const { data: userSongs, error: userSongsError } = await authClient
      .from('songs')
      .select('id, title, generation_status')
      .eq('user_id', testUser.userId);
    
    if (userSongsError) {
      console.log('❌ Erro ao buscar músicas do usuário:', userSongsError.message);
    } else {
      console.log(`✅ Usuário autenticado pode ver suas ${userSongs.length} músicas`);
      console.log(`   Incluindo a música recém-criada: ${userSongs.some(s => s.id === newSong.id) ? 'SIM' : 'NÃO'}`);
    }
    
    // 7. LIMPEZA - REMOVER MÚSICA DE TESTE
    console.log('\n7️⃣ LIMPEZA - REMOVENDO MÚSICA DE TESTE');
    const { error: deleteError } = await serviceClient
      .from('songs')
      .delete()
      .eq('id', newSong.id);
    
    if (deleteError) {
      console.log('⚠️  Erro ao remover música de teste:', deleteError.message);
    } else {
      console.log('✅ Música de teste removida com sucesso');
      
      // Verificar se o contador foi atualizado
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar trigger
      
      const { data: finalCreations } = await serviceClient
        .from('user_creations')
        .select('creations, freesongsused')
        .eq('user_id', testUser.userId)
        .single();
      
      if (finalCreations) {
        console.log('📊 Contadores após remoção:');
        console.log(`   Criações: ${finalCreations.creations}`);
        console.log(`   Músicas gratuitas: ${finalCreations.freesongsused}`);
        
        const backToOriginal = finalCreations.creations === (beforeCreations?.creations || 0);
        console.log(`   Voltou ao estado original: ${backToOriginal ? 'SIM' : 'NÃO'}`);
      }
    }
    
    // 8. LOGOUT
    console.log('\n8️⃣ FAZENDO LOGOUT');
    await anonClient.auth.signOut();
    console.log('✅ Logout realizado com sucesso');
    
    console.log('\n🎉 TESTE DO FLUXO COMPLETO FINALIZADO');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testCompleteFlow().then(() => {
  console.log('\n✨ Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});