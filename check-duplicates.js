import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDuplicates() {
  console.log('🔍 Verificando duplicações na tabela user_creations...');
  
  const { data, error } = await supabase
    .from('user_creations')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Erro ao buscar dados:', error);
    return;
  }
  
  console.log(`📊 Total de registros: ${data.length}`);
  
  // Verificar duplicações por device_id
  const deviceIdGroups = {};
  const duplicatesByDeviceId = [];
  
  data.forEach(record => {
    if (record.device_id) {
      if (!deviceIdGroups[record.device_id]) {
        deviceIdGroups[record.device_id] = [];
      }
      deviceIdGroups[record.device_id].push(record);
    }
  });
  
  Object.entries(deviceIdGroups).forEach(([deviceId, records]) => {
    if (records.length > 1) {
      duplicatesByDeviceId.push({ deviceId, records });
    }
  });
  
  console.log(`🔄 Registros duplicados por device_id: ${duplicatesByDeviceId.length}`);
  
  if (duplicatesByDeviceId.length > 0) {
    console.log('\n📋 Detalhes dos duplicados por device_id:');
    duplicatesByDeviceId.forEach(({ deviceId, records }) => {
      console.log(`\n🔸 Device ID: ${deviceId}`);
      records.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record.id} | Status: ${record.status} | FreeSongs: ${record.freesongsused} | Created: ${record.created_at}`);
      });
    });
  }
  
  // Verificar registros com mesmo IP
  const ipGroups = {};
  const duplicatesByIp = [];
  
  data.forEach(record => {
    if (record.last_used_ip) {
      if (!ipGroups[record.last_used_ip]) {
        ipGroups[record.last_used_ip] = [];
      }
      ipGroups[record.last_used_ip].push(record);
    }
  });
  
  Object.entries(ipGroups).forEach(([ip, records]) => {
    if (records.length > 1) {
      duplicatesByIp.push({ ip, records });
    }
  });
  
  console.log(`\n🌐 Registros com mesmo IP: ${duplicatesByIp.length}`);
  
  if (duplicatesByIp.length > 0) {
    console.log('\n📋 Detalhes dos registros com mesmo IP:');
    duplicatesByIp.forEach(({ ip, records }) => {
      console.log(`\n🔸 IP: ${ip}`);
      records.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record.id} | Device: ${record.device_id} | Status: ${record.status} | FreeSongs: ${record.freesongsused}`);
      });
    });
  }
  
  // Mostrar todos os registros para análise
  console.log('\n📋 Todos os registros:');
  data.forEach((record, index) => {
    console.log(`${index + 1}. ID: ${record.id} | Device: ${record.device_id || 'null'} | IP: ${record.last_used_ip || 'null'} | Status: ${record.status} | FreeSongs: ${record.freesongsused} | Created: ${record.created_at}`);
  });
}

checkDuplicates().catch(console.error);