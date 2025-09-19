require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeOttoSongs() {
  console.log('🔍 Analisando histórico completo das músicas do Otto...');
  console.log('==================================================');

  try {
    // 1. Identificar Otto (usuário com mais músicas)
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

    console.log(`👤 Otto identificado: ${ottoUserId} (${userSongCounts[ottoUserId]} músicas)`);

    // 2. Buscar todas as músicas do Otto com detalhes completos
    console.log('\n2️⃣ Analisando todas as músicas do Otto...');
    const { data: ottoSongs, error: ottoSongsError } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', ottoUserId)
      .order('created_at', { ascending: true }); // Ordem cronológica

    if (ottoSongsError) {
      console.error('❌ Erro ao buscar músicas do Otto:', ottoSongsError);
      return;
    }

    console.log(`🎵 Total de músicas: ${ottoSongs.length}`);
    console.log('\n📋 Histórico cronológico das músicas:');
    
    ottoSongs.forEach((song, index) => {
      const title = song.title || 'Sem título';
      const date = new Date(song.created_at).toLocaleString('pt-BR');
      const deviceId = song.device_id || 'N/A';
      const hasUserId = song.user_id ? '✅' : '❌';
      
      console.log(`   ${index + 1}. ${title}`);
      console.log(`      📅 Criada em: ${date}`);
      console.log(`      📱 Device ID: ${deviceId}`);
      console.log(`      👤 User ID: ${hasUserId} ${song.user_id}`);
      console.log(`      🆔 Song ID: ${song.id}`);
      
      if (index < ottoSongs.length - 1) {
        console.log('');
      }
    });

    // 3. Analisar padrões de device_id
    console.log('\n3️⃣ Análise de device_ids...');
    const deviceIds = [...new Set(ottoSongs.map(song => song.device_id).filter(Boolean))];
    console.log(`📱 Device IDs únicos: ${deviceIds.length}`);
    
    deviceIds.forEach((deviceId, index) => {
      const songsWithDevice = ottoSongs.filter(song => song.device_id === deviceId);
      const firstSong = songsWithDevice[0];
      const lastSong = songsWithDevice[songsWithDevice.length - 1];
      
      console.log(`   ${index + 1}. Device: ${deviceId}`);
      console.log(`      🎵 Músicas: ${songsWithDevice.length}`);
      console.log(`      📅 Primeira: ${new Date(firstSong.created_at).toLocaleString('pt-BR')}`);
      console.log(`      📅 Última: ${new Date(lastSong.created_at).toLocaleString('pt-BR')}`);
    });

    // 4. Verificar user_creations para cada device_id
    console.log('\n4️⃣ Verificando user_creations...');
    for (const deviceId of deviceIds) {
      const { data: userCreation, error: creationError } = await supabase
        .from('user_creations')
        .select('*')
        .eq('device_id', deviceId)
        .single();

      if (!creationError && userCreation) {
        console.log(`📱 Device ${deviceId}:`);
        console.log(`   👤 User ID: ${userCreation.user_id}`);
        console.log(`   🎵 Criações usadas: ${userCreation.freesongsused || 0}`);
        console.log(`   📅 Criado em: ${new Date(userCreation.created_at).toLocaleString('pt-BR')}`);
        console.log(`   📅 Atualizado em: ${new Date(userCreation.updated_at).toLocaleString('pt-BR')}`);
        console.log(`   🌐 IP: ${userCreation.last_used_ip || 'N/A'}`);
      } else {
        console.log(`❌ Device ${deviceId}: Não encontrado em user_creations`);
      }
    }

    // 5. Verificar se há músicas recentes (últimas 24h)
    console.log('\n5️⃣ Verificando músicas recentes...');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentSongs = ottoSongs.filter(song => song.created_at > oneDayAgo);
    
    if (recentSongs.length > 0) {
      console.log(`🆕 ${recentSongs.length} músicas criadas nas últimas 24h:`);
      recentSongs.forEach((song, index) => {
        const title = song.title || 'Sem título';
        const date = new Date(song.created_at).toLocaleString('pt-BR');
        console.log(`   ${index + 1}. ${title} (${date})`);
      });
    } else {
      console.log('📊 Nenhuma música criada nas últimas 24h');
    }

    // 6. Verificar se o device_id do Otto é igual ao user_id (padrão após login)
    console.log('\n6️⃣ Verificando padrão de device_id...');
    const deviceIdEqualsUserId = ottoSongs.filter(song => song.device_id === song.user_id);
    const deviceIdDifferentFromUserId = ottoSongs.filter(song => song.device_id !== song.user_id);
    
    console.log(`✅ Músicas com device_id = user_id: ${deviceIdEqualsUserId.length}`);
    console.log(`⚠️ Músicas com device_id ≠ user_id: ${deviceIdDifferentFromUserId.length}`);
    
    if (deviceIdDifferentFromUserId.length > 0) {
      console.log('\n🔍 Músicas com device_id diferente (possíveis migrações):');
      deviceIdDifferentFromUserId.forEach((song, index) => {
        const title = song.title || 'Sem título';
        const date = new Date(song.created_at).toLocaleString('pt-BR');
        console.log(`   ${index + 1}. ${title} (${date})`);
        console.log(`      📱 Device: ${song.device_id}`);
        console.log(`      👤 User: ${song.user_id}`);
      });
    }

    // 7. Resumo final
    console.log('\n7️⃣ Resumo da análise...');
    console.log(`👤 Usuário Otto: ${ottoUserId}`);
    console.log(`🎵 Total de músicas: ${ottoSongs.length}`);
    console.log(`📱 Device IDs únicos: ${deviceIds.length}`);
    console.log(`🆕 Músicas recentes (24h): ${recentSongs.length}`);
    console.log(`✅ Músicas com device_id = user_id: ${deviceIdEqualsUserId.length}`);
    console.log(`⚠️ Músicas migradas (device_id ≠ user_id): ${deviceIdDifferentFromUserId.length}`);

  } catch (error) {
    console.error('❌ Erro durante análise:', error);
  }

  console.log('\n==================================================');
  console.log('✅ Análise concluída!');
}

// Executar análise
analyzeOttoSongs();