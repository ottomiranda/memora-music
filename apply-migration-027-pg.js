#!/usr/bin/env node

/**
 * Script para aplicar a migração 027_enforce_single_use_paid_credits.sql
 * usando conexão direta com PostgreSQL via biblioteca pg
 */

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Variável de ambiente DATABASE_URL é obrigatória');
  process.exit(1);
}

async function applyMigration027() {
  console.log('\n🔧 === APLICANDO MIGRAÇÃO 027 VIA PG ===\n');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Conectar ao banco
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso');

    // Ler o arquivo de migração
    console.log('\n📖 Lendo arquivo de migração...');
    const migrationSQL = readFileSync('supabase/migrations/027_enforce_single_use_paid_credits.sql', 'utf8');
    console.log('✅ Arquivo lido com sucesso');

    // Executar a migração completa
    console.log('\n🚀 Executando migração...');
    await client.query(migrationSQL);
    console.log('✅ Migração executada com sucesso');

    // Verificar se as colunas foram criadas
    console.log('\n🔍 Verificando se as colunas foram criadas...');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stripe_transactions' 
      AND table_schema = 'public'
      AND column_name IN ('available_credits', 'credit_consumed_at')
      ORDER BY column_name;
    `);

    if (result.rows.length === 2) {
      console.log('✅ Verificação bem-sucedida! As novas colunas foram criadas:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('❌ Algumas colunas não foram encontradas:', result.rows);
    }

    // Verificar se a função foi criada
    console.log('\n🔍 Verificando se a função consume_paid_credit foi criada...');
    const funcResult = await client.query(`
      SELECT proname, pronargs 
      FROM pg_proc 
      WHERE proname = 'consume_paid_credit' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    `);

    if (funcResult.rows.length > 0) {
      console.log('✅ Função consume_paid_credit criada com sucesso');
    } else {
      console.log('❌ Função consume_paid_credit não foi encontrada');
    }

    console.log('\n🎉 === MIGRAÇÃO 027 APLICADA COM SUCESSO ===');

  } catch (error) {
    console.error('❌ Erro durante a aplicação da migração:', error);
    process.exit(1);
  } finally {
    // Fechar conexão
    await client.end();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar a migração
applyMigration027()
  .then(() => {
    console.log('\n✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na execução do script:', error);
    process.exit(1);
  });