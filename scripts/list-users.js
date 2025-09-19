import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase usando service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
  try {
    console.log('🔍 Listando usuários na tabela user_creations...');
    
    // Buscar todos os usuários
    const { data: users, error } = await supabase
      .from('user_creations')
      .select('id, email, freesongsused, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('📭 Nenhum usuário encontrado na tabela user_creations.');
      console.log('💡 Dica: Talvez você precise fazer login na aplicação primeiro para criar um usuário.');
      return;
    }
    
    console.log(`✅ Encontrados ${users.length} usuário(s):`);
    console.log('\n📋 Lista de usuários:');
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Contador: ${user.freesongsused || 0}`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    });
    
    if (users.length > 0) {
      console.log('\n💡 Para resetar o contador de um usuário, use:');
      console.log(`   node scripts/reset-user-counter.js ${users[0].email}`);
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar a listagem
listUsers()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });