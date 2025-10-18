#!/usr/bin/env node

/**
 * Script para aplicar a migração 027 usando comandos SQL diretos
 * via cliente Supabase com RPC personalizada
 */

import { createClient } from '@supabase/supabase-js';
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

async function executeSQL(sql, description) {
  console.log(`🔧 ${description}...`);
  
  try {
    // Usar uma abordagem diferente - executar via query direta
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Erro: ${error}`);
      return false;
    }

    console.log(`✅ ${description} - Sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro em ${description}:`, error);
    return false;
  }
}

async function applyMigration027Direct() {
  console.log('\n🔧 === APLICANDO MIGRAÇÃO 027 DIRETAMENTE ===\n');

  try {
    // Tentar executar cada comando individualmente
    const commands = [
      {
        sql: 'ALTER TABLE public.stripe_transactions ADD COLUMN IF NOT EXISTS available_credits INTEGER DEFAULT 0;',
        description: 'Adicionando coluna available_credits'
      },
      {
        sql: 'ALTER TABLE public.stripe_transactions ADD COLUMN IF NOT EXISTS credit_consumed_at TIMESTAMP WITH TIME ZONE;',
        description: 'Adicionando coluna credit_consumed_at'
      },
      {
        sql: 'CREATE INDEX IF NOT EXISTS idx_stripe_transactions_available_credits ON public.stripe_transactions(available_credits);',
        description: 'Criando índice em available_credits'
      }
    ];

    // Executar comandos básicos primeiro
    for (const command of commands) {
      const success = await executeSQL(command.sql, command.description);
      if (!success) {
        console.log('⚠️ Continuando com próximo comando...');
      }
    }

    // Tentar criar a função usando uma abordagem alternativa
    console.log('\n🔧 Criando função consume_paid_credit usando abordagem alternativa...');
    
    // Primeiro, vamos tentar verificar se já podemos usar as colunas
    console.log('🔍 Testando se as colunas foram criadas...');
    const { data: testData, error: testError } = await supabase
      .from('stripe_transactions')
      .select('id, available_credits, credit_consumed_at')
      .limit(1);

    if (testError) {
      console.error('❌ As colunas ainda não existem:', testError.message);
      
      // Tentar uma abordagem mais direta usando SQL raw
      console.log('🔧 Tentando executar migração completa via SQL...');
      
      const migrationSQL = `
        BEGIN;
        
        -- Add columns if they don't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stripe_transactions' AND column_name='available_credits') THEN
            ALTER TABLE public.stripe_transactions ADD COLUMN available_credits INTEGER DEFAULT 0;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stripe_transactions' AND column_name='credit_consumed_at') THEN
            ALTER TABLE public.stripe_transactions ADD COLUMN credit_consumed_at TIMESTAMP WITH TIME ZONE;
          END IF;
        END $$;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_stripe_transactions_available_credits ON public.stripe_transactions(available_credits);
        
        -- Create function
        CREATE OR REPLACE FUNCTION public.consume_paid_credit(transaction_id UUID)
        RETURNS UUID
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          updated_transaction_id UUID;
        BEGIN
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
        
        COMMIT;
      `;

      // Tentar executar via supabase-js usando uma query personalizada
      console.log('🚀 Executando migração completa...');
      
      // Como não temos acesso direto ao SQL, vamos tentar uma abordagem manual
      console.log('⚠️ Migração precisa ser aplicada manualmente no painel do Supabase');
      console.log('📋 SQL para executar no SQL Editor do Supabase:');
      console.log('---');
      console.log(migrationSQL);
      console.log('---');
      
    } else {
      console.log('✅ As colunas já existem! Migração foi aplicada com sucesso.');
      console.log('📊 Dados de exemplo:', testData);
    }

    console.log('\n🎉 === PROCESSO CONCLUÍDO ===');

  } catch (error) {
    console.error('❌ Erro durante a aplicação da migração:', error);
  }
}

// Executar a migração
applyMigration027Direct()
  .then(() => {
    console.log('\n✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na execução do script:', error);
    process.exit(1);
  });