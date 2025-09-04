#!/usr/bin/env node

/**
 * Script para aplicar a migração device_id diretamente via API do Supabase
 * Este script executa o SQL da migração usando a API REST do Supabase
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🚀 Aplicando migração device_id na tabela users...');

// Carregar variáveis de ambiente
let supabaseUrl, accessToken;

try {
  // Tentar carregar do .env
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.startsWith('SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim().replace(/["']/g, '');
      }
      if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
        accessToken = line.split('=')[1].trim().replace(/["']/g, '');
      }
    }
    
    console.log('📋 Configuração carregada do .env');
  }
} catch (error) {
  console.log('⚠️  Erro ao carregar .env:', error.message);
}

// Verificar se temos as credenciais necessárias
if (!supabaseUrl || !accessToken) {
  console.log('❌ Erro: Credenciais do Supabase não encontradas.');
  console.log('💡 Certifique-se de que o arquivo .env contém:');
  console.log('   SUPABASE_URL=sua_url_aqui');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
  process.exit(1);
}

console.log('📋 Configuração:');
console.log(`   Supabase URL: ${supabaseUrl}`);
console.log(`   Token: ${accessToken.substring(0, 20)}...`);

// SQL da migração
const migrationSQL = `
-- Adicionar coluna device_id à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Criar índice para melhor performance nas consultas por device_id
CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);

-- Comentário da coluna
COMMENT ON COLUMN users.device_id IS 'Identificador único do dispositivo para usuários anônimos';
`;

console.log('\n🔍 SQL a ser executado:');
console.log(migrationSQL);

try {
  // Executar a migração usando a API do Supabase
  console.log('\n🚀 Executando migração...');
  
  const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': accessToken,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  
  const req = https.request(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`\n📊 Status da resposta: ${res.statusCode}`);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\n🎉 SUCESSO: Migração aplicada com sucesso!');
        console.log('✅ A coluna device_id foi adicionada à tabela users.');
        
        // Verificar se a resposta contém dados
        if (data) {
          try {
            const result = JSON.parse(data);
            console.log('📋 Resultado da migração:');
            console.log(JSON.stringify(result, null, 2));
          } catch (e) {
            console.log('📋 Resposta da migração:', data);
          }
        }
        
        console.log('\n🔍 Executando verificação...');
        // Executar verificação após a migração
        setTimeout(() => {
          const { exec } = require('child_process');
          exec('node verify-device-id-column.cjs', (error, stdout, stderr) => {
            if (error) {
              console.log('⚠️  Erro na verificação:', error.message);
            } else {
              console.log(stdout);
            }
          });
        }, 2000);
        
      } else {
        console.log('❌ Erro na migração:');
        console.log('Resposta:', data);
        
        if (res.statusCode === 401) {
          console.log('\n💡 Erro de autenticação. Verifique:');
          console.log('   - Se o token SERVICE_ROLE_KEY está correto');
          console.log('   - Se o token tem permissões administrativas');
        } else if (res.statusCode === 404) {
          console.log('\n💡 Função exec_sql não encontrada. Tentando método alternativo...');
          
          // Método alternativo: executar SQL diretamente
          console.log('\n🔄 Tentando executar SQL via método alternativo...');
          console.log('💡 Execute manualmente no console do Supabase:');
          console.log(migrationSQL);
        }
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
    console.log('\n💡 Execute manualmente no console do Supabase:');
    console.log(migrationSQL);
  });
  
  // Enviar o payload
  const payload = JSON.stringify({ sql: migrationSQL });
  req.write(payload);
  req.end();
  
} catch (error) {
  console.error('❌ Erro ao executar migração:', error.message);
  console.log('\n💡 Execute manualmente no console do Supabase:');
  console.log(migrationSQL);
  process.exit(1);
}