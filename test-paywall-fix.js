import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testPaywallFix() {
  console.log('🧪 Testando correção do paywall...\n');
  
  const testDeviceId = '0315a2fe-220a-401b-b1b9-055a27733360';
  
  try {
    // 1. Verificar estado atual do usuário
    console.log('1️⃣ Verificando estado atual do usuário...');
    const { data: currentUser, error: userError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testDeviceId)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    console.log('📊 Estado atual:', {
      device_id: currentUser.device_id,
      creations: currentUser.creations,
      freesongsused: currentUser.freesongsused
    });
    
    // 2. Testar lógica do paywall
    console.log('\n2️⃣ Testando lógica do paywall...');
    
    const shouldBePaid = currentUser.freesongsused >= 1;
    console.log(`💰 Com freesongsused=${currentUser.freesongsused}:`);
    console.log(`   - Primeira música (count=0): ${currentUser.freesongsused === 0 ? 'GRATUITA ✅' : 'PAGA ❌'}`);
    console.log(`   - Segunda música (count=1): ${currentUser.freesongsused >= 1 ? 'PAGA ✅' : 'GRATUITA ❌'}`);
    console.log(`   - Próxima música deve ser: ${shouldBePaid ? 'PAGA ✅' : 'GRATUITA ❌'}`);
    
    // 3. Verificar músicas criadas
    console.log('\n3️⃣ Verificando músicas criadas...');
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id, title, ispaid, created_at')
      .or(`user_id.eq.${testDeviceId},guest_id.eq.${testDeviceId}`)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (songsError) {
      console.error('❌ Erro ao buscar músicas:', songsError);
      return;
    }
    
    console.log(`🎵 Últimas ${songs.length} músicas criadas:`);
    songs.forEach((song, index) => {
      console.log(`   ${index + 1}. "${song.title}" - ${song.ispaid ? 'PAGA' : 'GRATUITA'} (${new Date(song.created_at).toLocaleString()})`);
    });
    
    // 4. Análise da correção
    console.log('\n4️⃣ Análise da correção:');
    const freeSongs = songs.filter(song => !song.ispaid);
    const paidSongs = songs.filter(song => song.ispaid);
    
    console.log(`   - Músicas gratuitas criadas: ${freeSongs.length}`);
    console.log(`   - Músicas pagas criadas: ${paidSongs.length}`);
    console.log(`   - Contador freesongsused: ${currentUser.freesongsused}`);
    console.log(`   - Contador creations: ${currentUser.creations}`);
    
    // Verificar se os contadores estão corretos
    const expectedFreeSongs = Math.min(freeSongs.length, 1); // Máximo 1 música gratuita
    const isCounterCorrect = currentUser.freesongsused === freeSongs.length;
    
    console.log(`\n✅ Análise dos contadores:`);
    console.log(`   - Músicas gratuitas esperadas: ${expectedFreeSongs}`);
    console.log(`   - Músicas gratuitas reais: ${freeSongs.length}`);
    console.log(`   - Contador freesongsused correto: ${isCounterCorrect ? '✅' : '❌'}`);
    
    if (currentUser.freesongsused >= 1) {
      console.log(`\n🎯 RESULTADO: O paywall DEVE bloquear a próxima música (freesongsused=${currentUser.freesongsused} >= 1)`);
    } else {
      console.log(`\n🎯 RESULTADO: A próxima música ainda será gratuita (freesongsused=${currentUser.freesongsused} < 1)`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testPaywallFix();