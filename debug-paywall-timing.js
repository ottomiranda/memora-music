// Script para analisar e corrigir o problema de timing do paywall
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEVICE_ID = "0315a2fe-220a-401b-b1b9-055a27733360";

async function analyzePaywallTiming() {
  console.log('🔍 [ANÁLISE] Analisando problema de timing do paywall');
  console.log('📋 [ANÁLISE] Device ID:', DEVICE_ID);
  
  try {
    // 1. Verificar estado atual da tabela user_creations
    console.log('\n1️⃣ [ANÁLISE] Verificando tabela user_creations...');
    const { data: userCreations, error: userCreationsError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', DEVICE_ID);
    
    if (userCreationsError) {
      console.error('❌ [ANÁLISE] Erro ao consultar user_creations:', userCreationsError.message);
      return;
    }
    
    console.log('📊 [ANÁLISE] Estado atual user_creations:', JSON.stringify(userCreations, null, 2));
    
    // 2. Verificar quantas músicas existem na tabela songs para este device_id
    console.log('\n2️⃣ [ANÁLISE] Verificando tabela songs...');
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('*')
      .or(`user_id.eq.${DEVICE_ID},guest_id.eq.${DEVICE_ID}`)
      .order('created_at', { ascending: true });
    
    if (songsError) {
      console.error('❌ [ANÁLISE] Erro ao consultar songs:', songsError.message);
      return;
    }
    
    console.log('🎵 [ANÁLISE] Músicas encontradas:', songs.length);
    songs.forEach((song, index) => {
      console.log(`   ${index + 1}. ID: ${song.id}, Title: ${song.title}, Created: ${song.created_at}`);
    });
    
    // 3. Analisar discrepância
    const actualSongs = songs.length;
    const recordedCreations = userCreations[0]?.creations || 0;
    const recordedFreeUsed = userCreations[0]?.freesongsused || 0;
    
    console.log('\n3️⃣ [ANÁLISE] Análise de discrepância:');
    console.log(`   📊 Músicas reais na tabela songs: ${actualSongs}`);
    console.log(`   📊 Criações registradas em user_creations: ${recordedCreations}`);
    console.log(`   📊 Músicas gratuitas usadas registradas: ${recordedFreeUsed}`);
    
    if (actualSongs !== recordedCreations) {
      console.log('⚠️ [ANÁLISE] DISCREPÂNCIA DETECTADA!');
      console.log(`   🔧 Diferença: ${actualSongs - recordedCreations} músicas`);
    }
    
    if (recordedFreeUsed > actualSongs) {
      console.log('⚠️ [ANÁLISE] CONTADOR FREESONGSUSED INCORRETO!');
      console.log(`   🔧 Deveria ser: ${actualSongs}, mas está: ${recordedFreeUsed}`);
    }
    
    // 4. Propor correção
    console.log('\n4️⃣ [ANÁLISE] Proposta de correção:');
    
    if (userCreations.length === 0) {
      console.log('   ✅ Nenhum registro em user_creations - trigger funcionará na próxima inserção');
    } else {
      const correctCreations = actualSongs;
      const correctFreeUsed = Math.min(actualSongs, 1); // Máximo 1 música gratuita
      
      console.log(`   🔧 Corrigir creations: ${recordedCreations} → ${correctCreations}`);
      console.log(`   🔧 Corrigir freesongsused: ${recordedFreeUsed} → ${correctFreeUsed}`);
      
      // Aplicar correção
      console.log('\n5️⃣ [CORREÇÃO] Aplicando correção...');
      const { error: updateError } = await supabase
        .from('user_creations')
        .update({
          creations: correctCreations,
          freesongsused: correctFreeUsed,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', DEVICE_ID);
      
      if (updateError) {
        console.error('❌ [CORREÇÃO] Erro ao aplicar correção:', updateError.message);
      } else {
        console.log('✅ [CORREÇÃO] Correção aplicada com sucesso!');
        
        // Verificar resultado
        const { data: updatedData } = await supabase
          .from('user_creations')
          .select('*')
          .eq('device_id', DEVICE_ID);
        
        console.log('📊 [CORREÇÃO] Estado após correção:', JSON.stringify(updatedData, null, 2));
      }
    }
    
    // 5. Testar paywall após correção
    console.log('\n6️⃣ [TESTE] Testando paywall após correção...');
    
    const response = await fetch('http://localhost:3337/api/user/creation-status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': DEVICE_ID,
        'x-guest-id': DEVICE_ID
      }
    });
    
    if (response.ok) {
      const paywallStatus = await response.json();
      console.log('📊 [TESTE] Status do paywall após correção:', JSON.stringify(paywallStatus, null, 2));
      
      if (paywallStatus.isFree === false) {
        console.log('✅ [TESTE] Paywall funcionando corretamente - próxima música será paga');
      } else {
        console.log('⚠️ [TESTE] Paywall ainda permite música gratuita');
      }
    } else {
      console.error('❌ [TESTE] Erro ao testar paywall:', response.status);
    }
    
  } catch (error) {
    console.error('💥 [ANÁLISE] Erro geral:', error.message);
  }
}

// Executar análise
analyzePaywallTiming()
  .then(() => {
    console.log('\n🎉 [ANÁLISE] Análise de timing do paywall concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ [ANÁLISE] Falha na análise:', error.message);
    process.exit(1);
  });