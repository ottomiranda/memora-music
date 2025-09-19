const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugMigrationFlow() {
  console.log('🔍 Debugando fluxo de migração para Otto Miranda');
  
  try {
    // 1. Encontrar Otto Miranda
    console.log('\n1. Buscando Otto Miranda...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    const otto = users.users.find(user => 
      user.email?.includes('otto') || 
      user.user_metadata?.name?.toLowerCase().includes('otto') ||
      user.user_metadata?.full_name?.toLowerCase().includes('otto')
    );
    
    if (!otto) {
      console.log('❌ Otto Miranda não encontrado');
      return;
    }
    
    console.log('✅ Otto encontrado:', {
      id: otto.id,
      email: otto.email,
      name: otto.user_metadata?.name || otto.user_metadata?.full_name,
      created_at: otto.created_at
    });
    
    // 2. Verificar músicas atuais de Otto
    console.log('\n2. Verificando músicas atuais de Otto...');
    const { data: ottoSongs, error: songsError } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', otto.id)
      .order('created_at', { ascending: false });
      
    if (songsError) {
      console.error('❌ Erro ao buscar músicas de Otto:', songsError);
    } else {
      console.log(`✅ Otto tem ${ottoSongs.length} músicas:`);
      ottoSongs.forEach((song, i) => {
        console.log(`   ${i+1}. ${song.title} (${song.created_at})`);
      });
    }
    
    // 3. Verificar se há músicas órfãs (guest_id sem user_id)
    console.log('\n3. Verificando músicas órfãs...');
    const { data: orphanSongs, error: orphanError } = await supabase
      .from('songs')
      .select('*')
      .is('user_id', null)
      .not('guest_id', 'is', null)
      .order('created_at', { ascending: false });
      
    if (orphanError) {
      console.error('❌ Erro ao buscar músicas órfãs:', orphanError);
    } else {
      console.log(`📦 Encontradas ${orphanSongs.length} músicas órfãs:`);
      orphanSongs.forEach((song, i) => {
        console.log(`   ${i+1}. ${song.title} (guest_id: ${song.guest_id}, created: ${song.created_at})`);
      });
    }
    
    // 4. Verificar registros em user_creations
    console.log('\n4. Verificando registros em user_creations...');
    
    // Otto autenticado
    const { data: ottoUserCreation, error: ottoUCError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('id', otto.id)
      .single();
      
    if (ottoUCError && ottoUCError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar user_creation de Otto:', ottoUCError);
    } else if (ottoUserCreation) {
      console.log('✅ Registro de Otto em user_creations:', {
        id: ottoUserCreation.id,
        email: ottoUserCreation.email,
        name: ottoUserCreation.name,
        status: ottoUserCreation.status,
        freesongsused: ottoUserCreation.freesongsused,
        device_id: ottoUserCreation.device_id
      });
    } else {
      console.log('⚠️ Otto não tem registro em user_creations');
    }
    
    // Registros de convidados
    if (orphanSongs.length > 0) {
      const guestIds = [...new Set(orphanSongs.map(song => song.guest_id))];
      console.log(`\n   Verificando registros de convidados para guest_ids: ${guestIds.join(', ')}`);
      
      for (const guestId of guestIds) {
        const { data: guestRecord, error: guestError } = await supabase
          .from('user_creations')
          .select('*')
          .eq('id', guestId)
          .single();
          
        if (guestError && guestError.code !== 'PGRST116') {
          console.error(`❌ Erro ao buscar guest ${guestId}:`, guestError);
        } else if (guestRecord) {
          console.log(`   ✅ Guest ${guestId}:`, {
            status: guestRecord.status,
            freesongsused: guestRecord.freesongsused,
            device_id: guestRecord.device_id,
            created_at: guestRecord.created_at
          });
        } else {
          console.log(`   ⚠️ Guest ${guestId} não tem registro em user_creations`);
        }
      }
    }
    
    // 5. Simular chamada de migração
    if (orphanSongs.length > 0) {
      console.log('\n5. Simulando processo de migração...');
      
      const guestIds = [...new Set(orphanSongs.map(song => song.guest_id))];
      
      for (const guestId of guestIds) {
        console.log(`\n   🔄 Simulando migração de ${guestId} para ${otto.id}`);
        
        // Verificar quantas músicas seriam migradas
        const { data: songsToMigrate, error: migrateCheckError } = await supabase
          .from('songs')
          .select('id, title')
          .eq('guest_id', guestId)
          .is('user_id', null);
          
        if (migrateCheckError) {
          console.error(`   ❌ Erro ao verificar músicas para migração:`, migrateCheckError);
          continue;
        }
        
        console.log(`   📦 ${songsToMigrate.length} músicas seriam migradas:`);
        songsToMigrate.forEach(song => {
          console.log(`      - ${song.title} (${song.id})`);
        });
        
        // Verificar se há device_id associado
        const { data: guestWithDevice, error: deviceError } = await supabase
          .from('user_creations')
          .select('device_id')
          .eq('id', guestId)
          .single();
          
        if (!deviceError && guestWithDevice?.device_id) {
          console.log(`   📱 Device ID encontrado: ${guestWithDevice.device_id}`);
          
          // Verificar se Otto já tem esse device_id
          const { data: ottoDevice, error: ottoDeviceError } = await supabase
            .from('user_creations')
            .select('device_id')
            .eq('id', otto.id)
            .single();
            
          if (!ottoDeviceError && ottoDevice) {
            if (ottoDevice.device_id === guestWithDevice.device_id) {
              console.log(`   ✅ Device ID já associado a Otto - migração deveria funcionar`);
            } else {
              console.log(`   ⚠️ Otto tem device_id diferente: ${ottoDevice.device_id}`);
            }
          } else {
            console.log(`   ⚠️ Otto não tem device_id registrado`);
          }
        } else {
          console.log(`   ⚠️ Guest não tem device_id registrado`);
        }
      }
    }
    
    // 6. Verificar logs recentes de migração
    console.log('\n6. Análise do problema de migração:');
    console.log('   - A migração automática falha quando:');
    console.log('     1. O device_id não é enviado na requisição');
    console.log('     2. O guest_id não corresponde ao device_id');
    console.log('     3. O usuário não está autenticado corretamente');
    console.log('     4. Há problemas na validação do JWT');
    
    console.log('\n✅ Debug concluído!');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar debug
debugMigrationFlow().catch(console.error);