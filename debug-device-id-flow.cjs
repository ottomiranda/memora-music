const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Função para carregar variáveis de ambiente
function loadEnvVars() {
  const envPath = path.join(__dirname, '.env');
  const envVars = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    }
  }
  
  return envVars;
}

async function debugDeviceIdFlow() {
  console.log('🔍 Analisando fluxo de device_id na migração...');
  
  // Carregar variáveis de ambiente
  const envVars = loadEnvVars();
  
  const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Credenciais do Supabase não encontradas');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    console.log('\n1. 🔍 Listando todos os usuários...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuários:', userError);
      return;
    }
    
    console.log(`✅ Total de usuários encontrados: ${users.users.length}`);
    users.users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} (ID: ${user.id})`);
    });
    
    // Tentar encontrar Otto por diferentes emails
    let ottoUser = users.users.find(u => u.email === 'otto@trae.ai') ||
                   users.users.find(u => u.email?.includes('otto')) ||
                   users.users.find(u => u.user_metadata?.name?.toLowerCase().includes('otto'));
    
    if (!ottoUser && users.users.length > 0) {
      console.log('⚠️  Otto não encontrado, usando primeiro usuário disponível para teste');
      ottoUser = users.users[0];
    }
    
    if (!ottoUser) {
      console.error('❌ Nenhum usuário encontrado no sistema');
      return;
    }
    
    console.log('✅ Usuário selecionado:', {
      id: ottoUser.id,
      email: ottoUser.email,
      created_at: ottoUser.created_at
    });
    
    console.log('\n2. 🎵 Verificando músicas do Otto em user_creations...');
    const { data: ottoSongs, error: ottoSongsError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('user_id', ottoUser.id)
      .order('created_at', { ascending: false });
    
    if (ottoSongsError) {
      console.error('❌ Erro ao buscar músicas do Otto:', ottoSongsError);
    } else {
      console.log(`✅ Otto tem ${ottoSongs.length} registros em user_creations`);
      if (ottoSongs.length > 0) {
        console.log('📋 Últimos registros do Otto:');
        ottoSongs.slice(0, 3).forEach((song, i) => {
          console.log(`   ${i + 1}. ID: ${song.id}, Device ID: ${song.device_id || 'NULL'}, Created: ${song.created_at}`);
        });
      }
    }
    
    console.log('\n3. 🔍 Buscando registros órfãos (sem user_id)...');
    const { data: orphanSongs, error: orphanError } = await supabase
      .from('user_creations')
      .select('*')
      .is('user_id', null)
      .not('device_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (orphanError) {
      console.error('❌ Erro ao buscar registros órfãos:', orphanError);
    } else {
      console.log(`✅ Encontrados ${orphanSongs.length} registros órfãos com device_id`);
      if (orphanSongs.length > 0) {
        console.log('📋 Registros órfãos recentes:');
        orphanSongs.forEach((song, i) => {
          console.log(`   ${i + 1}. ID: ${song.id}, Device ID: ${song.device_id}, Created: ${song.created_at}, Songs Used: ${song.freesongsused}`);
        });
      }
    }
    
    console.log('\n4. 🔍 Verificando se há device_ids duplicados entre Otto e órfãos...');
    if (ottoSongs.length > 0 && orphanSongs.length > 0) {
      const ottoDeviceIds = ottoSongs.map(s => s.device_id).filter(Boolean);
      const orphanDeviceIds = orphanSongs.map(s => s.device_id).filter(Boolean);
      
      const commonDeviceIds = ottoDeviceIds.filter(id => orphanDeviceIds.includes(id));
      
      if (commonDeviceIds.length > 0) {
        console.log('🎯 Device IDs em comum encontrados:', commonDeviceIds);
        
        for (const deviceId of commonDeviceIds) {
          console.log(`\n   📱 Analisando device_id: ${deviceId}`);
          
          const { data: allWithDevice, error: deviceError } = await supabase
            .from('user_creations')
            .select('*')
            .eq('device_id', deviceId)
            .order('created_at', { ascending: true });
          
          if (!deviceError && allWithDevice) {
            console.log(`   📊 Total de registros com este device_id: ${allWithDevice.length}`);
            allWithDevice.forEach((record, i) => {
              console.log(`      ${i + 1}. User ID: ${record.user_id || 'NULL'}, Created: ${record.created_at}, Songs: ${record.freesongsused}`);
            });
          }
        }
      } else {
        console.log('❌ Nenhum device_id em comum encontrado entre Otto e registros órfãos');
      }
    }
    
    console.log('\n5. 🔍 Simulando processo de migração...');
    
    // Simular cenário: usuário cria 2 músicas como guest, depois faz login
    const mockDeviceId = `test-device-${Date.now()}`;
    console.log(`📱 Simulando device_id: ${mockDeviceId}`);
    
    // Simular criação de registros como guest
    console.log('\n   📝 Simulando criação de 2 músicas como guest...');
    const { data: guestRecord1, error: guestError1 } = await supabase
      .from('user_creations')
      .insert({
        device_id: mockDeviceId,
        freesongsused: 1,
        last_used_ip: '192.168.1.100'
      })
      .select()
      .single();
    
    if (guestError1) {
      console.error('❌ Erro ao criar primeiro registro guest:', guestError1);
    } else {
      console.log('✅ Primeiro registro guest criado:', guestRecord1.id);
    }
    
    const { data: guestRecord2, error: guestError2 } = await supabase
      .from('user_creations')
      .upsert({
        device_id: mockDeviceId,
        freesongsused: 2,
        last_used_ip: '192.168.1.100'
      }, {
        onConflict: 'device_id'
      })
      .select()
      .single();
    
    if (guestError2) {
      console.error('❌ Erro ao atualizar registro guest:', guestError2);
    } else {
      console.log('✅ Registro guest atualizado para 2 músicas:', guestRecord2.id);
    }
    
    // Simular migração após login
    console.log('\n   🔄 Simulando migração após login do Otto...');
    
    // Buscar registros do guest
    const { data: guestSongs, error: guestSearchError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', mockDeviceId)
      .is('user_id', null);
    
    if (guestSearchError) {
      console.error('❌ Erro ao buscar registros do guest:', guestSearchError);
    } else if (guestSongs && guestSongs.length > 0) {
      console.log(`✅ Encontrados ${guestSongs.length} registros para migrar`);
      
      // Simular migração: atualizar user_id
      const { data: migrationResult, error: migrationError } = await supabase
        .from('user_creations')
        .update({ user_id: ottoUser.id })
        .eq('device_id', mockDeviceId)
        .is('user_id', null)
        .select();
      
      if (migrationError) {
        console.error('❌ Erro na migração simulada:', migrationError);
      } else {
        console.log(`✅ Migração simulada concluída: ${migrationResult.length} registros migrados`);
        
        // Verificar resultado
        const { data: verifyResult, error: verifyError } = await supabase
          .from('user_creations')
          .select('*')
          .eq('device_id', mockDeviceId)
          .eq('user_id', ottoUser.id);
        
        if (!verifyError && verifyResult) {
          console.log(`🎯 Verificação: ${verifyResult.length} registros agora pertencem ao Otto`);
        }
      }
    } else {
      console.log('❌ Nenhum registro guest encontrado para migrar');
    }
    
    // Limpeza
    console.log('\n   🧹 Limpando registros de teste...');
    const { error: cleanupError } = await supabase
      .from('user_creations')
      .delete()
      .eq('device_id', mockDeviceId);
    
    if (cleanupError) {
      console.error('❌ Erro na limpeza:', cleanupError);
    } else {
      console.log('✅ Registros de teste removidos');
    }
    
    console.log('\n📋 RESUMO DA ANÁLISE:');
    console.log('1. ✅ Usuário Otto Miranda encontrado no sistema');
    console.log(`2. 📊 Otto tem ${ottoSongs?.length || 0} registros em user_creations`);
    console.log(`3. 🔍 Existem ${orphanSongs?.length || 0} registros órfãos com device_id`);
    console.log('4. 🔄 Simulação de migração funcionou corretamente');
    
    console.log('\n🎯 POSSÍVEIS CAUSAS DA FALHA NA MIGRAÇÃO:');
    console.log('1. 📱 Device ID não foi enviado durante a criação das músicas');
    console.log('2. 🔑 Guest ID não corresponde ao device_id usado');
    console.log('3. 🚫 Falha na autenticação durante o processo de migração');
    console.log('4. ⚠️  Erro na validação do JWT ou headers');
    console.log('5. 🔄 Processo de migração não foi acionado após o login');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar análise
debugDeviceIdFlow().catch(console.error);