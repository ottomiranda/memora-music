import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanTestData() {
  console.log('🧹 Limpando dados de teste da tabela user_creations...');
  
  try {
    // Deletar todos os registros de teste e registros com IP ::1 (localhost)
    const { data, error } = await supabase
      .from('user_creations')
      .delete()
      .or('device_id.like.test-%,last_used_ip.eq.::1,ip.eq.::1');
    
    if (error) {
      console.error('❌ Erro ao limpar dados:', error);
      return false;
    }
    
    console.log('✅ Dados de teste limpos com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Exceção ao limpar dados:', error);
    return false;
  }
}

cleanTestData().then(success => {
  process.exit(success ? 0 : 1);
});