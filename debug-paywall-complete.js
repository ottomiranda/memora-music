import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE = 'http://localhost:3337';
const testDeviceId = 'debug-test-' + Date.now();

async function debugPaywallComplete() {
  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO DO PAYWALL');
    console.log('=====================================');
    
    // 1. Verificar estado inicial da tabela
    console.log('\n📊 PASSO 1: Estado inicial da tabela user_creations');
    const { data: initialData, error: initialError } = await supabase
      .from('user_creations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (initialError) {
      console.error('❌ Erro ao buscar dados iniciais:', initialError);
    } else {
      console.log(`📋 Total de registros: ${initialData?.length || 0}`);
      if (initialData && initialData.length > 0) {
        console.log('🔍 Últimos 3 registros:');
        initialData.slice(0, 3).forEach((record, index) => {
          console.log(`  ${index + 1}. Device: ${record.device_id}, User: ${record.user_id || 'null'}, FreeSongs: ${record.freesongsused}, IP: ${record.ip}`);
        });
      }
    }
    
    // 2. Testar primeira verificação de status (usuário novo)
    console.log('\n🎯 PASSO 2: Primeira verificação de status (usuário novo)');
    try {
      const firstStatusCheck = await fetch(`${API_BASE}/api/user/creation-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': testDeviceId,
          'x-guest-id': testDeviceId
        }
      });
      
      const firstStatusResponse = await firstStatusCheck.json();
      console.log('📊 Primeira resposta de status:', JSON.stringify(firstStatusResponse, null, 2));
      
      if (firstStatusResponse.isFree !== true) {
        console.log('❌ PROBLEMA: Usuário novo deveria ter isFree=true');
      } else {
        console.log('✅ OK: Usuário novo tem isFree=true');
      }
    } catch (error) {
      console.error('❌ Erro na primeira verificação:', error.message);
    }
    
    // 3. Criar primeira música
    console.log('\n🎵 PASSO 3: Criando primeira música');
    try {
      const firstCreation = await fetch(`${API_BASE}/api/generate-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': testDeviceId,
          'x-guest-id': testDeviceId
        },
        body: JSON.stringify({
          occasion: 'aniversário',
          recipientName: 'João',
          relationship: 'amigo',
          senderName: 'Maria',
          hobbies: 'futebol',
          qualities: 'engraçado',
          lyricsOnly: true
        })
      });
      
      const firstCreationResponse = await firstCreation.json();
      console.log('🎵 Primeira criação:', {
        success: firstCreationResponse.success,
        error: firstCreationResponse.error || 'nenhum',
        message: firstCreationResponse.message || 'sem mensagem'
      });
      
      if (!firstCreationResponse.success) {
        console.log('❌ PROBLEMA: Primeira criação falhou');
        console.log('📋 Detalhes do erro:', firstCreationResponse);
      } else {
        console.log('✅ OK: Primeira criação bem-sucedida');
      }
    } catch (error) {
      console.error('❌ Erro na primeira criação:', error.message);
    }
    
    // 4. Verificar estado da tabela após primeira criação
    console.log('\n📊 PASSO 4: Estado da tabela após primeira criação');
    const { data: afterFirstData, error: afterFirstError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testDeviceId);
    
    if (afterFirstError) {
      console.error('❌ Erro ao buscar dados após primeira criação:', afterFirstError);
    } else {
      console.log(`📋 Registros para device ${testDeviceId}: ${afterFirstData?.length || 0}`);
      if (afterFirstData && afterFirstData.length > 0) {
        afterFirstData.forEach((record, index) => {
          console.log(`  ${index + 1}. Device: ${record.device_id}, User: ${record.user_id || 'null'}, FreeSongs: ${record.freesongsused}, IP: ${record.ip}`);
        });
        
        if (afterFirstData.length > 1) {
          console.log('❌ PROBLEMA: Múltiplos registros para o mesmo device_id!');
        }
        
        const record = afterFirstData[0];
        if (record.freesongsused !== 1) {
          console.log(`❌ PROBLEMA: freesongsused deveria ser 1, mas é ${record.freesongsused}`);
        } else {
          console.log('✅ OK: freesongsused = 1 após primeira criação');
        }
      } else {
        console.log('❌ PROBLEMA: Nenhum registro criado após primeira música');
      }
    }
    
    // 5. Segunda verificação de status (deveria bloquear)
    console.log('\n🎯 PASSO 5: Segunda verificação de status (deveria bloquear)');
    try {
      const secondStatusCheck = await fetch(`${API_BASE}/api/user/creation-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': testDeviceId,
          'x-guest-id': testDeviceId
        }
      });
      
      const secondStatusResponse = await secondStatusCheck.json();
      console.log('📊 Segunda resposta de status:', JSON.stringify(secondStatusResponse, null, 2));
      
      if (secondStatusResponse.isFree === true) {
        console.log('❌ PROBLEMA CRÍTICO: Segunda música deveria ser bloqueada (isFree=false)');
      } else {
        console.log('✅ OK: Segunda música está bloqueada (isFree=false)');
      }
    } catch (error) {
      console.error('❌ Erro na segunda verificação:', error.message);
    }
    
    // 6. Tentar criar segunda música (deveria falhar)
    console.log('\n🎵 PASSO 6: Tentando criar segunda música (deveria falhar)');
    try {
      const secondCreation = await fetch(`${API_BASE}/api/generate-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': testDeviceId,
          'x-guest-id': testDeviceId
        },
        body: JSON.stringify({
          occasion: 'casamento',
          recipientName: 'Ana',
          relationship: 'irmã',
          senderName: 'Carlos',
          hobbies: 'dança',
          qualities: 'carinhosa',
          lyricsOnly: true
        })
      });
      
      const secondCreationResponse = await secondCreation.json();
      console.log('🎵 Segunda criação:', {
        success: secondCreationResponse.success,
        error: secondCreationResponse.error || 'nenhum',
        message: secondCreationResponse.message || 'sem mensagem'
      });
      
      if (secondCreationResponse.success) {
        console.log('❌ PROBLEMA CRÍTICO: Segunda criação deveria ter falhado!');
      } else if (secondCreationResponse.error === 'PAYMENT_REQUIRED') {
        console.log('✅ OK: Segunda criação bloqueada corretamente');
      } else {
        console.log('⚠️  ATENÇÃO: Segunda criação falhou, mas não pelo paywall');
      }
    } catch (error) {
      console.error('❌ Erro na segunda criação:', error.message);
    }
    
    // 7. Verificar estado final da tabela
    console.log('\n📊 PASSO 7: Estado final da tabela');
    const { data: finalData, error: finalError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testDeviceId);
    
    if (finalError) {
      console.error('❌ Erro ao buscar dados finais:', finalError);
    } else {
      console.log(`📋 Registros finais para device ${testDeviceId}: ${finalData?.length || 0}`);
      if (finalData && finalData.length > 0) {
        finalData.forEach((record, index) => {
          console.log(`  ${index + 1}. Device: ${record.device_id}, User: ${record.user_id || 'null'}, FreeSongs: ${record.freesongsused}, IP: ${record.ip}`);
        });
      }
    }
    
    // 8. Resumo dos problemas encontrados
    console.log('\n📋 RESUMO DOS PROBLEMAS ENCONTRADOS:');
    console.log('=====================================');
    
    // Verificar duplicação
    if (finalData && finalData.length > 1) {
      console.log('❌ DUPLICAÇÃO: Múltiplos registros para o mesmo device_id');
    } else {
      console.log('✅ SEM DUPLICAÇÃO: Apenas um registro por device_id');
    }
    
    // Limpeza
    console.log('\n🧹 LIMPEZA: Removendo dados de teste');
    await supabase
      .from('user_creations')
      .delete()
      .eq('device_id', testDeviceId);
    
    console.log('✅ Diagnóstico completo finalizado!');
    
  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

debugPaywallComplete();