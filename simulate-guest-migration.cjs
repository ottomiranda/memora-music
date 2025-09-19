require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateGuestMigration() {
  console.log('🎭 Simulando cenário de migração guest → usuário...');
  console.log('==================================================');

  try {
    // 1. Identificar Otto
    const { data: allSongs, error: allSongsError } = await supabase
      .from('songs')
      .select('user_id')
      .not('user_id', 'is', null);

    if (allSongsError) {
      console.error('❌ Erro ao buscar todas as músicas:', allSongsError);
      return;
    }

    const userSongCounts = {};
    allSongs.forEach(song => {
      userSongCounts[song.user_id] = (userSongCounts[song.user_id] || 0) + 1;
    });

    const ottoUserId = Object.keys(userSongCounts).reduce((a, b) => 
      userSongCounts[a] > userSongCounts[b] ? a : b
    );

    console.log(`👤 Otto identificado: ${ottoUserId}`);

    // 2. Gerar um device_id único para simular um dispositivo guest
    const guestDeviceId = uuidv4();
    console.log(`📱 Device ID guest simulado: ${guestDeviceId}`);

    // 3. Criar 2 músicas como guest (sem user_id)
    console.log('\n🎵 Criando 2 músicas como guest...');
    
    const guestSong1 = {
      id: uuidv4(),
      title: 'Música Guest 1 - Teste de Migração',
      guest_id: guestDeviceId,
      user_id: null, // Guest song
      lyrics: 'Esta é uma música criada como guest para testar a migração',
      prompt: 'Teste de migração de música guest',
      genre: 'pop',
      mood: 'happy',
      audio_url_option1: 'https://example.com/guest-song-1.mp3',
      image_url: 'https://example.com/guest-song-1.jpg',
      generation_status: 'completed'
    };

    const guestSong2 = {
      id: uuidv4(),
      title: 'Música Guest 2 - Teste de Migração',
      guest_id: guestDeviceId,
      user_id: null, // Guest song
      lyrics: 'Esta é a segunda música criada como guest para testar a migração',
      prompt: 'Segundo teste de migração de música guest',
      genre: 'rock',
      mood: 'energetic',
      audio_url_option1: 'https://example.com/guest-song-2.mp3',
      image_url: 'https://example.com/guest-song-2.jpg',
      generation_status: 'completed'
    };

    // Inserir as músicas guest
    const { error: insertError } = await supabase
      .from('songs')
      .insert([guestSong1, guestSong2]);

    if (insertError) {
      console.error('❌ Erro ao criar músicas guest:', insertError);
      return;
    }

    console.log('✅ 2 músicas guest criadas com sucesso!');
    console.log(`   1. ${guestSong1.title} (${guestSong1.id})`);
    console.log(`   2. ${guestSong2.title} (${guestSong2.id})`);

    // 4. Simular login do Otto com o device_id guest (UPDATE do registro existente)
    console.log('\n👤 Simulando login do Otto com o device_id guest...');
    const { error: loginError } = await supabase
      .from('user_creations')
      .update({
        user_id: ottoUserId,
        last_used_ip: '192.168.1.100',
        updated_at: new Date().toISOString()
      })
      .eq('device_id', guestDeviceId);

    if (loginError) {
      console.error('❌ Erro ao atualizar user_creation:', loginError);
      return;
    }
    console.log('✅ Login simulado com sucesso!');

    // 5. Verificar se as músicas órfãs são detectadas
    console.log('\n🔍 Testando detecção de músicas órfãs...');
    
    const { data: orphanResult, error: orphanError } = await supabase
      .rpc('detect_orphan_songs');

    if (orphanError) {
      console.error('❌ Erro ao detectar músicas órfãs:', orphanError);
    } else {
      console.log('📊 Resultado da detecção:', orphanResult);
      
      if (orphanResult.has_orphans) {
        console.log(`🎵 ${orphanResult.orphan_count} músicas órfãs detectadas!`);
        console.log(`📱 Device IDs guest: ${orphanResult.guest_ids.join(', ')}`);
      } else {
        console.log('❌ Nenhuma música órfã detectada - pode haver problema na função');
      }
    }

    // 6. Simular migração das músicas órfãs para o usuário Otto
    console.log('\n🔄 Migrando músicas órfãs para o usuário Otto...');
    
    const { data: migratedSongs, error: migrationError } = await supabase
      .from('songs')
      .update({ 
        user_id: ottoUserId,
        guest_id: null, // Limpar guest_id após migração
        updated_at: new Date().toISOString()
      })
      .eq('guest_id', guestDeviceId)
      .is('user_id', null)
      .select();

    if (migrationError) {
      console.error('❌ Erro na migração:', migrationError);
    } else {
      console.log(`✅ ${migratedSongs.length} músicas migradas com sucesso!`);
      migratedSongs.forEach(song => {
        console.log(`   - ${song.title} agora pertence ao usuário ${ottoUserId}`);
      });
    }

    // 7. Verificar se as músicas foram realmente migradas
    console.log('\n✅ Verificando resultado da migração...');
    
    const { data: verifiedSongs, error: verifiedError } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', ottoUserId)
      .in('id', [guestSong1.id, guestSong2.id]);

    if (verifiedError) {
      console.error('❌ Erro ao verificar músicas migradas:', verifiedError);
    } else {
      console.log(`🎵 ${verifiedSongs.length} músicas encontradas com user_id do Otto:`);
      verifiedSongs.forEach((song, index) => {
        console.log(`   ${index + 1}. ${song.title} (${song.id})`);
        console.log(`      👤 User ID: ${song.user_id}`);
        console.log(`      📱 Guest ID: ${song.guest_id}`);
      });
    }

    // 8. Verificar se ainda existem músicas guest
    const { data: remainingGuest, error: remainingError } = await supabase
      .from('songs')
      .select('*')
      .is('user_id', null)
      .eq('guest_id', guestDeviceId);

    if (!remainingError) {
      if (remainingGuest.length > 0) {
        console.log(`⚠️ ${remainingGuest.length} músicas ainda estão como guest (migração incompleta)`);
        remainingGuest.forEach((song, index) => {
          console.log(`   ${index + 1}. ${song.title} (${song.id})`);
        });
      } else {
        console.log('✅ Nenhuma música guest restante - migração completa!');
      }
    }

    // Verificar músicas guest ainda não migradas
    const { data: remainingSongs, error: remainingError2 } = await supabase
      .from('songs')
      .select('*')
      .is('user_id', null)
      .eq('guest_id', guestDeviceId);

    if (!remainingError2) {
      console.log(`🔍 ${remainingSongs.length} músicas guest ainda não migradas`);
      if (remainingSongs.length > 0) {
        console.log('⚠️  Possível problema na migração automática!');
        remainingSongs.forEach(song => {
          console.log(`   - ${song.title} (Guest ID: ${song.guest_id})`);
        });
      }
    }

    // 9. Verificar logs de migração
    console.log('\n📋 Verificando logs de migração...');
    const { data: logs, error: logsError } = await supabase
      .from('migration_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!logsError && logs && logs.length > 0) {
      console.log(`📊 Últimos ${logs.length} logs:`);
      logs.forEach((log, index) => {
        const date = new Date(log.created_at).toLocaleString('pt-BR');
        console.log(`   ${index + 1}. ${log.action} - ${log.details} (${date})`);
      });
    } else {
      console.log('📊 Nenhum log de migração encontrado');
    }

    console.log('\n🧹 Limpeza: Removendo dados de teste...');
    
    // Remover as músicas de teste
    await supabase
      .from('songs')
      .delete()
      .in('id', [guestSong1.id, guestSong2.id]);
    
    // Remover a user_creation de teste
    await supabase
      .from('user_creations')
      .delete()
      .eq('device_id', guestDeviceId);
    
    console.log('✅ Dados de teste removidos');

  } catch (error) {
    console.error('❌ Erro durante simulação:', error);
  }

  console.log('\n==================================================');
  console.log('✅ Simulação concluída!');
}

// Executar simulação
simulateGuestMigration();