require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

// Configuração do Supabase
require('dotenv').config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOttoPaywallStatus() {
  console.log('🔍 Testando status do paywall para Otto Miranda...');
  
  try {
    // 1. Verificar dados do Otto no banco
    console.log('\n1. Verificando dados do Otto Miranda no banco...');
    
    // Buscar o usuário Otto Miranda na tabela user_creations
    // Vamos tentar diferentes formas de identificar o Otto
    let userCreations = null;
    let userError = null;
    
    // Tentar buscar por device_id que pode ser o email
    const { data: userByDevice, error: deviceError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', 'otto@miranda.com')
      .single();
    
    if (!deviceError && userByDevice) {
      userCreations = userByDevice;
      console.log('✅ Otto encontrado por device_id (email)');
    } else {
      // Se não encontrou por device_id, vamos listar todos os registros para ver o que temos
      const { data: allUsers, error: allError } = await supabase
        .from('user_creations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (allError) {
        console.error('❌ Erro ao buscar dados:', allError);
        return;
      }
      
      console.log('\n📋 Últimos 10 registros na tabela user_creations:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. device_id: ${user.device_id}`);
        console.log(`      user_id: ${user.user_id}`);
        console.log(`      freesongsused: ${user.freesongsused}`);
        console.log(`      creations: ${user.creations}`);
        console.log(`      created_at: ${user.created_at}`);
        console.log('      ---');
      });
      
      // Como não encontramos Otto por nome, vamos usar o usuário que tem freesongsused > 0
       // Isso indica que já usou músicas gratuitas
       const ottoCandidate = allUsers.find(user => user.freesongsused > 0);
       
       if (ottoCandidate) {
         userCreations = ottoCandidate;
         console.log('✅ Usando usuário que já usou músicas gratuitas (provavelmente Otto)');
       } else {
         console.log('❌ Nenhum usuário com freesongsused > 0 encontrado.');
         return;
       }
    }
    
    console.log('\n✅ Dados do Otto encontrados:');
    console.log('   - device_id:', userCreations.device_id);
    console.log('   - user_id:', userCreations.user_id);
    console.log('   - freesongsused:', userCreations.freesongsused);
    console.log('   - creations:', userCreations.creations);
    console.log('   - updated_at:', userCreations.updated_at);
    
    // 2. Verificar músicas criadas pelo Otto
    console.log('\n2. Verificando músicas criadas pelo Otto...');
    
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id, title, created_at, user_id, guest_id')
      .or(`user_id.eq.${userCreations.user_id || 'null'},guest_id.eq.${userCreations.device_id}`);
    
    if (songsError) {
      console.error('❌ Erro ao buscar músicas:', songsError);
    } else {
      console.log(`✅ Total de músicas encontradas: ${songs?.length || 0}`);
      if (songs && songs.length > 0) {
        songs.forEach((song, index) => {
          console.log(`   ${index + 1}. ${song.title} (ID: ${song.id})`);
          console.log(`      - user_id: ${song.user_id}`);
          console.log(`      - guest_id: ${song.guest_id}`);
          console.log(`      - created_at: ${song.created_at}`);
        });
      }
    }
    
    // 3. Testar a API /api/user/creation-status
    console.log('\n3. Testando API /api/user/creation-status...');
    
    // Simular requisição com dados do Otto
    const testPayload = {
      userId: userCreations.user_id,
      deviceId: userCreations.device_id,
      email: 'otto@miranda.com' // assumindo que é o email do Otto
    };
    
    console.log('   Dados do usuário:', JSON.stringify(testPayload, null, 2));
    
    try {
      const options = {
        hostname: 'localhost',
        port: 3337,
        path: '/api/user/creation-status',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': testPayload.deviceId,
          'x-guest-id': testPayload.deviceId
        }
      };
      
      const response = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              resolve({ status: res.statusCode, data: result });
            } catch (e) {
              resolve({ status: res.statusCode, data: data });
            }
          });
        });
        
        req.on('error', (err) => {
          reject(err);
        });
        
        req.end();
      });
      
      console.log('\n📊 Resposta da API:');
      console.log('   Status:', response.status);
      console.log('   Dados:', JSON.stringify(response.data, null, 2));
      
      if (response.data.isFree === false) {
        console.log('✅ CORRETO: API retornou isFree: false (paywall deve bloquear)');
      } else {
        console.log('❌ PROBLEMA: API retornou isFree: true (paywall NÃO vai bloquear)');
        console.log('   Isso explica por que o modal de paywall não apareceu!');
      }
      
      // 4. Validar se o resultado está correto
      console.log('\n4. Validação do resultado...');
      
      const expectedIsFree = userCreations.freesongsused < 1;
      const actualIsFree = response.data.isFree;
      
      console.log(`   - freesongsused no banco: ${userCreations.freesongsused}`);
      console.log(`   - isFree esperado: ${expectedIsFree}`);
      console.log(`   - isFree retornado: ${actualIsFree}`);
      
      if (expectedIsFree === actualIsFree) {
        console.log('✅ API está retornando o valor correto!');
      } else {
        console.log('❌ PROBLEMA: API não está retornando o valor esperado!');
        console.log('   O paywall deveria estar bloqueando mas não está.');
      }
      
    } catch (apiError) {
      console.error('❌ Erro ao chamar a API:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o teste
testOttoPaywallStatus().then(() => {
  console.log('\n🏁 Teste concluído.');
}).catch(error => {
  console.error('❌ Erro fatal:', error);
});