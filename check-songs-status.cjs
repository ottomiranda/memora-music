require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 VERIFICANDO ESTADO ATUAL DAS MÚSICAS');
console.log('='.repeat(50));

async function checkSongsStatus() {
  try {
    // 1. Verificar músicas recentes (últimas 24 horas)
    console.log('\n🎵 1. Músicas criadas nas últimas 24 horas:');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentSongs, error: songsError } = await supabase
      .from('songs')
      .select('id, title, user_id, guest_id, created_at, generation_status')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (songsError) {
      console.error('❌ Erro ao buscar músicas:', songsError);
      return;
    }
    
    console.log(`📊 Total de músicas recentes: ${recentSongs?.length || 0}`);
    
    if (recentSongs && recentSongs.length > 0) {
      recentSongs.forEach((song, i) => {
        console.log(`  ${i + 1}. ${song.title || 'Sem título'}`);
        console.log(`     ID: ${song.id}`);
        console.log(`     User ID: ${song.user_id || 'null'}`);
        console.log(`     Guest ID: ${song.guest_id || 'null'}`);
        console.log(`     Status: ${song.generation_status}`);
        console.log(`     Criada em: ${new Date(song.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
    // 2. Verificar usuários recentes (buscar por todas as colunas disponíveis)
    console.log('\n👤 2. Verificando usuários recentes:');
    const { data: recentUsers, error: usersError } = await supabase
      .from('user_creations')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
    } else {
      console.log(`📊 Usuários recentes: ${recentUsers?.length || 0}`);
      
      if (recentUsers && recentUsers.length > 0) {
        recentUsers.forEach((user, i) => {
          console.log(`  ${i + 1}. User ID: ${user.user_id || 'null'}`);
          console.log(`     Device ID: ${user.device_id}`);
          console.log(`     Músicas gratuitas usadas: ${user.freesongsused}`);
          console.log(`     IP: ${user.last_used_ip || 'null'}`);
          console.log(`     Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
          console.log('');
        });
      }
    }
    
    // 3. Verificar músicas órfãs (guest_id sem user_id)
    console.log('\n👻 3. Músicas órfãs (criadas como guest, não migradas):');
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
        orphanSongs.forEach((song, i) => {
          console.log(`  ${i + 1}. ${song.title || 'Sem título'}`);
          console.log(`     ID: ${song.id}`);
          console.log(`     Guest ID: ${song.guest_id}`);
          console.log(`     Criada em: ${new Date(song.created_at).toLocaleString('pt-BR')}`);
          console.log('');
        });
        
        // Verificar se existe user_creations para esses guest_ids
        console.log('\n🔍 4. Verificando user_creations para guest_ids órfãos:');
        const guestIds = [...new Set(orphanSongs.map(song => song.guest_id))];
        
        for (const guestId of guestIds) {
          const { data: guestRecord, error: guestRecordError } = await supabase
            .from('user_creations')
            .select('*')
            .eq('device_id', guestId);
          
          if (guestRecordError) {
            console.error(`❌ Erro ao buscar registro para guest ${guestId}:`, guestRecordError);
          } else {
            console.log(`📋 Guest ID ${guestId}:`);
            if (guestRecord && guestRecord.length > 0) {
              guestRecord.forEach(record => {
                console.log(`   - User ID: ${record.user_id || 'null'}`);
                console.log(`   - Device ID: ${record.device_id}`);
                console.log(`   - Músicas usadas: ${record.freesongsused}`);
                console.log(`   - IP: ${record.last_used_ip || 'null'}`);
              });
            } else {
              console.log('   - Nenhum registro encontrado');
            }
            console.log('');
          }
        }
      } else {
        console.log('✅ Nenhuma música órfã encontrada');
      }
    }
    
    // 5. Buscar especificamente por Otto Miranda nos usuários autenticados
    console.log('\n🔍 5. Buscando Otto Miranda nos usuários autenticados:');
    
    // Primeiro, vamos ver quais usuários autenticados existem
    const { data: authUsers, error: authError } = await supabase
      .from('user_creations')
      .select('*')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários autenticados:', authError);
    } else {
      console.log(`📊 Usuários autenticados encontrados: ${authUsers?.length || 0}`);
      
      if (authUsers && authUsers.length > 0) {
        // Vamos buscar informações dos usuários na tabela auth.users
        for (const user of authUsers) {
          const { data: authUser, error: authUserError } = await supabase
            .from('auth.users')
            .select('id, email, raw_user_meta_data')
            .eq('id', user.user_id)
            .single();
          
          if (!authUserError && authUser) {
            const metadata = authUser.raw_user_meta_data || {};
            const fullName = metadata.full_name || metadata.name || 'Sem nome';
            
            console.log(`👤 User ID: ${user.user_id}`);
            console.log(`   Email: ${authUser.email}`);
            console.log(`   Nome: ${fullName}`);
            console.log(`   Device ID: ${user.device_id}`);
            console.log(`   Músicas usadas: ${user.freesongsused}`);
            console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
            
            // Verificar se é Otto Miranda
            if (fullName.toLowerCase().includes('otto') && fullName.toLowerCase().includes('miranda')) {
              console.log('   🎯 ESTE É OTTO MIRANDA!');
              
              // Verificar músicas deste usuário
              const { data: userSongs, error: userSongsError } = await supabase
                .from('songs')
                .select('id, title, created_at, generation_status')
                .eq('user_id', user.user_id)
                .order('created_at', { ascending: false });
              
              if (!userSongsError && userSongs) {
                console.log(`   🎵 Músicas do Otto: ${userSongs.length}`);
                userSongs.forEach((song, i) => {
                  console.log(`      ${i + 1}. ${song.title} (${new Date(song.created_at).toLocaleString('pt-BR')})`);
                });
              }
            }
            console.log('');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkSongsStatus();