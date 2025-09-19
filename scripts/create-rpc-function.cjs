const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: './api/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createRPCFunction() {
  try {
    console.log('🔧 Criando função RPC increment_freesongsused...');
    
    // SQL para criar a função
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.increment_freesongsused(user_device_id TEXT)
      RETURNS JSON AS $$
      DECLARE
          updated_user RECORD;
      BEGIN
          -- Incrementa o contador freesongsused para o usuário com o device_id fornecido
          UPDATE public.user_creations 
          SET freesongsused = freesongsused + 1,
              updated_at = NOW()
          WHERE device_id = user_device_id
          RETURNING * INTO updated_user;
          
          -- Verifica se algum registro foi atualizado
          IF updated_user IS NULL THEN
              RETURN json_build_object(
                  'success', false,
                  'error', 'User not found with device_id: ' || user_device_id
              );
          END IF;
          
          -- Retorna sucesso com os dados atualizados
          RETURN json_build_object(
              'success', true,
              'data', row_to_json(updated_user)
          );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Executar usando uma query SQL direta
    const { data, error } = await supabase
      .from('user_creations')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro de conexão:', error.message);
      return;
    }
    
    console.log('✅ Conexão com Supabase estabelecida');
    
    // Tentar criar a função usando uma abordagem alternativa
    console.log('🔧 Executando SQL para criar função...');
    
    // Como não podemos executar DDL diretamente via cliente JS,
    // vamos testar se a função já existe
    const testResult = await supabase.rpc('increment_freesongsused', { 
      user_device_id: 'test-function-check' 
    });
    
    if (testResult.error && testResult.error.code === 'PGRST202') {
      console.log('❌ Função increment_freesongsused não existe');
      console.log('📋 SQL para executar manualmente no Supabase Dashboard:');
      console.log('=' .repeat(60));
      console.log(createFunctionSQL);
      console.log('=' .repeat(60));
      console.log('\n🔧 Instruções:');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá para SQL Editor');
      console.log('3. Cole o SQL acima e execute');
      console.log('4. Execute este script novamente para verificar');
    } else {
      console.log('✅ Função increment_freesongsused já existe e está funcionando!');
      console.log('Resultado do teste:', testResult);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createRPCFunction();