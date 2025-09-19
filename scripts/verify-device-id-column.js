#!/usr/bin/env node
/**
 * Script para verificar se a coluna device_id foi adicionada na tabela user_creations
 * 
 * Como usar:
 * 1. Com accessToken manual:
 *    node scripts/verify-device-id-column.js <access-token>
 * 2. Usando variáveis de ambiente (service_role_key):
 *    node scripts/verify-device-id-column.js
 */

const https = require('https');
const { URL } = require('url');

// Carregar variáveis de ambiente
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL não encontrada no arquivo .env');
  process.exit(1);
}

function queryDatabase(sql, accessToken) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    
    const postData = JSON.stringify({
      sql: sql
    });

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${accessToken}`,
        'apikey': accessToken
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function verifyDeviceIdColumn(accessToken) {
  try {
    console.log('🔍 Verificando estrutura da tabela user_creations...');
    
    // Query para verificar se a coluna device_id existe
    const columnCheckSQL = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'user_creations' 
        AND column_name = 'device_id';
    `;
    
    const columnResult = await queryDatabase(columnCheckSQL, accessToken);
    
    if (columnResult && columnResult.length > 0) {
      console.log('✅ Coluna device_id encontrada na tabela user_creations!');
      console.log('📋 Detalhes da coluna:');
      columnResult.forEach(col => {
        console.log(`   - Nome: ${col.column_name}`);
        console.log(`   - Tipo: ${col.data_type}`);
        console.log(`   - Nullable: ${col.is_nullable}`);
        console.log(`   - Default: ${col.column_default || 'NULL'}`);
      });
    } else {
      console.log('❌ Coluna device_id NÃO encontrada na tabela user_creations');
      console.log('\n📝 Para adicionar a coluna, execute:');
      console.log('node scripts/supabase-manual-migration.js supabase/migrations/010_add_device_id_column.sql <your-access-token>');
      return false;
    }
    
    // Verificar índice na coluna device_id
    console.log('\n🔍 Verificando índices na coluna device_id...');
    const indexCheckSQL = `
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'user_creations' 
        AND indexdef LIKE '%device_id%';
    `;
    
    const indexResult = await queryDatabase(indexCheckSQL, accessToken);
    
    if (indexResult && indexResult.length > 0) {
      console.log('✅ Índices encontrados na coluna device_id:');
      indexResult.forEach(idx => {
        console.log(`   - ${idx.indexname}: ${idx.indexdef}`);
      });
    } else {
      console.log('⚠️  Nenhum índice encontrado na coluna device_id');
    }
    
    // Verificar algumas linhas da tabela user_creations
    console.log('\n🔍 Verificando dados de exemplo na tabela user_creations...');
    const dataCheckSQL = `
      SELECT 
        id,
        email,
        device_id,
        created_at
      FROM user_creations 
      ORDER BY created_at DESC 
      LIMIT 3;
    `;
    
    const dataResult = await queryDatabase(dataCheckSQL, accessToken);
    
    if (dataResult && dataResult.length > 0) {
      console.log('✅ Dados de exemplo da tabela user_creations:');
      dataResult.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}`);
        console.log(`      Email: ${user.email || 'N/A'}`);
        console.log(`      Device ID: ${user.device_id || 'NULL'}`);
        console.log(`      Criado em: ${user.created_at}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  Nenhum usuário encontrado na tabela user_creations');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao verificar coluna device_id:', error.message);
    return false;
  }
}

// Determinar accessToken a usar
let accessToken;
if (process.argv.length >= 3) {
  accessToken = process.argv[2];
  console.log('🔑 Usando accessToken fornecido via linha de comando');
} else if (SUPABASE_SERVICE_ROLE_KEY) {
  accessToken = SUPABASE_SERVICE_ROLE_KEY;
  console.log('🔑 Usando SUPABASE_SERVICE_ROLE_KEY do arquivo .env');
} else {
  console.error('❌ AccessToken não fornecido');
  console.log('\n📖 Uso:');
  console.log('1. Com accessToken manual: node scripts/verify-device-id-column.js <access-token>');
  console.log('2. Com variável de ambiente: certifique-se que SUPABASE_SERVICE_ROLE_KEY está no .env');
  process.exit(1);
}

// Executar verificação
verifyDeviceIdColumn(accessToken).then(success => {
  if (success) {
    console.log('\n🎉 Verificação concluída com sucesso!');
  } else {
    console.log('\n⚠️  Verificação concluída com problemas');
    process.exit(1);
  }
});