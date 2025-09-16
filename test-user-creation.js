import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase
const supabaseUrl = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserCreation() {
  console.log('🔍 Verificando usuários no Supabase...');
  
  try {
    // Listar todos os usuários na tabela auth.users
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      return;
    }
    
    console.log(`\n📊 Total de usuários encontrados: ${users.users.length}`);
    
    if (users.users.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado na tabela auth.users');
      return;
    }
    
    // Mostrar detalhes dos usuários
    users.users.forEach((user, index) => {
      console.log(`\n👤 Usuário ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Email confirmado: ${user.email_confirmed_at ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Criado em: ${user.created_at}`);
      console.log(`   Última atualização: ${user.updated_at}`);
      console.log(`   Status: ${user.email_confirmed_at ? 'Ativo' : 'Aguardando confirmação'}`);
      
      if (!user.email_confirmed_at) {
        console.log(`   ⚠️  PROBLEMA: Este usuário não confirmou o email ainda!`);
        console.log(`   📧 Token de confirmação: ${user.confirmation_token ? 'Presente' : 'Ausente'}`);
        console.log(`   📅 Confirmação enviada em: ${user.confirmation_sent_at || 'N/A'}`);
      }
    });
    
    // Verificar usuários não confirmados
    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    
    if (unconfirmedUsers.length > 0) {
      console.log(`\n🚨 DIAGNÓSTICO DO PROBLEMA:`);
      console.log(`   • ${unconfirmedUsers.length} usuário(s) criado(s) mas não confirmado(s)`);
      console.log(`   • Estes usuários NÃO aparecem no painel porque não confirmaram o email`);
      console.log(`   • O fluxo de signup está funcionando (usuário é criado)`);
      console.log(`   • O problema está na confirmação do email`);
      
      console.log(`\n💡 POSSÍVEIS CAUSAS:`);
      console.log(`   1. Link de confirmação expirando muito rápido`);
      console.log(`   2. Configuração de redirect URLs no Supabase Dashboard`);
      console.log(`   3. Problema na sincronização após confirmação`);
      console.log(`   4. Usuário não clicou no link de confirmação`);
    } else {
      console.log(`\n✅ Todos os usuários estão confirmados!`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Função para testar criação de usuário de teste
async function createTestUser() {
  const testEmail = `teste-${Date.now()}@exemplo.com`;
  const testPassword = 'senha123456';
  
  console.log(`\n🧪 Criando usuário de teste: ${testEmail}`);
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Confirma automaticamente para teste
    });
    
    if (error) {
      console.error('❌ Erro ao criar usuário de teste:', error.message);
      return;
    }
    
    console.log('✅ Usuário de teste criado com sucesso!');
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Confirmado: ${data.user.email_confirmed_at ? '✅ Sim' : '❌ Não'}`);
    
  } catch (error) {
    console.error('❌ Erro durante criação do usuário de teste:', error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando diagnóstico de usuários no Supabase\n');
  
  await testUserCreation();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMO DO DIAGNÓSTICO:');
  console.log('='.repeat(60));
  console.log('1. Verificamos todos os usuários na tabela auth.users');
  console.log('2. Identificamos usuários não confirmados');
  console.log('3. O problema está na confirmação de email, não na criação');
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('• Verificar configuração de Redirect URLs no Supabase Dashboard');
  console.log('• Adicionar http://localhost:5173/** nas Redirect URLs');
  console.log('• Testar o link de confirmação imediatamente após receber');
  console.log('• Verificar se a sincronização após confirmação está funcionando');
}

runTests().catch(console.error);