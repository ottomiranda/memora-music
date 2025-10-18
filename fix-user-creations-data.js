import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixUserCreationsData() {
  console.log('🔧 Corrigindo dados inconsistentes na tabela user_creations...\n');
  
  const testDeviceId = '0315a2fe-220a-401b-b1b9-055a27733360';
  
  try {
    // 1. Buscar todas as músicas do usuário
    console.log('1️⃣ Buscando todas as músicas do usuário...');
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id, title, ispaid, created_at')
      .or(`user_id.eq.${testDeviceId},guest_id.eq.${testDeviceId}`)
      .order('created_at', { ascending: true });
    
    if (songsError) {
      console.error('❌ Erro ao buscar músicas:', songsError);
      return;
    }
    
    console.log(`🎵 Encontradas ${songs.length} músicas:`);
    songs.forEach((song, index) => {
      console.log(`   ${index + 1}. "${song.title}" - ${song.ispaid ? 'PAGA' : 'GRATUITA'} (${new Date(song.created_at).toLocaleString()})`);
    });
    
    // 2. Calcular contadores corretos
    const totalCreations = songs.length;
    const freeSongs = songs.filter(song => !song.ispaid);
    const correctFreeSongsUsed = freeSongs.length;
    
    console.log(`\n2️⃣ Calculando contadores corretos:`);
    console.log(`   - Total de criações: ${totalCreations}`);
    console.log(`   - Músicas gratuitas: ${correctFreeSongsUsed}`);
    
    // 3. Verificar estado atual
    console.log('\n3️⃣ Verificando estado atual...');
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
      creations: currentUser.creations,
      freesongsused: currentUser.freesongsused
    });
    
    console.log('📊 Estado correto:', {
      creations: totalCreations,
      freesongsused: correctFreeSongsUsed
    });
    
    // 4. Atualizar se necessário
    if (currentUser.creations !== totalCreations || currentUser.freesongsused !== correctFreeSongsUsed) {
      console.log('\n4️⃣ Atualizando contadores...');
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('user_creations')
        .update({
          creations: totalCreations,
          freesongsused: correctFreeSongsUsed,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', testDeviceId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Erro ao atualizar:', updateError);
        return;
      }
      
      console.log('✅ Contadores atualizados com sucesso!');
      console.log('📊 Novo estado:', {
        creations: updatedUser.creations,
        freesongsused: updatedUser.freesongsused
      });
    } else {
      console.log('\n✅ Contadores já estão corretos!');
    }
    
    // 5. Verificar lógica do paywall após correção
    console.log('\n5️⃣ Verificando lógica do paywall após correção...');
    const finalFreeSongsUsed = correctFreeSongsUsed;
    const shouldNextBePaid = finalFreeSongsUsed >= 1;
    
    console.log(`💰 Com freesongsused=${finalFreeSongsUsed}:`);
    console.log(`   - Primeira música (count=0): ${finalFreeSongsUsed === 0 ? 'GRATUITA ✅' : 'JÁ USADA'}`);
    console.log(`   - Segunda música (count=1): ${finalFreeSongsUsed >= 1 ? 'DEVE SER PAGA ✅' : 'AINDA GRATUITA'}`);
    console.log(`   - Próxima música deve ser: ${shouldNextBePaid ? 'PAGA ✅' : 'GRATUITA'}`);
    
    console.log(`\n🎯 RESULTADO FINAL:`);
    if (finalFreeSongsUsed >= 1) {
      console.log(`   ✅ O paywall DEVE bloquear a próxima música`);
      console.log(`   ✅ Usuário já usou ${finalFreeSongsUsed} música(s) gratuita(s)`);
    } else {
      console.log(`   ⚠️  A próxima música ainda será gratuita`);
      console.log(`   ⚠️  Usuário ainda não usou nenhuma música gratuita`);
    }
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

fixUserCreationsData();