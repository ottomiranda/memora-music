const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggerStatus() {
  console.log('🔍 Verificando status do trigger...');
  
  try {
    // 1. Verificar se o trigger existe usando consulta SQL direta
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, event_object_table, action_timing')
      .eq('trigger_name', 'trigger_sync_user_creations');
    
    if (triggerError) {
      console.log('❌ Erro ao verificar trigger:', triggerError.message);
    } else {
      console.log('✅ Triggers encontrados:', triggers);
    }
    
    // 2. Verificar se a função existe
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_name', 'sync_user_creations')
      .eq('routine_schema', 'public');
    
    if (funcError) {
      console.log('❌ Erro ao verificar função:', funcError.message);
    } else {
      console.log('✅ Funções encontradas:', functions);
    }
    
    // 3. Verificar estrutura da tabela songs
    const { data: songsColumns, error: songsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'songs')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (songsError) {
      console.log('❌ Erro ao verificar tabela songs:', songsError.message);
    } else {
      console.log('✅ Colunas da tabela songs:', songsColumns);
    }
    
    // 4. Verificar últimas músicas criadas
    const { data: recentSongs, error: recentError } = await supabase
      .from('songs')
      .select('id, title, user_id, guest_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.log('❌ Erro ao buscar músicas recentes:', recentError.message);
    } else {
      console.log('✅ Últimas 5 músicas criadas:', recentSongs);
    }
    
    // 5. Verificar registros na user_creations
    const { data: userCreations, error: ucError } = await supabase
      .from('user_creations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ucError) {
      console.log('❌ Erro ao buscar user_creations:', ucError.message);
    } else {
      console.log('✅ Últimos 5 registros user_creations:', userCreations);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTriggerStatus();