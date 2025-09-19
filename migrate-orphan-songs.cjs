const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateOrphanSongs() {
  console.log('🔄 Iniciando migração de músicas órfãs...');
  
  try {
    // 1. Buscar Otto Miranda
    console.log('\n=== 1. BUSCANDO OTTO MIRANDA ===');
    const { data: users, error: usersError } = await supabase
      .rpc('get_users_by_email_or_name', { search_term: 'otto' });

    if (usersError || !users || users.length === 0) {
      console.log('❌ Erro ao buscar Otto Miranda:', usersError);
      return;
    }

    const ottoUser = users[0];
    console.log('✅ Otto encontrado:', ottoUser.email, '- ID:', ottoUser.id);

    // 2. Buscar músicas órfãs
    console.log('\n=== 2. BUSCANDO MÚSICAS ÓRFÃS ===');
    const { data: orphanSongs, error: orphanError } = await supabase
      .from('songs')
      .select('id, title, guest_id, created_at')
      .is('user_id', null)
      .not('guest_id', 'is', null);

    if (orphanError) {
      console.log('❌ Erro ao buscar músicas órfãs:', orphanError);
      return;
    }

    console.log(`🔍 Encontradas ${orphanSongs?.length || 0} músicas órfãs`);
    
    if (!orphanSongs || orphanSongs.length === 0) {
      console.log('✅ Nenhuma música órfã encontrada!');
      return;
    }

    // 3. Migrar músicas órfãs para Otto
    console.log('\n=== 3. MIGRANDO MÚSICAS ÓRFÃS ===');
    
    let migratedCount = 0;
    let errorCount = 0;

    for (const song of orphanSongs) {
      console.log(`\n🔄 Migrando: ${song.title} (Guest ID: ${song.guest_id})`);
      
      const { error: updateError } = await supabase
        .from('songs')
        .update({ 
          user_id: ottoUser.id,
          guest_id: null // Limpar guest_id após migração
        })
        .eq('id', song.id);

      if (updateError) {
        console.log(`❌ Erro ao migrar música ${song.id}:`, updateError);
        errorCount++;
      } else {
        console.log(`✅ Música migrada: ${song.title}`);
        migratedCount++;
      }
    }

    // 4. Atualizar contador de criações do usuário
    console.log('\n=== 4. ATUALIZANDO CONTADOR DE CRIAÇÕES ===');
    
    // Buscar total de músicas do Otto após migração
    const { data: totalSongs, error: countError } = await supabase
      .from('songs')
      .select('id', { count: 'exact' })
      .eq('user_id', ottoUser.id);

    if (countError) {
      console.log('❌ Erro ao contar músicas:', countError);
    } else {
      const totalCount = totalSongs?.length || 0;
      console.log(`📊 Total de músicas do Otto após migração: ${totalCount}`);
      
      // Atualizar ou inserir registro na tabela user_creations
      const { error: upsertError } = await supabase
        .from('user_creations')
        .upsert({
          device_id: ottoUser.id,
          user_id: ottoUser.id,
          creations: totalCount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'device_id'
        });

      if (upsertError) {
        console.log('❌ Erro ao atualizar contador:', upsertError);
      } else {
        console.log('✅ Contador de criações atualizado');
      }
    }

    // 5. Resumo final
    console.log('\n=== 📊 RESUMO DA MIGRAÇÃO ===');
    console.log(`✅ Músicas migradas com sucesso: ${migratedCount}`);
    console.log(`❌ Erros durante migração: ${errorCount}`);
    console.log(`📊 Total de músicas órfãs processadas: ${orphanSongs.length}`);
    
    if (migratedCount > 0) {
      console.log('\n🎉 Migração concluída com sucesso!');
      console.log('💡 As músicas órfãs foram transferidas para Otto Miranda.');
    }

  } catch (error) {
    console.log('❌ Erro geral na migração:', error);
  }
}

// Executar migração
migrateOrphanSongs();