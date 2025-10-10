#!/usr/bin/env node
/**
 * Script para verificar se o last_used_ip está sendo registrado corretamente
 * no banco de dados Supabase após a criação de músicas
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkLastUsedIp() {
  console.log('🔍 VERIFICAÇÃO DO LAST_USED_IP NO BANCO DE DADOS');
  console.log('================================================================================');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Configuração do Supabase não encontrada');
    console.log('   Verifique as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Cliente Supabase configurado com sucesso');
  console.log('');

  try {
    // 1. Verificar registros recentes com last_used_ip
    console.log('📋 CONSULTA 1: Registros recentes com last_used_ip');
    console.log('--------------------------------------------------------------------------------');
    
    const { data: recentRecords, error: recentError } = await supabase
      .from('user_creations')
      .select('device_id, user_id, freesongsused, last_used_ip, created_at, updated_at')
      .not('last_used_ip', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.log('❌ Erro ao buscar registros recentes:', recentError.message);
    } else {
      console.log(`📊 Encontrados ${recentRecords.length} registros com last_used_ip`);
      recentRecords.forEach((record, index) => {
        console.log(`${index + 1}. Device: ${record.device_id}`);
        console.log(`   IP: ${record.last_used_ip}`);
        console.log(`   Músicas gratuitas: ${record.freesongsused}`);
        console.log(`   Atualizado: ${record.updated_at}`);
        console.log('');
      });
    }

    // 2. Verificar registros com IP específico da rede local
    console.log('📋 CONSULTA 2: Registros com IP da rede local (192.168.0.105)');
    console.log('--------------------------------------------------------------------------------');
    
    const { data: networkRecords, error: networkError } = await supabase
      .from('user_creations')
      .select('device_id, user_id, freesongsused, last_used_ip, created_at, updated_at')
      .eq('last_used_ip', '192.168.0.105')
      .order('updated_at', { ascending: false });

    if (networkError) {
      console.log('❌ Erro ao buscar registros por IP da rede:', networkError.message);
    } else {
      console.log(`📊 Encontrados ${networkRecords.length} registros com IP 192.168.0.105`);
      networkRecords.forEach((record, index) => {
        console.log(`${index + 1}. Device: ${record.device_id}`);
        console.log(`   Músicas gratuitas: ${record.freesongsused}`);
        console.log(`   Criado: ${record.created_at}`);
        console.log(`   Atualizado: ${record.updated_at}`);
        console.log('');
      });
    }

    // 3. Verificar registros com freesongsused > 0
    console.log('📋 CONSULTA 3: Registros com músicas gratuitas utilizadas');
    console.log('--------------------------------------------------------------------------------');
    
    const { data: usedRecords, error: usedError } = await supabase
      .from('user_creations')
      .select('device_id, user_id, freesongsused, last_used_ip, created_at, updated_at')
      .gt('freesongsused', 0)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (usedError) {
      console.log('❌ Erro ao buscar registros com músicas utilizadas:', usedError.message);
    } else {
      console.log(`📊 Encontrados ${usedRecords.length} registros com freesongsused > 0`);
      usedRecords.forEach((record, index) => {
        console.log(`${index + 1}. Device: ${record.device_id}`);
        console.log(`   IP: ${record.last_used_ip || 'NULL'}`);
        console.log(`   Músicas gratuitas: ${record.freesongsused}`);
        console.log(`   Atualizado: ${record.updated_at}`);
        console.log('');
      });
    }

    // 4. Estatísticas gerais
    console.log('📋 CONSULTA 4: Estatísticas gerais da tabela');
    console.log('--------------------------------------------------------------------------------');
    
    const { data: stats, error: statsError } = await supabase
      .from('user_creations')
      .select('device_id, last_used_ip, freesongsused');

    if (statsError) {
      console.log('❌ Erro ao buscar estatísticas:', statsError.message);
    } else {
      const totalRecords = stats.length;
      const recordsWithIp = stats.filter(r => r.last_used_ip).length;
      const recordsWithUsage = stats.filter(r => r.freesongsused > 0).length;
      const uniqueIps = new Set(stats.filter(r => r.last_used_ip).map(r => r.last_used_ip)).size;

      console.log(`📊 Total de registros: ${totalRecords}`);
      console.log(`📊 Registros com last_used_ip: ${recordsWithIp} (${((recordsWithIp/totalRecords)*100).toFixed(1)}%)`);
      console.log(`📊 Registros com freesongsused > 0: ${recordsWithUsage} (${((recordsWithUsage/totalRecords)*100).toFixed(1)}%)`);
      console.log(`📊 IPs únicos registrados: ${uniqueIps}`);
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }

  console.log('');
  console.log('================================================================================');
  console.log('🎯 CONCLUSÕES');
  console.log('================================================================================');
  console.log('1. Se há registros com last_used_ip = Sistema está funcionando ✅');
  console.log('2. Se há registros com IP 192.168.0.105 = Testes via rede local funcionaram ✅');
  console.log('3. Se há registros com freesongsused > 0 = Contador está sendo incrementado ✅');
  console.log('4. Se todos os valores são NULL = Problema na lógica de inserção ❌');
}

// Executar a verificação
checkLastUsedIp().catch(console.error);