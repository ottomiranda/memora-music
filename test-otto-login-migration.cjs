// Configuração das variáveis de ambiente antes de importar os serviços
process.env.SUPABASE_URL = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';

const { createClient } = require('@supabase/supabase-js');
const { SongService } = require('./src/lib/services/songService.js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuração do teste
const OTTO_EMAIL = 'otto@example.com';
const OTTO_NAME = 'Otto Miranda';
const TEST_DEVICE_ID = 'test-device-otto-' + Date.now();

async function testOttoLoginMigration() {
  console.log('🧪 === TESTE DE MIGRAÇÃO DO OTTO MIRANDA ===');
  console.log(`📱 Device ID: ${TEST_DEVICE_ID}`);
  
  try {
    // 1. Limpar dados de teste anteriores
    console.log('\n🧹 Limpando dados de teste anteriores...');
    await cleanupTestData();
    
    // 2. Simular criação de músicas como guest
    console.log('\n🎵 Criando músicas como guest...');
    const guestId = `guest-${Date.now()}`;
    const createdSongs = await createGuestSongs(guestId);
    console.log(`✅ Criadas ${createdSongs.length} músicas como guest: ${guestId}`);
    
    // 3. Verificar músicas guest criadas
    const guestSongsBeforeMigration = await getGuestSongs(guestId);
    console.log(`🔍 Músicas guest encontradas: ${guestSongsBeforeMigration.length}`);
    guestSongsBeforeMigration.forEach(song => {
      console.log(`   - ${song.title} (ID: ${song.id})`);
    });
    
    // 4. Simular login do Otto Miranda
    console.log('\n👤 Simulando login do Otto Miranda...');
    const ottoUser = await simulateOttoLogin();
    console.log(`✅ Otto logado com ID: ${ottoUser.id}`);
    
    // 5. Chamar API de migração
    console.log('\n🔄 Chamando API de migração...');
    const migrationResult = await callMigrationAPI(guestId, ottoUser.id, TEST_DEVICE_ID);
    console.log('📊 Resultado da migração:', migrationResult);
    
    // 6. Verificar se as músicas foram migradas
    console.log('\n🔍 Verificando migração...');
    const ottoSongsAfterMigration = await getUserSongs(ottoUser.id);
    const guestSongsAfterMigration = await getGuestSongs(guestId);
    
    console.log(`🎵 Músicas do Otto após migração: ${ottoSongsAfterMigration.length}`);
    ottoSongsAfterMigration.forEach(song => {
      console.log(`   - ${song.title} (ID: ${song.id}, user_id: ${song.user_id}, guest_id: ${song.guest_id})`);
    });
    
    console.log(`👻 Músicas guest restantes: ${guestSongsAfterMigration.length}`);
    guestSongsAfterMigration.forEach(song => {
      console.log(`   - ${song.title} (ID: ${song.id}, user_id: ${song.user_id}, guest_id: ${song.guest_id})`);
    });
    
    // 7. Análise dos resultados
    console.log('\n📈 === ANÁLISE DOS RESULTADOS ===');
    if (ottoSongsAfterMigration.length === createdSongs.length && guestSongsAfterMigration.length === 0) {
      console.log('✅ SUCESSO: Todas as músicas foram migradas corretamente!');
    } else {
      console.log('❌ FALHA: Migração não funcionou como esperado');
      console.log(`   - Esperado: ${createdSongs.length} músicas migradas`);
      console.log(`   - Atual: ${ottoSongsAfterMigration.length} músicas do Otto, ${guestSongsAfterMigration.length} músicas guest restantes`);
    }
    
    // 8. Verificar user_creations
    console.log('\n👥 Verificando tabela user_creations...');
    try {
      const { data: userCreations, error: userCreationsError } = await supabase
        .from('user_creations')
        .select('device_id, user_id, creations, last_used_ip, created_at, updated_at')
        .eq('user_id', ottoUser.id);
      
      if (userCreationsError) {
        console.error('Erro ao buscar user_creations:', userCreationsError);
      } else {
        console.log(`📊 Registros user_creations para Otto: ${userCreations.length}`);
        if (userCreations.length > 0) {
          userCreations.forEach(record => {
            console.log(`   - Device: ${record.device_id}, Criações: ${record.creations}, IP: ${record.last_used_ip}`);
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar user_creations:', error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    // Limpeza final
    console.log('\n🧹 Limpeza final...');
    await cleanupTestData();
    console.log('✅ Teste concluído');
  }
}

async function createGuestSongs(guestId) {
  const songs = [];
  
  for (let i = 1; i <= 2; i++) {
    const { data, error } = await supabase
      .from('songs')
      .insert({
        guest_id: guestId,
        title: `Música Guest ${i} - Otto Test`,
        lyrics: `Letra da música ${i} criada como guest`,
        prompt: `Prompt para música ${i}`,
        genre: 'pop',
        mood: 'happy',
        generation_status: 'completed',
        ispaid: false
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Erro ao criar música ${i}:`, error);
      throw error;
    }
    
    songs.push(data);
  }
  
  return songs;
}

async function getGuestSongs(guestId) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('guest_id', guestId)
    .is('user_id', null);
  
  if (error) {
    console.error('Erro ao buscar músicas guest:', error);
    throw error;
  }
  
  return data || [];
}

async function getUserSongs(userId) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Erro ao buscar músicas do usuário:', error);
    throw error;
  }
  
  return data || [];
}

async function simulateOttoLogin() {
  // Primeiro, verificar se Otto já existe
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  let ottoUser = existingUser.users.find(u => u.email === OTTO_EMAIL);
  
  if (!ottoUser) {
    // Criar usuário Otto se não existir
    const { data, error } = await supabase.auth.admin.createUser({
      email: OTTO_EMAIL,
      email_confirm: true,
      user_metadata: {
        name: OTTO_NAME
      }
    });
    
    if (error) {
      console.error('Erro ao criar usuário Otto:', error);
      throw error;
    }
    
    ottoUser = data.user;
  }
  
  return ottoUser;
}

async function callMigrationAPI(guestId, userId, deviceId) {
  try {
    // Testar diretamente a função de migração do SongService
    console.log(`🔄 Migrando músicas de ${guestId} para ${userId}...`);
    const migratedCount = await SongService.migrateGuestSongs(guestId, userId);
    
    return {
      success: true,
      message: `Migração concluída com sucesso! ${migratedCount} músicas migradas.`,
      data: {
        migratedCount,
        guestId,
        userId
      }
    };
  } catch (error) {
    console.error('Erro ao chamar migração:', error);
    throw error;
  }
}

async function getUserCreations(userId, deviceId) {
  const { data, error } = await supabase
    .from('user_creations')
    .select('*')
    .or(`id.eq.${userId},device_id.eq.${deviceId}`);
  
  if (error) {
    console.error('Erro ao buscar user_creations:', error);
    throw error;
  }
  
  return data || [];
}

async function cleanupTestData() {
  try {
    // Limpar músicas de teste
    await supabase
      .from('songs')
      .delete()
      .like('title', '%Otto Test%');
    
    // Limpar user_creations de teste
    await supabase
      .from('user_creations')
      .delete()
      .eq('device_id', TEST_DEVICE_ID);
    
    // Limpar usuário Otto de teste (opcional)
    const { data: users } = await supabase.auth.admin.listUsers();
    const ottoUser = users.users.find(u => u.email === OTTO_EMAIL);
    if (ottoUser) {
      await supabase
        .from('user_creations')
        .delete()
        .eq('id', ottoUser.id);
    }
    
  } catch (error) {
    console.warn('Aviso na limpeza:', error.message);
  }
}

// Executar o teste
testOttoLoginMigration().catch(console.error);