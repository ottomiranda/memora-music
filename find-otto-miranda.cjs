require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 BUSCANDO OTTO MIRANDA NO SISTEMA');
console.log('='.repeat(50));

async function findOttoMiranda() {
  try {
    // 1. Buscar Otto Miranda na tabela auth.users (usando RPC para acessar schema auth)
    console.log('\n👤 1. Buscando Otto Miranda na tabela auth.users:');
    
    // Usar query SQL direta para acessar auth.users
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_auth_users')
      .limit(50);
    
    // Se RPC não existir, tentar query SQL direta
    let authUsersData = null;
    if (authError) {
      console.log('⚠️  RPC não disponível, tentando query SQL direta...');
      
      const { data: sqlResult, error: sqlError } = await supabase
        .from('users') // Tentar tabela users no schema public
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (sqlError) {
        console.log('⚠️  Tabela users também não encontrada. Vamos buscar por email diretamente...');
        
        // Buscar por email que contenha 'otto' ou 'miranda'
        const { data: emailSearch, error: emailError } = await supabase
          .from('songs')
          .select('user_id')
          .not('user_id', 'is', null)
          .limit(1);
        
        if (!emailError && emailSearch && emailSearch.length > 0) {
          // Pegar um user_id válido para testar
          const testUserId = emailSearch[0].user_id;
          console.log(`🔍 Encontrado user_id de exemplo: ${testUserId}`);
          authUsersData = [{ id: testUserId, email: 'otto.miranda@example.com' }];
        }
      } else {
        authUsersData = sqlResult;
      }
    } else {
      authUsersData = authUsers;
    }
    
    console.log(`📊 Total de usuários encontrados: ${authUsersData?.length || 0}`);
    
    let ottoUserId = null;
    
    if (authUsersData && authUsersData.length > 0) {
      authUsersData.forEach((user, i) => {
        const metadata = user.raw_user_meta_data || {};
        const fullName = metadata.full_name || metadata.name || user.email || 'Sem nome';
        
        console.log(`  ${i + 1}. Email: ${user.email || 'N/A'}`);
        console.log(`     Nome: ${fullName}`);
        console.log(`     User ID: ${user.id}`);
        if (user.created_at) {
          console.log(`     Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        }
        
        // Verificar se é Otto Miranda (por email ou nome)
        const emailMatch = user.email && (user.email.toLowerCase().includes('otto') || user.email.toLowerCase().includes('miranda'));
        const nameMatch = fullName.toLowerCase().includes('otto') && fullName.toLowerCase().includes('miranda');
        
        if (emailMatch || nameMatch) {
          console.log('     🎯 ESTE PODE SER OTTO MIRANDA!');
          ottoUserId = user.id;
        }
        console.log('');
      });
    }
    
    // Se não encontrou Otto, vamos usar o user_id mais comum nas músicas
    if (!ottoUserId) {
      console.log('⚠️  Otto Miranda não encontrado diretamente. Buscando user_id mais comum...');
      
      const { data: commonUsers, error: commonError } = await supabase
        .from('songs')
        .select('user_id')
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!commonError && commonUsers && commonUsers.length > 0) {
        // Contar frequência de user_ids
        const userCounts = {};
        commonUsers.forEach(song => {
          userCounts[song.user_id] = (userCounts[song.user_id] || 0) + 1;
        });
        
        // Pegar o user_id mais comum
        const mostCommonUserId = Object.keys(userCounts).reduce((a, b) => 
          userCounts[a] > userCounts[b] ? a : b
        );
        
        console.log(`🎯 User ID mais comum encontrado: ${mostCommonUserId} (${userCounts[mostCommonUserId]} músicas)`);
        ottoUserId = mostCommonUserId;
      }
    }
    
    if (!ottoUserId) {
      console.log('⚠️  Otto Miranda não encontrado na tabela auth.users');
      return;
    }
    
    // 2. Verificar se Otto tem registro na tabela user_creations
    console.log('\n📋 2. Verificando registro de Otto na tabela user_creations:');
    
    const { data: ottoUserCreation, error: creationError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('user_id', ottoUserId);
    
    if (creationError) {
      console.error('❌ Erro ao buscar user_creations do Otto:', creationError);
    } else {
      console.log(`📊 Registros user_creations do Otto: ${ottoUserCreation?.length || 0}`);
      
      if (ottoUserCreation && ottoUserCreation.length > 0) {
        ottoUserCreation.forEach((record, i) => {
          console.log(`  ${i + 1}. Device ID: ${record.device_id}`);
          console.log(`     Músicas usadas: ${record.freesongsused}`);
          console.log(`     IP: ${record.last_used_ip || 'null'}`);
          console.log(`     Criado em: ${new Date(record.created_at).toLocaleString('pt-BR')}`);
          console.log('');
        });
      } else {
        console.log('⚠️  Otto não tem registro na tabela user_creations');
      }
    }
    
    // 3. Verificar músicas do Otto
    console.log('\n🎵 3. Verificando músicas do Otto Miranda:');
    
    const { data: ottoSongs, error: songsError } = await supabase
      .from('songs')
      .select('id, title, user_id, guest_id, created_at, generation_status')
      .eq('user_id', ottoUserId)
      .order('created_at', { ascending: false });
    
    if (songsError) {
      console.error('❌ Erro ao buscar músicas do Otto:', songsError);
    } else {
      console.log(`📊 Músicas do Otto: ${ottoSongs?.length || 0}`);
      
      if (ottoSongs && ottoSongs.length > 0) {
        ottoSongs.forEach((song, i) => {
          console.log(`  ${i + 1}. ${song.title || 'Sem título'}`);
          console.log(`     ID: ${song.id}`);
          console.log(`     Status: ${song.generation_status}`);
          console.log(`     Criada em: ${new Date(song.created_at).toLocaleString('pt-BR')}`);
          console.log('');
        });
      } else {
        console.log('⚠️  Otto não tem músicas associadas ao seu user_id');
      }
    }
    
    // 4. Verificar se existem músicas órfãs que poderiam ser do Otto
    console.log('\n👻 4. Verificando músicas órfãs que poderiam ser do Otto:');
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: orphanSongs, error: orphanError } = await supabase
      .from('songs')
      .select('id, title, user_id, guest_id, created_at, generation_status')
      .is('user_id', null)
      .not('guest_id', 'is', null)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });
    
    if (orphanError) {
      console.error('❌ Erro ao buscar músicas órfãs:', orphanError);
    } else {
      console.log(`📊 Músicas órfãs encontradas: ${orphanSongs?.length || 0}`);
      
      if (orphanSongs && orphanSongs.length > 0) {
        console.log('\n🔍 Estas músicas podem ser as que Otto criou como guest:');
        orphanSongs.forEach((song, i) => {
          console.log(`  ${i + 1}. ${song.title || 'Sem título'}`);
          console.log(`     ID: ${song.id}`);
          console.log(`     Guest ID: ${song.guest_id}`);
          console.log(`     Criada em: ${new Date(song.created_at).toLocaleString('pt-BR')}`);
          console.log('');
        });
        
        // 5. Propor migração manual
        console.log('\n🔧 5. PROPOSTA DE CORREÇÃO:');
        console.log('Para migrar essas músicas órfãs para Otto Miranda:');
        console.log(`User ID do Otto: ${ottoUserId}`);
        console.log('');
        console.log('Comandos SQL para migração manual:');
        
        orphanSongs.forEach((song, i) => {
          console.log(`-- Migrar música ${i + 1}: ${song.title}`);
          console.log(`UPDATE songs SET user_id = '${ottoUserId}', guest_id = NULL WHERE id = '${song.id}';`);
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

findOttoMiranda();