// Script de diagnóstico backend para verificar usuário mari@marianadoces.com.br
// Este script usa a service_role_key para acessar diretamente a tabela auth.users
// ATENÇÃO: Execute apenas em ambiente de desenvolvimento!

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nvhaylwuvdmsjuwjsfva.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGF5bHd1dmRtc2p1d2pzZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NzAzOSwiZXhwIjoyMDcyMzQzMDM5fQ.P8-0hboVl3OmtUwzg0iBCvTr5nY0jWMTTLr9F5XTB6c';

async function diagnoseUserMari() {
  console.log('🔍 Iniciando diagnóstico backend para mari@marianadoces.com.br');
  
  try {
    // Criar cliente Supabase com service_role_key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✅ Cliente Supabase inicializado com service_role_key');
    
    // 1. Buscar usuário específico por email
    console.log('\n📧 Buscando usuário mari@marianadoces.com.br...');
    
    const { data: specificUser, error: specificError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', 'mari@marianadoces.com.br')
      .single();
    
    if (specificError && specificError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário específico:', specificError);
    } else if (specificError && specificError.code === 'PGRST116') {
      console.log('❌ Usuário mari@marianadoces.com.br NÃO ENCONTRADO na tabela auth.users');
    } else {
      console.log('✅ Usuário mari@marianadoces.com.br ENCONTRADO:');
      console.log(JSON.stringify(specificUser, null, 2));
    }
    
    // 2. Buscar usuários com emails similares
    console.log('\n🔍 Buscando usuários com emails similares...');
    
    const { data: similarUsers, error: similarError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at, created_at, deleted_at')
      .or('email.ilike.%mari%, email.ilike.%mariana%');
    
    if (similarError) {
      console.error('❌ Erro ao buscar usuários similares:', similarError);
    } else {
      console.log(`📋 Encontrados ${similarUsers.length} usuários com emails similares:`);
      similarUsers.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id}, Criado: ${user.created_at}, Confirmado: ${user.email_confirmed_at || 'Não'})`);
      });
    }
    
    // 3. Buscar usuários criados nas últimas 24 horas
    console.log('\n⏰ Buscando usuários criados nas últimas 24 horas...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: recentUsers, error: recentError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at, created_at, deleted_at')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });
    
    if (recentError) {
      console.error('❌ Erro ao buscar usuários recentes:', recentError);
    } else {
      console.log(`📋 Encontrados ${recentUsers.length} usuários criados nas últimas 24 horas:`);
      recentUsers.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id}, Criado: ${user.created_at}, Confirmado: ${user.email_confirmed_at || 'Não'})`);
      });
    }
    
    // 4. Buscar usuários com confirmation_token pendente
    console.log('\n📧 Buscando usuários com confirmação pendente...');
    
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('auth.users')
      .select('id, email, confirmation_token, confirmation_sent_at, email_confirmed_at, created_at')
      .not('confirmation_token', 'is', null)
      .is('email_confirmed_at', null)
      .order('created_at', { ascending: false });
    
    if (pendingError) {
      console.error('❌ Erro ao buscar usuários com confirmação pendente:', pendingError);
    } else {
      console.log(`📋 Encontrados ${pendingUsers.length} usuários com confirmação pendente:`);
      pendingUsers.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id}, Criado: ${user.created_at}, Token enviado: ${user.confirmation_sent_at})`);
      });
    }
    
    // 5. Contar total de usuários
    console.log('\n📊 Estatísticas gerais...');
    
    const { count: totalUsers, error: countError } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar usuários:', countError);
    } else {
      console.log(`👥 Total de usuários na tabela auth.users: ${totalUsers}`);
    }
    
    // 6. Verificar configurações de auth
    console.log('\n⚙️ Verificando configurações de autenticação...');
    
    try {
      const { data: authConfig, error: configError } = await supabase.auth.admin.listUsers();
      
      if (configError) {
        console.error('❌ Erro ao acessar configurações de auth:', configError);
      } else {
        console.log(`👥 Total de usuários via Auth Admin API: ${authConfig.users.length}`);
        
        // Procurar especificamente pelo usuário mari
        const mariUser = authConfig.users.find(u => u.email === 'mari@marianadoces.com.br');
        if (mariUser) {
          console.log('✅ Usuário mari@marianadoces.com.br encontrado via Auth Admin API:');
          console.log(JSON.stringify(mariUser, null, 2));
        } else {
          console.log('❌ Usuário mari@marianadoces.com.br NÃO encontrado via Auth Admin API');
        }
      }
    } catch (adminError) {
      console.error('❌ Erro ao usar Auth Admin API:', adminError);
    }
    
  } catch (error) {
    console.error('💥 Erro durante diagnóstico:', error);
  }
  
  console.log('\n🏁 Diagnóstico backend concluído');
}

// Executar diagnóstico
diagnoseUserMari();

export { diagnoseUserMari };