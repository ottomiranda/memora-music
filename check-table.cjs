require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable() {
  try {
    const { data, error } = await supabase
      .from('user_creations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro:', error);
      return;
    }
    
    console.log('📊 ESTADO ATUAL DA TABELA USER_CREATIONS');
    console.log('='.repeat(50));
    console.log('Total de registros:', data.length);
    console.log('');
    
    if (data.length === 0) {
      console.log('🔍 Nenhum registro encontrado');
      return;
    }
    
    data.forEach((record, i) => {
      console.log(`${i + 1}. REGISTRO:`);
      console.log(`   Device ID: ${record.device_id}`);
      console.log(`   User ID: ${record.user_id}`);
      console.log(`   Free Songs Used: ${record.freesongsused}`);
      console.log(`   IP: ${record.ip}`);
      console.log(`   Last Used IP: ${record.last_used_ip}`);
      console.log(`   Creations: ${record.creations}`);
      console.log(`   Created At: ${record.created_at}`);
      console.log(`   Updated At: ${record.updated_at}`);
      console.log('');
    });
    
    // Verificar duplicações
    const deviceIds = data.map(r => r.device_id).filter(Boolean);
    const userIds = data.map(r => r.user_id).filter(Boolean);
    
    const duplicateDevices = deviceIds.filter((id, index) => deviceIds.indexOf(id) !== index);
    const duplicateUsers = userIds.filter((id, index) => userIds.indexOf(id) !== index);
    
    if (duplicateDevices.length > 0) {
      console.log('⚠️  DUPLICAÇÕES DE DEVICE_ID DETECTADAS:');
      duplicateDevices.forEach(id => console.log(`   - ${id}`));
      console.log('');
    }
    
    if (duplicateUsers.length > 0) {
      console.log('⚠️  DUPLICAÇÕES DE USER_ID DETECTADAS:');
      duplicateUsers.forEach(id => console.log(`   - ${id}`));
      console.log('');
    }
    
    if (duplicateDevices.length === 0 && duplicateUsers.length === 0) {
      console.log('✅ Nenhuma duplicação detectada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
  }
}

checkTable();