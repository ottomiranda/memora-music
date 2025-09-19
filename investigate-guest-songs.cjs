require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateGuestSongs() {
  console.log('🔍 Investigando músicas guest não migradas...');
  console.log('==================================================');

  try {
    // 1. Buscar todas as músicas sem user_id (guest songs)
    console.log('\n1️⃣ Buscando músicas guest (sem user_id)...');
    const { data: guestSongs, error: guestError } = await supabase
      .from('songs')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false });

    if (guestError) {
      console.error('❌ Erro ao buscar músicas guest:', guestError);
      return;
    }

    console.log(`📊 Encontradas ${guestSongs.length} músicas guest:`);
    if (guestSongs.length > 0) {
      guestSongs.forEach((song, index) => {
        const title = song.title || 'Sem título';
        const date = new Date(song.created_at).toLocaleString('pt-BR');
        const deviceId = song.device_id || 'N/A';
        console.log(`   ${index + 1}. ${title} (${date}) - Device: ${deviceId}`);
      });
    }

    // 2. Verificar se existem device_ids específicos nas músicas guest
    if (guestSongs.length > 0) {
      console.log('\n2️⃣ Analisando device_ids das músicas guest...');
      const deviceIds = [...new Set(guestSongs.map(song => song.device_id).filter(Boolean))];
      console.log(`📱 Device IDs únicos encontrados: ${deviceIds.length}`);
      deviceIds.forEach((deviceId, index) => {
        const songsCount = guestSongs.filter(song => song.device_id === deviceId).length;
        console.log(`   ${index + 1}. ${deviceId} (${songsCount} músicas)`);
      });

      // 3. Verificar se algum desses device_ids está associado ao Otto
      console.log('\n3️⃣ Verificando associações de device_id com usuários...');
      for (const deviceId of deviceIds) {
        const { data: userCreation, error: creationError } = await supabase
          .from('user_creations')
          .select('*')
          .eq('device_id', deviceId)
          .single();

        if (!creationError && userCreation) {
          console.log(`🔗 Device ${deviceId} está associado ao user_id: ${userCreation.user_id}`);
          
          // Verificar quantas músicas este usuário tem
          const { data: userSongs, error: userSongsError } = await supabase
            .from('songs')
            .select('id')
            .eq('user_id', userCreation.user_id);

          if (!userSongsError) {
            console.log(`   👤 Este usuário tem ${userSongs.length} músicas migradas`);
          }
        } else {
          console.log(`❌ Device ${deviceId} não está associado a nenhum usuário`);
        }
      }
    }

    // 4. Verificar o usuário Otto especificamente
    console.log('\n4️⃣ Verificando informações do usuário Otto...');
    
    // Buscar o usuário com mais músicas (assumindo que é Otto)
    const { data: allSongs, error: allSongsError } = await supabase
      .from('songs')
      .select('user_id')
      .not('user_id', 'is', null);

    if (allSongsError) {
      console.error('❌ Erro ao buscar todas as músicas:', allSongsError);
      return;
    }

    // Contar músicas por usuário
    const userSongCounts = {};
    allSongs.forEach(song => {
      userSongCounts[song.user_id] = (userSongCounts[song.user_id] || 0) + 1;
    });

    // Encontrar usuário com mais músicas
    const ottoUserId = Object.keys(userSongCounts).reduce((a, b) => 
      userSongCounts[a] > userSongCounts[b] ? a : b
    );

    console.log(`👤 Usuário Otto (${ottoUserId}) tem ${userSongCounts[ottoUserId]} músicas`);

    // Verificar device_ids associados ao Otto
    const { data: ottoCreations, error: ottoCreationsError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('user_id', ottoUserId);

    if (!ottoCreationsError && ottoCreations.length > 0) {
      console.log(`📱 Device IDs associados ao Otto:`);
      ottoCreations.forEach((creation, index) => {
        console.log(`   ${index + 1}. ${creation.device_id} (${creation.freesongsused || 0} criações)`);
      });

      // Verificar se alguma música guest tem o device_id do Otto
      const ottoDeviceIds = ottoCreations.map(c => c.device_id);
      const unmigrated = guestSongs.filter(song => 
        ottoDeviceIds.includes(song.device_id)
      );

      if (unmigrated.length > 0) {
        console.log(`\n🚨 PROBLEMA ENCONTRADO: ${unmigrated.length} músicas guest com device_id do Otto não foram migradas!`);
        unmigrated.forEach((song, index) => {
          const title = song.title || 'Sem título';
          const date = new Date(song.created_at).toLocaleString('pt-BR');
          console.log(`   ${index + 1}. ${title} (${date}) - Device: ${song.device_id}`);
        });

        // Sugerir migração manual
        console.log('\n💡 Solução sugerida: Migrar essas músicas manualmente para o usuário Otto');
        console.log(`   UPDATE songs SET user_id = '${ottoUserId}' WHERE device_id IN ('${ottoDeviceIds.join("', '")}') AND user_id IS NULL;`);
      } else {
        console.log('\n✅ Nenhuma música guest encontrada com device_id do Otto');
      }
    }

    // 5. Verificar logs de migração recentes
    console.log('\n5️⃣ Verificando logs de migração recentes...');
    const { data: migrationLogs, error: logsError } = await supabase
      .rpc('log_migration', {
        p_action: 'query_recent',
        p_device_id: 'system',
        p_user_id: 'system',
        p_songs_count: 0,
        p_details: 'Consultando logs recentes'
      });

    if (!logsError) {
      console.log('📋 Logs de migração consultados com sucesso');
    }

    // Buscar logs diretamente da tabela
    const { data: logs, error: directLogsError } = await supabase
      .from('migration_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!directLogsError && logs.length > 0) {
      console.log(`📊 Últimos ${logs.length} logs de migração:`);
      logs.forEach((log, index) => {
        const date = new Date(log.created_at).toLocaleString('pt-BR');
        console.log(`   ${index + 1}. ${log.action} - ${log.details} (${date})`);
      });
    } else {
      console.log('📊 Nenhum log de migração encontrado');
    }

  } catch (error) {
    console.error('❌ Erro durante investigação:', error);
  }

  console.log('\n==================================================');
  console.log('✅ Investigação concluída!');
}

// Executar investigação
investigateGuestSongs();