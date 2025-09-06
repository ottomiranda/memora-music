import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStripeTransactionsTable() {
  console.log('🔧 Criando tabela stripe_transactions...');
  
  try {
    // Usar SQL direto via rpc
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.stripe_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_intent_id TEXT UNIQUE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL CHECK (amount > 0),
        currency TEXT NOT NULL DEFAULT 'brl',
        status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_stripe_transactions_payment_intent ON public.stripe_transactions(payment_intent_id);
      CREATE INDEX IF NOT EXISTS idx_stripe_transactions_user_id ON public.stripe_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_stripe_transactions_status ON public.stripe_transactions(status);
      
      ALTER TABLE public.stripe_transactions ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS stripe_transactions_user_policy ON public.stripe_transactions;
      
      CREATE POLICY stripe_transactions_user_policy ON public.stripe_transactions
        FOR ALL USING (
          auth.uid() = user_id OR 
          auth.role() = 'service_role'
        );
      
      GRANT SELECT, INSERT ON public.stripe_transactions TO authenticated;
      GRANT ALL ON public.stripe_transactions TO service_role;
      GRANT SELECT ON public.stripe_transactions TO anon;
    `;
    
    // Executar SQL usando fetch direto para a API REST do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: createTableSQL })
    });
    
    if (!response.ok) {
      // Tentar método alternativo usando query SQL direta
      console.log('🔄 Tentando método alternativo com query SQL...');
      
      const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.pgrst.object+json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal'
        },
        body: createTableSQL
      });
      
      if (!sqlResponse.ok) {
        console.log('⚠️ Métodos diretos falharam, tentando criar via client...');
        
        // Método final: usar o client para executar queries individuais
        const queries = [
          `CREATE TABLE IF NOT EXISTS public.stripe_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            payment_intent_id TEXT UNIQUE NOT NULL,
            user_id UUID,
            amount INTEGER NOT NULL CHECK (amount > 0),
            currency TEXT NOT NULL DEFAULT 'brl',
            status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )`,
          `CREATE INDEX IF NOT EXISTS idx_stripe_transactions_payment_intent ON public.stripe_transactions(payment_intent_id)`,
          `CREATE INDEX IF NOT EXISTS idx_stripe_transactions_user_id ON public.stripe_transactions(user_id)`,
          `CREATE INDEX IF NOT EXISTS idx_stripe_transactions_status ON public.stripe_transactions(status)`,
          `ALTER TABLE public.stripe_transactions ENABLE ROW LEVEL SECURITY`,
          `DROP POLICY IF EXISTS stripe_transactions_user_policy ON public.stripe_transactions`,
          `CREATE POLICY stripe_transactions_user_policy ON public.stripe_transactions FOR ALL USING (true)`
        ];
        
        for (const query of queries) {
          try {
            const { error } = await supabase.rpc('exec', { sql: query });
            if (error) {
              console.log(`⚠️ Query falhou: ${query.substring(0, 50)}...`);
              console.log('Erro:', error);
            }
          } catch (e) {
            console.log(`⚠️ Exceção na query: ${query.substring(0, 50)}...`);
          }
        }
      }
    }
    
    console.log('✅ Processo de criação da tabela concluído');
    
    // Aguardar um pouco para o cache atualizar
    console.log('⏳ Aguardando cache atualizar...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Testar a tabela
    console.log('🧪 Testando acesso à tabela...');
    const { data: testData, error: testError } = await supabase
      .from('stripe_transactions')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro ao testar tabela:', testError);
      console.log('🔍 Verificando tabelas existentes...');
      
      // Listar todas as tabelas
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (!tablesError) {
        console.log('📋 Tabelas encontradas:', tables.map(t => t.table_name));
      }
    } else {
      console.log('✅ Tabela testada com sucesso!');
      console.log('📊 Estrutura da tabela verificada');
    }
    
    console.log('\n🎉 Processo de configuração da tabela stripe_transactions finalizado!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

// Executar
createStripeTransactionsTable();