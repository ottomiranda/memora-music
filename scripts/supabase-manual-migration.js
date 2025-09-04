#!/usr/bin/env node
/**
 * Script para aplicar migrações do Supabase usando accessToken manual
 * 
 * Como usar:
 * 1. Gere um accessToken no console do Supabase:
 *    - Vá para Settings > API
 *    - Copie o service_role key (este é seu accessToken)
 * 2. Execute: node scripts/supabase-manual-migration.js <migration-file> <access-token>
 * 
 * Exemplo:
 * node scripts/supabase-manual-migration.js supabase/migrations/010_add_device_id_column.sql your-service-role-key
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Carregar variáveis de ambiente
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL não encontrada no arquivo .env');
  process.exit(1);
}

function executeSQL(sql, accessToken) {
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
          resolve({ statusCode: res.statusCode, data: data });
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

async function applyMigration(migrationFile, accessToken) {
  try {
    console.log(`📁 Lendo arquivo de migração: ${migrationFile}`);
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationFile}`);
    }

    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log(`📝 SQL a ser executado:\n${sql}\n`);

    console.log('🚀 Aplicando migração...');
    const result = await executeSQL(sql, accessToken);
    
    console.log('✅ Migração aplicada com sucesso!');
    console.log(`📊 Status: ${result.statusCode}`);
    if (result.data) {
      console.log(`📋 Resposta: ${result.data}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error.message);
    process.exit(1);
  }
}

// Verificar argumentos da linha de comando
if (process.argv.length < 4) {
  console.log('📖 Uso: node scripts/supabase-manual-migration.js <migration-file> <access-token>');
  console.log('\n📝 Exemplo:');
  console.log('node scripts/supabase-manual-migration.js supabase/migrations/010_add_device_id_column.sql your-service-role-key');
  console.log('\n🔑 Como obter o accessToken:');
  console.log('1. Acesse o console do Supabase');
  console.log('2. Vá para Settings > API');
  console.log('3. Copie o service_role key');
  process.exit(1);
}

const migrationFile = process.argv[2];
const accessToken = process.argv[3];

// Executar migração
applyMigration(migrationFile, accessToken);