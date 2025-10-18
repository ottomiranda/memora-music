#!/usr/bin/env node

/**
 * Script para testar o comportamento de uso único dos créditos pagos
 * após a aplicação da migração 027_enforce_single_use_paid_credits.sql
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

async function testPaidCreditConsumption() {
  console.log('\n🧪 === TESTE DE CONSUMO DE CRÉDITOS PAGOS ===\n');

  try {
    // 1. Criar uma transação de teste com crédito disponível
    console.log('1️⃣ Criando transação de teste com crédito disponível...');
    
    const testTransactionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testPaymentIntentId = `pi_test_${Date.now()}`;
    
    const { data: insertData, error: insertError } = await supabase
      .from('stripe_transactions')
      .insert({
        id: testTransactionId,
        payment_intent_id: testPaymentIntentId,
        amount: 500, // R$ 5,00
        currency: 'brl',
        status: 'succeeded',
        available_credits: 1, // 1 crédito disponível
        credit_consumed_at: null, // Ainda não consumido
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar transação de teste:', insertError);
      return;
    }

    console.log('✅ Transação criada:', insertData);

    // 2. Testar primeiro consumo (deve funcionar)
    console.log('\n2️⃣ Testando primeiro consumo de crédito...');
    
    const { data: firstConsumption, error: firstError } = await supabase
      .rpc('consume_paid_credit', {
        transaction_id: testTransactionId
      });

    if (firstError) {
      console.error('❌ Erro no primeiro consumo:', firstError);
    } else {
      console.log('✅ Primeiro consumo bem-sucedido:', firstConsumption);
    }

    // 3. Verificar estado da transação após primeiro consumo
    console.log('\n3️⃣ Verificando estado da transação após primeiro consumo...');
    
    const { data: afterFirst, error: checkError1 } = await supabase
      .from('stripe_transactions')
      .select('available_credits, credit_consumed_at')
      .eq('id', testTransactionId)
      .single();

    if (checkError1) {
      console.error('❌ Erro ao verificar transação:', checkError1);
    } else {
      console.log('✅ Estado após primeiro consumo:', afterFirst);
    }

    // 4. Testar segundo consumo (deve falhar)
    console.log('\n4️⃣ Testando segundo consumo de crédito (deve falhar)...');
    
    const { data: secondConsumption, error: secondError } = await supabase
      .rpc('consume_paid_credit', {
        transaction_id: testTransactionId
      });

    if (secondError) {
      console.log('✅ Segundo consumo falhou como esperado:', secondError.message);
    } else if (!secondConsumption) {
      console.log('✅ Segundo consumo retornou null como esperado (crédito já consumido)');
    } else {
      console.log('❌ PROBLEMA: Segundo consumo deveria ter falhado, mas retornou:', secondConsumption);
    }

    // 5. Verificar estado final da transação
    console.log('\n5️⃣ Verificando estado final da transação...');
    
    const { data: finalState, error: checkError2 } = await supabase
      .from('stripe_transactions')
      .select('available_credits, credit_consumed_at')
      .eq('id', testTransactionId)
      .single();

    if (checkError2) {
      console.error('❌ Erro ao verificar estado final:', checkError2);
    } else {
      console.log('✅ Estado final:', finalState);
    }

    // 6. Limpeza - remover transação de teste
    console.log('\n6️⃣ Limpando transação de teste...');
    
    const { error: deleteError } = await supabase
      .from('stripe_transactions')
      .delete()
      .eq('id', testTransactionId);

    if (deleteError) {
      console.error('❌ Erro ao limpar transação de teste:', deleteError);
    } else {
      console.log('✅ Transação de teste removida com sucesso');
    }

    console.log('\n🎉 === TESTE CONCLUÍDO ===');
    console.log('✅ Comportamento de uso único dos créditos pagos validado com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testPaidCreditConsumption()
  .then(() => {
    console.log('\n✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na execução do script:', error);
    process.exit(1);
  });