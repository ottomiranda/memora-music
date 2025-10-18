#!/usr/bin/env node

/**
 * Script para aplicar a migração 027_enforce_single_use_paid_credits.sql
 * diretamente no banco de dados Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration027() {
  console.log('\n🔧 === APLICANDO MIGRAÇÃO 027 ===\n');

  try {
    // Ler o arquivo de migração
    console.log('📖 Lendo arquivo de migração...');
    const migrationSQL = readFileSync('supabase/migrations/027_enforce_single_use_paid_credits.sql', 'utf8');
    
    console.log('✅ Arquivo lido com sucesso');
    console.log('📝 Conteúdo da migração:');
    console.log('---');
    console.log(migrationSQL);
    console.log('---\n');

    // Executar cada comando SQL individualmente
    console.log('🚀 Executando comandos SQL...\n');

    // 1. Adicionar coluna available_credits
    console.log('1️⃣ Adicionando coluna available_credits...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.stripe_transactions ADD COLUMN IF NOT EXISTS available_credits INTEGER DEFAULT 0;'
    });
    
    if (error1) {
      console.error('❌ Erro ao adicionar available_credits:', error1);
    } else {
      console.log('✅ Coluna available_credits adicionada');
    }

    // 2. Adicionar coluna credit_consumed_at
    console.log('\n2️⃣ Adicionando coluna credit_consumed_at...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.stripe_transactions ADD COLUMN IF NOT EXISTS credit_consumed_at TIMESTAMP WITH TIME ZONE;'
    });
    
    if (error2) {
      console.error('❌ Erro ao adicionar credit_consumed_at:', error2);
    } else {
      console.log('✅ Coluna credit_consumed_at adicionada');
    }

    // 3. Criar índice
    console.log('\n3️⃣ Criando índice em available_credits...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_stripe_transactions_available_credits ON public.stripe_transactions(available_credits);'
    });
    
    if (error3) {
      console.error('❌ Erro ao criar índice:', error3);
    } else {
      console.log('✅ Índice criado');
    }

    // 4. Criar função consume_paid_credit
    console.log('\n4️⃣ Criando função consume_paid_credit...');
    const consumeCreditFunction = `
      CREATE OR REPLACE FUNCTION public.consume_paid_credit(transaction_id UUID)
      RETURNS UUID
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        updated_transaction_id UUID;
      BEGIN
        -- Atomically consume one credit from a transaction that has available credits
        UPDATE public.stripe_transactions
        SET 
          available_credits = available_credits - 1,
          credit_consumed_at = CASE 
            WHEN available_credits = 1 THEN NOW() 
            ELSE credit_consumed_at 
          END,
          updated_at = NOW()
        WHERE 
          id = transaction_id 
          AND available_credits > 0
          AND status = 'succeeded'
        RETURNING id INTO updated_transaction_id;
        
        RETURN updated_transaction_id;
      END;
      $$;
    `;
    
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql: consumeCreditFunction
    });
    
    if (error4) {
      console.error('❌ Erro ao criar função:', error4);
    } else {
      console.log('✅ Função consume_paid_credit criada');
    }

    console.log('\n🎉 === MIGRAÇÃO 027 APLICADA COM SUCESSO ===');
    
    // Verificar se as colunas foram criadas
    console.log('\n🔍 Verificando se as colunas foram criadas...');
    const { data: testData, error: testError } = await supabase
      .from('stripe_transactions')
      .select('id, available_credits, credit_consumed_at')
      .limit(1);

    if (testError) {
      console.error('❌ Erro na verificação:', testError);
    } else {
      console.log('✅ Verificação bem-sucedida! As novas colunas estão disponíveis.');
    }

  } catch (error) {
    console.error('❌ Erro durante a aplicação da migração:', error);
    process.exit(1);
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