import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase usando service role key para operações administrativas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetUserCounter(userEmail) {
  try {
    console.log(`🔍 Buscando usuário: ${userEmail}`);
    
    // Buscar o usuário pelo email
    const { data: users, error: searchError } = await supabase
      .from('user_creations')
      .select('id, email, freesongsused')
      .eq('email', userEmail)
      .limit(1);
    
    if (searchError) {
      console.error('❌ Erro ao buscar usuário:', searchError.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ Usuário não encontrado com o email:', userEmail);
      return;
    }
    
    const user = users[0];
    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Contador atual: ${user.freesongsused || 0}`);
    
    // Resetar o contador para 0
    const { data: updateData, error: updateError } = await supabase
      .from('user_creations')
      .update({ freesongsused: 0 })
      .eq('id', user.id)
      .select('id, email, freesongsused');
    
    if (updateError) {
      console.error('❌ Erro ao atualizar contador:', updateError.message);
      return;
    }
    
    console.log('\n🎉 Contador resetado com sucesso!');
    console.log(`   Valor anterior: ${user.freesongsused || 0}`);
    console.log(`   Valor atual: ${updateData[0].freesongsused}`);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Verificar se foi fornecido um email como argumento
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('📋 Uso: node scripts/reset-user-counter.js <email-do-usuario>');
  console.log('📋 Exemplo: node scripts/reset-user-counter.js teste@exemplo.com');
  process.exit(1);
}

// Executar o reset
resetUserCounter(userEmail)
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });