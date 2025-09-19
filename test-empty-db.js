import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmptyDatabase() {
  console.log('🧪 Testando cenário de banco vazio...');
  
  try {
    // 1. Limpar tabela user_creations
    console.log('🗑️ Limpando tabela user_creations...');
    const { error: deleteError } = await supabase
      .from('user_creations')
      .delete()
      .neq('device_id', 'never-match'); // Delete all
    
    if (deleteError) {
      console.error('❌ Erro ao limpar tabela:', deleteError);
      return;
    }
    
    console.log('✅ Tabela limpa com sucesso');
    
    // 2. Verificar se está realmente vazia
    const { data: allRecords, error: countError } = await supabase
      .from('user_creations')
      .select('*');
    
    if (countError) {
      console.error('❌ Erro ao verificar registros:', countError);
      return;
    }
    
    console.log(`📊 Registros na tabela: ${allRecords?.length || 0}`);
    
    // 3. Simular primeira criação de música
    console.log('🎵 Simulando primeira criação...');
    const deviceId = 'test-device-' + Date.now();
    const clientIp = '127.0.0.1';
    
    // Simular busca por usuário existente (deve retornar null)
    const { data: existingUser, error: searchError } = await supabase
      .from('user_creations')
      .select('freesongsused')
      .eq('device_id', deviceId)
      .maybeSingle();
    
    console.log('🔍 Usuário existente encontrado:', existingUser);
    console.log('🔍 Erro de busca:', searchError);
    
    // 4. Criar primeiro registro
    const { data: newUser, error: insertError } = await supabase
      .from('user_creations')
      .insert({
        device_id: deviceId,
        freesongsused: 1,
        last_used_ip: clientIp,
        ip: clientIp
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao criar primeiro registro:', insertError);
      return;
    }
    
    console.log('✅ Primeiro registro criado:', newUser);
    
    // 5. Simular segunda tentativa (deve ativar paywall)
    console.log('🎵 Simulando segunda criação (deve ativar paywall)...');
    
    const { data: secondCheck, error: secondError } = await supabase
      .from('user_creations')
      .select('freesongsused')
      .eq('device_id', deviceId)
      .maybeSingle();
    
    if (secondError) {
      console.error('❌ Erro na segunda verificação:', secondError);
      return;
    }
    
    console.log('🔍 Status na segunda tentativa:', secondCheck);
    
    const freeSongsUsed = secondCheck?.freesongsused || 0;
    const isFree = freeSongsUsed < 1;
    
    console.log(`📊 FreeSongsUsed: ${freeSongsUsed}`);
    console.log(`🎯 IsFree: ${isFree}`);
    console.log(`🚫 Deve ativar paywall: ${!isFree}`);
    
    if (isFree) {
      console.log('❌ PROBLEMA: Paywall não seria ativado!');
    } else {
      console.log('✅ Paywall seria ativado corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testEmptyDatabase();