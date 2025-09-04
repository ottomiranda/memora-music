/**
 * Script para verificar se a coluna device_id foi adicionada corretamente à tabela users
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
  console.log('🔍 Verificando se a coluna device_id foi adicionada à tabela users...');
  
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
    // Consultar a estrutura da tabela users
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
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
    
    console.log('\n🔍 Consultando estrutura da tabela users...');
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n📊 Status da resposta: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            
            if (Array.isArray(result) && result.length > 0) {
              console.log('\n✅ Estrutura da tabela users:');
              console.log('┌─────────────────────┬─────────────────┬─────────────┬─────────────────┐');
              console.log('│ Column Name         │ Data Type       │ Nullable    │ Default         │');
              console.log('├─────────────────────┼─────────────────┼─────────────┼─────────────────┤');
              
              let deviceIdFound = false;
              
              result.forEach(column => {
                const name = (column.column_name || '').padEnd(19);
                const type = (column.data_type || '').padEnd(15);
                const nullable = (column.is_nullable || '').padEnd(11);
                const defaultVal = (column.column_default || 'NULL').padEnd(15);
                
                console.log(`│ ${name} │ ${type} │ ${nullable} │ ${defaultVal} │`);
                
                if (column.column_name === 'device_id') {
                  deviceIdFound = true;
                }
              });
              
              console.log('└─────────────────────┴─────────────────┴─────────────┴─────────────────┘');
              
              if (deviceIdFound) {
                console.log('\n🎉 SUCESSO: A coluna device_id foi encontrada na tabela users!');
                console.log('✅ A migração foi aplicada corretamente.');
              } else {
                console.log('\n❌ ERRO: A coluna device_id NÃO foi encontrada na tabela users.');
                console.log('💡 Execute a migração manualmente no console do Supabase:');
                console.log('   ALTER TABLE users ADD COLUMN device_id TEXT;');
              }
              
            } else {
              console.log('❌ Nenhuma coluna encontrada na tabela users');
              console.log('Resposta:', JSON.stringify(result, null, 2));
            }
            
          } catch (parseError) {
            console.log('❌ Erro ao fazer parse da resposta:', parseError.message);
            console.log('Resposta bruta:', data);
          }
        } else {
          console.log('❌ Erro na requisição:');
          console.log('Resposta:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error.message);
    });
    
    // Enviar o payload
    const payload = JSON.stringify({ sql: query });
    req.write(payload);
    req.end();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar verificação
verifyDeviceIdColumn();