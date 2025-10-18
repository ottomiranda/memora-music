#!/usr/bin/env node

/**
 * Script para debugar o fluxo completo de criação de músicas
 * Identifica onde o trigger sync_user_creations_count não está sendo acionado
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE_URL = 'http://localhost:3337';

async function debugCreationFlow() {
  console.log('🔍 [DEBUG] Iniciando debug do fluxo de criação de músicas\n');
  
  const testDeviceId = `debug-${Date.now()}`;
  const testGuestId = `guest-${Date.now()}`;
  
  console.log('📋 [DEBUG] IDs de teste:');
  console.log(`   Device ID: ${testDeviceId}`);
  console.log(`   Guest ID: ${testGuestId}`);
  
  try {
    // 1. Verificar estado inicial
    console.log('\n📊 [STEP 1] Verificando estado inicial...');
    
    const { data: initialCreations, error: initialError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', testDeviceId);
    
    if (initialError) {
      console.error('❌ [ERROR] Erro ao verificar estado inicial:', initialError);
      return;
    }
    
    console.log(`✅ [STEP 1] Estado inicial: ${initialCreations.length} registros em user_creations`);
    
    // 2. Verificar se o trigger existe
    console.log('\n🔧 [STEP 2] Verificando se o trigger existe...');
    
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .eq('trigger_name', 'trigger_sync_user_creations');
    
    if (triggerError) {
      console.error('❌ [ERROR] Erro ao verificar triggers:', triggerError);
    } else {
      console.log(`✅ [STEP 2] Triggers encontrados: ${triggers.length}`);
      triggers.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name} (${trigger.event_manipulation})`);
      });
    }
    
    // 3. Testar API creation-status ANTES da criação
    console.log('\n🌐 [STEP 3] Testando API creation-status ANTES da criação...');
    
    const beforeResponse = await fetch(`${API_BASE_URL}/api/user/creation-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': testDeviceId,
        'x-guest-id': testGuestId
      }
    });
    
    const beforeData = await beforeResponse.json();
    console.log('📊 [STEP 3] Resposta ANTES:', {
      status: beforeResponse.status,
      isFree: beforeData.isFree,
      freeSongsUsed: beforeData.freeSongsUsed,
      message: beforeData.message
    });
    
    // 4. Simular inserção direta na tabela songs (como faria a API da Suno)
    console.log('\n🎵 [STEP 4] Simulando inserção na tabela songs...');
    
    const songData = {
      title: 'Música de Teste',
      guest_id: testGuestId,
      audio_url_option1: 'https://example.com/test.mp3',
      prompt: 'Uma música de teste para debug',
      genre: 'teste',
      mood: 'alegre',
      generation_status: 'completed',
      suno_task_id: `test-task-${Date.now()}`
    };
    
    const { data: insertedSong, error: insertError } = await supabase
      .from('songs')
      .insert(songData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ [ERROR] Erro ao inserir música:', insertError);
      return;
    }
    
    console.log('✅ [STEP 4] Música inserida com sucesso:', {
      id: insertedSong.id,
      title: insertedSong.title,
      guest_id: insertedSong.guest_id,
      generation_status: insertedSong.generation_status
    });
    
    // 5. Aguardar um pouco para o trigger processar
    console.log('\n⏳ [STEP 5] Aguardando trigger processar (2 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 6. Verificar se user_creations foi criado/atualizado
    console.log('\n📊 [STEP 6] Verificando se user_creations foi atualizado...');
    
    const { data: afterCreations, error: afterError } = await supabase
      .from('user_creations')
      .select('*')
      .or(`device_id.eq.${testDeviceId},device_id.eq.${testGuestId}`);
    
    if (afterError) {
      console.error('❌ [ERROR] Erro ao verificar user_creations:', afterError);
      return;
    }
    
    console.log(`📊 [STEP 6] Registros em user_creations APÓS inserção: ${afterCreations.length}`);
    
    if (afterCreations.length > 0) {
      const userCreation = afterCreations[0];
      console.log('✅ [STEP 6] Registro encontrado:', {
        device_id: userCreation.device_id,
        creations: userCreation.creations,
        freesongsused: userCreation.freesongsused,
        created_at: userCreation.created_at,
        updated_at: userCreation.updated_at
      });
      
      // Verificar se os valores estão corretos
      if (userCreation.creations === 1 && userCreation.freesongsused === 1) {
        console.log('✅ [SUCCESS] Trigger funcionou corretamente!');
      } else {
        console.log('⚠️ [WARNING] Valores incorretos no trigger:', {
          expected: { creations: 1, freesongsused: 1 },
          actual: { creations: userCreation.creations, freesongsused: userCreation.freesongsused }
        });
      }
    } else {
      console.log('❌ [PROBLEM] Trigger NÃO foi acionado - nenhum registro criado em user_creations');
    }
    
    // 7. Testar API creation-status APÓS a criação
    console.log('\n🌐 [STEP 7] Testando API creation-status APÓS a criação...');
    
    const afterResponse = await fetch(`${API_BASE_URL}/api/user/creation-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': testDeviceId,
        'x-guest-id': testGuestId
      }
    });
    
    const afterData = await afterResponse.json();
    console.log('📊 [STEP 7] Resposta APÓS:', {
      status: afterResponse.status,
      isFree: afterData.isFree,
      freeSongsUsed: afterData.freeSongsUsed,
      message: afterData.message
    });
    
    // 8. Análise final
    console.log('\n🎯 [ANÁLISE FINAL]');
    console.log('==================');
    
    if (afterCreations.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Trigger não está sendo acionado');
      console.log('   - Música foi inserida na tabela songs');
      console.log('   - Nenhum registro foi criado em user_creations');
      console.log('   - Trigger sync_user_creations_count não funcionou');
    } else if (afterCreations[0].freesongsused !== 1) {
      console.log('⚠️ PROBLEMA PARCIAL: Trigger acionado mas valores incorretos');
      console.log(`   - freesongsused deveria ser 1, mas é ${afterCreations[0].freesongsused}`);
    } else {
      console.log('✅ TRIGGER FUNCIONANDO: Dados criados corretamente');
      
      if (!afterData.isFree) {
        console.log('✅ PAYWALL FUNCIONANDO: Próxima música será paga');
      } else {
        console.log('⚠️ PAYWALL NÃO FUNCIONANDO: Próxima música ainda será gratuita');
      }
    }
    
    // 9. Limpeza
    console.log('\n🧹 [CLEANUP] Limpando dados de teste...');
    
    // Deletar música de teste
    await supabase
      .from('songs')
      .delete()
      .eq('id', insertedSong.id);
    
    // Deletar user_creations de teste
    await supabase
      .from('user_creations')
      .delete()
      .or(`device_id.eq.${testDeviceId},device_id.eq.${testGuestId}`);
    
    console.log('✅ [CLEANUP] Limpeza concluída');
    
  } catch (error) {
    console.error('❌ [FATAL ERROR] Erro no debug:', error);
  }
}

debugCreationFlow();