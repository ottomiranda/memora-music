const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMigrationFlow() {
  console.log('🔍 Testando fluxo de migração de dados...');
  
  try {
    // 1. Buscar Otto Miranda via RPC (pois auth.users não é acessível via REST API)
  console.log('\n=== 1. BUSCANDO OTTO MIRANDA ===');
  const { data: users, error: usersError } = await supabase
    .rpc('get_users_by_email_or_name', { search_term: 'otto' });

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`📊 Encontrados ${users.length} usuários:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.raw_user_meta_data?.full_name || 'Sem nome'}) - ID: ${user.id}`);
    });

    const otto = users.find(u => 
      u.email?.toLowerCase().includes('otto') || 
      u.raw_user_meta_data?.full_name?.toLowerCase().includes('otto')
    );

    if (!otto) {
      console.log('❌ Otto Miranda não encontrado');
      return;
    }

    console.log(`✅ Otto encontrado: ${otto.email} - ID: ${otto.id}`);
    const ottoUser = otto;
    
    // 2. Verificar músicas do Otto
    console.log('\n2. Verificando músicas do Otto...');
    const { data: ottoSongs, error: songsError } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', ottoUser.id);
    
    if (songsError) {
      console.error('❌ Erro ao buscar músicas do Otto:', songsError);
      return;
    }
    
    console.log(`🎵 Músicas do Otto: ${ottoSongs?.length || 0}`);
    
    // 3. Buscar registros órfãos com guest_id...
    console.log('\n3. Buscando registros órfãos com guest_id...');
    const { data: orphanSongs, error: orphanError } = await supabase
      .from('songs')
      .select('id, title, guest_id, created_at')
      .is('user_id', null)
      .not('guest_id', 'is', null);
    
    if (orphanError) {
      console.error('❌ Erro ao buscar registros órfãos:', orphanError);
      return;
    }
    
    console.log(`🔍 Registros órfãos encontrados: ${orphanSongs?.length || 0}`);
    orphanSongs?.forEach(song => {
      console.log(`  - ID: ${song.id}, Guest ID: ${song.guest_id}, Título: ${song.title || 'Sem título'}`);
    });
    
    // 4. Testar endpoint de migração diretamente
    if (orphanSongs && orphanSongs.length > 0) {
      console.log('\n4. Testando endpoint de migração...');
      
      const guestId = orphanSongs[0].guest_id;
      console.log(`🔧 Testando migração com guest_id: ${guestId}`);
      
      try {
        const response = await fetch('http://localhost:3337/api/migrate-guest-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}` // Simular token de usuário
          },
          body: JSON.stringify({
            guestId: guestId,
            userId: ottoUser.id,
            email: ottoUser.email,
            name: ottoUser.raw_user_meta_data?.full_name || 'Otto Miranda',
            deviceId: guestId
          })
        });
        
        const result = await response.json();
        console.log('📊 Resposta do endpoint de migração:', JSON.stringify(result, null, 2));
        
        if (response.ok && result.success) {
          console.log('✅ Migração testada com sucesso!');
          
          // Verificar se as músicas foram migradas
          const { data: updatedSongs } = await supabase
            .from('songs')
            .select('*')
            .eq('user_id', ottoUser.id);
          
          console.log(`🎵 Músicas do Otto após migração: ${updatedSongs?.length || 0}`);
        } else {
          console.log('❌ Falha na migração:', result);
        }
        
      } catch (fetchError) {
        console.error('❌ Erro ao chamar endpoint de migração:', fetchError.message);
      }
    }
    
    // 5. Verificar logs de migração (se existir tabela)
    console.log('\n5. Verificando logs de migração...');
    try {
      const { data: migrationLogs, error: logsError } = await supabase
        .from('migration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (logsError && !logsError.message.includes('does not exist')) {
        console.error('❌ Erro ao buscar logs:', logsError);
      } else if (migrationLogs) {
        console.log(`📋 Logs de migração encontrados: ${migrationLogs.length}`);
        migrationLogs.forEach(log => {
          console.log(`  - ${log.created_at}: ${log.action} - ${log.details}`);
        });
      } else {
        console.log('ℹ️ Tabela de logs de migração não existe');
      }
    } catch (e) {
      console.log('ℹ️ Tabela de logs não disponível');
    }
    
    // 6. Resumo e diagnóstico
    console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
    console.log('=' .repeat(50));
    console.log(`👤 Usuário Otto: ${ottoUser ? '✅ Encontrado' : '❌ Não encontrado'}`);
    console.log(`🎵 Músicas do Otto: ${ottoSongs?.length || 0}`);
    console.log(`🔍 Registros órfãos: ${orphanSongs?.length || 0}`);
    
    if (ottoSongs?.length === 0 && orphanSongs?.length > 0) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO:');
      console.log('- Otto tem 0 músicas mas existem registros órfãos');
      console.log('- A migração automática não está funcionando');
      console.log('\n💡 POSSÍVEIS CAUSAS:');
      console.log('1. Endpoint de migração não está sendo chamado no frontend');
      console.log('2. DeviceId não está sendo enviado corretamente');
      console.log('3. Erro na lógica de migração no backend');
      console.log('4. Problema de autenticação/autorização');
    } else if (ottoSongs?.length > 0) {
      console.log('\n✅ MIGRAÇÃO FUNCIONANDO:');
      console.log('- Otto possui músicas migradas');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar o teste
testMigrationFlow().catch(console.error);