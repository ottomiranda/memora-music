/**
 * Script para verificar se a coluna device_id foi adicionada corretamente à tabela user_creations
 * Pode usar tanto accessToken manual quanto SUPABASE_SERVICE_ROLE_KEY do .env
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Função para ler variáveis do .env
function loadEnvVars() {
  const envPath = path.join(__dirname, '.env');
  const envVars = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    });
  }
  
  return envVars;
}

// Função para fazer requisição HTTPS
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function verifyDeviceIdColumn() {
  console.log('🔍 Verificando se a coluna device_id foi adicionada à tabela user_creations...');
  
  // Carregar variáveis de ambiente
  const envVars = loadEnvVars();
  
  // Verificar se temos as variáveis necessárias
  const supabaseUrl = envVars.SUPABASE_URL;
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL não encontrada no arquivo .env');
    process.exit(1);
  }
  
  // Permitir accessToken manual via argumento da linha de comando
  const manualToken = process.argv[2];
  const accessToken = manualToken || serviceRoleKey;
  
  if (!accessToken) {
    console.error('❌ Nenhum token de acesso encontrado.');
    console.error('   Use: node verify-device-id-column.js [ACCESS_TOKEN]');
    console.error('   Ou configure SUPABASE_SERVICE_ROLE_KEY no .env');
    process.exit(1);
  }
  
  console.log('📋 Configuração:');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Token: ${accessToken.substring(0, 20)}...`);
  console.log(`   Fonte do token: ${manualToken ? 'Manual (argumento)' : 'Arquivo .env'}`);
  
  try {
    // Primeiro, vamos tentar acessar a tabela user_creations diretamente para verificar se ela existe
    console.log('\n🔍 Verificando se a tabela user_creations existe e suas colunas...');
    
    const url = `${supabaseUrl}/rest/v1/user_creations?select=*&limit=0`;
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': accessToken,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n📊 Status da resposta: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Tabela user_creations existe e é acessível!');
          
          // Agora vamos tentar fazer uma consulta que inclua device_id para verificar se a coluna existe
          console.log('\n🔍 Testando se a coluna device_id existe...');
          
          const testUrl = `${supabaseUrl}/rest/v1/user_creations?select=id,device_id&limit=1`;
          const testReq = https.request(testUrl, options, (testRes) => {
            let testData = '';
            
            testRes.on('data', (chunk) => {
              testData += chunk;
            });
            
            testRes.on('end', () => {
              console.log(`📊 Status do teste device_id: ${testRes.statusCode}`);
              
              if (testRes.statusCode === 200) {
                console.log('\n🎉 SUCESSO: A coluna device_id foi encontrada na tabela user_creations!');
                console.log('✅ A migração foi aplicada corretamente.');
                
                try {
                  const testResult = JSON.parse(testData);
                  console.log('📋 Exemplo de dados (primeiros registros):');
                  console.log(JSON.stringify(testResult, null, 2));
                } catch (e) {
                  console.log('📋 Resposta da consulta:', testData);
                }
                
              } else {
                console.log('\n❌ ERRO: A coluna device_id NÃO foi encontrada na tabela user_creations.');
                console.log('💡 Execute a migração manualmente no console do Supabase:');
                console.log('   ALTER TABLE user_creations ADD COLUMN device_id TEXT;');
                console.log('\n📋 Detalhes do erro:');
                console.log(testData);
              }
            });
          });
          
          testReq.on('error', (error) => {
            console.error('❌ Erro no teste device_id:', error.message);
          });
          
          testReq.end();
          
        } else {
          console.log('❌ Erro ao acessar a tabela user_creations:');
          console.log('Resposta:', data);
          
          if (res.statusCode === 401) {
            console.log('\n💡 Erro de autenticação. Verifique:');
            console.log('   - Se o token está correto');
            console.log('   - Se o token tem permissões para acessar a tabela user_creations');
          }
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error.message);
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar verificação
verifyDeviceIdColumn();