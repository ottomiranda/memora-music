const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('👤 CRIANDO USUÁRIO DE TESTE\n');
  
  try {
    // Criar usuário de teste
    const { data, error } = await serviceClient.auth.admin.createUser({
      email: 'teste@memora.music',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Usuário Teste'
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Usuário de teste já existe');
        
        // Buscar usuário existente
        const { data: users, error: listError } = await serviceClient.auth.admin.listUsers();
        if (!listError) {
          const testUser = users.users.find(u => u.email === 'teste@memora.music');
          if (testUser) {
            console.log(`   User ID: ${testUser.id}`);
            return testUser.id;
          }
        }
      } else {
        console.error('❌ Erro ao criar usuário:', error.message);
        return null;
      }
    } else {
      console.log('✅ Usuário de teste criado com sucesso');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      return data.user.id;
    }
    
  } catch (error) {
    console.error('❌ Erro durante criação do usuário:', error.message);
    return null;
  }
}

// Executar criação
createTestUser().then((userId) => {
  if (userId) {
    console.log('\n🎉 Usuário de teste pronto para uso');
    console.log(`\n📝 Use estas credenciais no teste:`);
    console.log(`   Email: teste@memora.music`);
    console.log(`   Password: testpassword123`);
    console.log(`   User ID: ${userId}`);
  } else {
    console.log('\n❌ Falha ao preparar usuário de teste');
  }
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});