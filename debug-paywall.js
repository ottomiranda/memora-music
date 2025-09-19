import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqjqhqjqhqjqhqj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHFqcWhxanFocWpxaHFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU1NzI5NCwiZXhwIjoyMDUzMTMzMjk0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPaywall() {
  console.log('🔍 DEBUG: Investigando comportamento do paywall...');
  
  const baseUrl = 'http://localhost:3337';
  const deviceId = 'debug-test-' + Date.now();
  
  try {
    // 1. Limpar registros de teste anteriores
    console.log('\n🧹 Limpando registros de teste...');
    const { error: deleteError } = await supabase
      .from('user_creations')
      .delete()
      .like('device_id', 'debug-test-%');
    
    if (deleteError) {
      console.error('❌ Erro ao limpar:', deleteError);
    } else {
      console.log('✅ Registros de teste limpos');
    }
    
    // 2. Verificar estado inicial da tabela
    console.log('\n📊 Estado inicial da tabela:');
    const { data: initialData } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', deviceId);
    console.log('Registros encontrados:', initialData?.length || 0);
    
    // 3. Primeira verificação de status
    console.log('\n🔍 Primeira verificação de status...');
    const firstCheck = await fetch(`${baseUrl}/api/user/creation-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-guest-id': deviceId
      }
    });
    
    const firstResponse = await firstCheck.json();
    console.log('📊 Primeira resposta:', JSON.stringify(firstResponse, null, 2));
    
    // 4. Verificar tabela após primeira verificação
    console.log('\n📊 Estado da tabela após primeira verificação:');
    const { data: afterFirstCheck } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', deviceId);
    console.log('Registros:', afterFirstCheck);
    
    // 5. Primeira criação
    console.log('\n🎵 Primeira criação...');
    const createFirst = await fetch(`${baseUrl}/api/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-guest-id': deviceId
      },
      body: JSON.stringify({
        occasion: 'aniversário',
        recipientName: 'João',
        relationship: 'amigo',
        senderName: 'Maria',
        hobbies: 'futebol, música',
        qualities: 'engraçado, leal',
        genre: 'pop',
        lyricsOnly: true
      })
    });
    
    const createFirstResponse = await createFirst.json();
    console.log('🎶 Primeira criação resultado:', createFirstResponse.success ? 'Sucesso' : 'Falhou');
    
    // 6. Verificar tabela após primeira criação
    console.log('\n📊 Estado da tabela após primeira criação:');
    const { data: afterFirstCreate } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', deviceId);
    console.log('Registros:', afterFirstCreate);
    
    // 7. Segunda verificação de status
    console.log('\n🔍 Segunda verificação de status...');
    const secondCheck = await fetch(`${baseUrl}/api/user/creation-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-guest-id': deviceId
      }
    });
    
    const secondResponse = await secondCheck.json();
    console.log('📊 Segunda resposta:', JSON.stringify(secondResponse, null, 2));
    
    // 8. Análise final
    console.log('\n📋 ANÁLISE FINAL:');
    console.log(`- Primeira verificação isFree: ${firstResponse.isFree}`);
    console.log(`- Primeira criação sucesso: ${createFirstResponse.success}`);
    console.log(`- Registros na tabela após criação: ${afterFirstCreate?.length || 0}`);
    if (afterFirstCreate && afterFirstCreate.length > 0) {
      console.log(`- freesongsused na tabela: ${afterFirstCreate[0].freesongsused}`);
    }
    console.log(`- Segunda verificação isFree: ${secondResponse.isFree}`);
    console.log(`- Segunda verificação freeSongsUsed: ${secondResponse.freeSongsUsed}`);
    
    if (firstResponse.isFree && createFirstResponse.success && !secondResponse.isFree) {
      console.log('\n🎉 PAYWALL FUNCIONANDO CORRETAMENTE!');
    } else {
      console.log('\n❌ PROBLEMA NO PAYWALL IDENTIFICADO!');
      if (afterFirstCreate && afterFirstCreate.length > 0 && afterFirstCreate[0].freesongsused >= 1 && secondResponse.isFree) {
        console.log('🔍 CAUSA: O endpoint creation-status não está lendo corretamente o contador incrementado');
      } else if (afterFirstCreate && afterFirstCreate.length > 0 && afterFirstCreate[0].freesongsused === 0) {
        console.log('🔍 CAUSA: O contador não está sendo incrementado no generate-preview');
      } else {
        console.log('🔍 CAUSA: Registro não está sendo criado na tabela');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

debugPaywall();