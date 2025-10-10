#!/usr/bin/env node

/**
 * Teste de Bloqueio de Paywall via IP da Rede Local - ATUALIZADO
 * 
 * Este script testa se a lógica de paywall está funcionando corretamente
 * quando acessada via IP da rede local (192.168.0.105:5173).
 * 
 * Cenários testados:
 * 1. Usuário anônimo - primeira música (deve passar)
 * 2. Usuário anônimo - segunda música (deve ser bloqueada)
 * 3. Novo usuário anônimo com device ID diferente (deve passar)
 * 4. Verificação de fallback por IP
 * 5. Verificação de last_used_ip no banco de dados
 * 6. Análise de possíveis brechas de segurança
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuração
const NETWORK_IP = '192.168.0.105';
const FRONTEND_PORT = '5173';
const BACKEND_PORT = '3337';

const FRONTEND_URL = `http://${NETWORK_IP}:${FRONTEND_PORT}`;
const BACKEND_URL = `http://${NETWORK_IP}:${BACKEND_PORT}`;

// Configuração do Supabase (para verificação direta no banco)
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('✅ Supabase configurado com sucesso');
} else {
  console.log('❌ Supabase não configurado:', { 
    hasUrl: !!SUPABASE_URL, 
    hasKey: !!SUPABASE_SERVICE_KEY 
  });
}

// Utilitários
const generateDeviceId = () => `device_${crypto.randomUUID()}`;
const generateGuestId = () => `guest_${crypto.randomUUID()}`;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.cyan}🔍 ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.magenta}📋 ${msg}${colors.reset}`)
};

// Função para verificar se os servidores estão rodando
async function checkServers() {
  log.header('Verificando se os servidores estão rodando...');
  
  try {
    // Verificar frontend
    const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
    if (frontendResponse.status === 200) {
      log.success(`Frontend rodando em ${FRONTEND_URL}`);
    }
  } catch (error) {
    log.error(`Frontend não está acessível em ${FRONTEND_URL}`);
    log.error(`Erro: ${error.message}`);
    return false;
  }

  try {
    // Verificar backend
    const backendResponse = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 });
    if (backendResponse.status === 200) {
      log.success(`Backend rodando em ${BACKEND_URL}`);
    }
  } catch (error) {
    log.error(`Backend não está acessível em ${BACKEND_URL}/api/health`);
    log.error(`Erro: ${error.message}`);
    return false;
  }

  return true;
}

// Função para verificar status de criação
async function checkCreationStatus(deviceId, guestId, userId = null) {
  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': deviceId,
    'x-guest-id': guestId
  };

  if (userId) {
    headers['Authorization'] = `Bearer ${userId}`;
  }

  try {
    const response = await axios.get(`${BACKEND_URL}/api/user/creation-status`, {
      headers,
      timeout: 10000
    });

    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0
    };
  }
}

// Função para simular criação de música
async function simulateCreateMusic(deviceId, guestId, userId = null) {
  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': deviceId,
    'x-guest-id': guestId
  };

  if (userId) {
    headers['Authorization'] = `Bearer ${userId}`;
  }

  // Payload base para testes - incluindo todos os campos obrigatórios
  const basePayload = {
    occasion: 'aniversario',
    recipientName: 'João',
    relationship: 'amigo',
    senderName: 'Maria',
    hobbies: 'Gosta de futebol e música',
    qualities: 'Pessoa alegre e carinhosa',
    uniqueTraits: 'Tem um sorriso contagiante',
    memories: 'Lembro quando jogamos futebol juntos no parque',
    lyricsOnly: true,
    // Campos adicionais que podem ser necessários
    songTitle: 'Música para João',
    emotionalTone: 'alegre',
    genre: 'pop',
    mood: 'feliz',
    tempo: 'medio',
    duration: '3:00',
    emotion: 'alegria',
    vocalPreference: 'masculina'
  };

  const payload = {
      ...basePayload,
      lyrics: 'Esta é uma música de teste para verificar o sistema de paywall.',
      userId: userId,
      deviceId: deviceId,
      guestId: guestId
    };

  try {
    const response = await axios.post(`${BACKEND_URL}/api/generate-preview`, payload, {
      headers,
      timeout: 30000
    });

    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0
    };
  }
}

// Função para verificar registros no banco de dados
async function checkDatabaseRecords(deviceId, guestId) {
  if (!supabase) {
    log.warning('Supabase não configurado - pulando verificação do banco');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_creations')
      .select('*')
      .or(`device_id.eq.${deviceId},device_id.eq.${guestId}`)
      .order('created_at', { ascending: false });

    if (error) {
      log.error(`Erro ao consultar banco: ${error.message}`);
      return null;
    }

    return data;
  } catch (error) {
    log.error(`Erro na consulta ao banco: ${error.message}`);
    return null;
  }
}

// Teste principal
async function runPaywallTest() {
  log.header('🚀 INICIANDO TESTE DE PAYWALL VIA IP DA REDE LOCAL');
  log.info(`Frontend: ${FRONTEND_URL}`);
  log.info(`Backend: ${BACKEND_URL}`);
  log.info(`IP da Rede: ${NETWORK_IP}`);
  
  // Verificar se os servidores estão rodando
  const serversRunning = await checkServers();
  if (!serversRunning) {
    log.error('Servidores não estão rodando. Execute "npm run dev" primeiro.');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));

  // CENÁRIO 1: Usuário Anônimo - Primeira Música
  log.step('CENÁRIO 1: Usuário Anônimo - Primeira Música (deve passar)');
  
  const anonDeviceId = generateDeviceId();
  const anonGuestId = generateGuestId();
  
  log.info(`Device ID: ${anonDeviceId}`);
  log.info(`Guest ID: ${anonGuestId}`);

  // Verificar status inicial
  const initialStatus = await checkCreationStatus(anonDeviceId, anonGuestId);
  if (initialStatus.success) {
    log.info(`Status inicial: ${JSON.stringify(initialStatus.data, null, 2)}`);
    
    if (initialStatus.data.isFree) {
      log.success('Status inicial correto: primeira música é gratuita');
    } else {
      log.error('Status inicial incorreto: primeira música deveria ser gratuita');
    }
  } else {
    log.error(`Erro ao verificar status inicial: ${JSON.stringify(initialStatus.error, null, 2)}`);
  }

  // Simular criação da primeira música
  log.info('Simulando criação da primeira música...');
  const firstMusic = await simulateCreateMusic(anonDeviceId, anonGuestId);
  
  if (firstMusic.success) {
    log.success('Primeira música criada com sucesso');
    log.info(`Resposta: ${JSON.stringify(firstMusic.data, null, 2)}`);
  } else {
    log.error(`Erro na primeira música: ${JSON.stringify(firstMusic.error, null, 2)}`);
  }

  // Verificar registros no banco após primeira música
  const dbRecordsAfterFirst = await checkDatabaseRecords(anonDeviceId, anonGuestId);
  if (dbRecordsAfterFirst) {
    log.info(`Registros no banco após primeira música: ${dbRecordsAfterFirst.length} registros`);
    dbRecordsAfterFirst.forEach((record, index) => {
      log.info(`Registro ${index + 1}: freesongsused=${record.freesongsused}, last_used_ip=${record.last_used_ip}, device_id=${record.device_id}`);
    });
  }

  console.log('\n' + '-'.repeat(80));

  // CENÁRIO 2: Usuário Anônimo - Segunda Música
  log.step('CENÁRIO 2: Usuário Anônimo - Segunda Música (deve ser bloqueada)');

  // Verificar status após primeira música
  const statusAfterFirst = await checkCreationStatus(anonDeviceId, anonGuestId);
  if (statusAfterFirst.success) {
    log.info(`Status após primeira música: ${JSON.stringify(statusAfterFirst.data, null, 2)}`);
    
    if (!statusAfterFirst.data.isFree) {
      log.success('Status correto: segunda música deve ser paga');
    } else {
      log.error('Status incorreto: segunda música deveria ser paga');
    }
  } else {
    log.error(`Erro ao verificar status após primeira música: ${JSON.stringify(statusAfterFirst.error, null, 2)}`);
  }

  // Tentar criar segunda música
  log.info('Tentando criar segunda música...');
  const secondMusic = await simulateCreateMusic(anonDeviceId, anonGuestId);
  
  if (secondMusic.success) {
    log.error('PROBLEMA: Segunda música foi criada quando deveria ser bloqueada!');
    log.info(`Resposta: ${JSON.stringify(secondMusic.data, null, 2)}`);
  } else {
    if (secondMusic.status === 402 || (secondMusic.error && secondMusic.error.message && secondMusic.error.message.includes('paga'))) {
      log.success('Bloqueio funcionando: segunda música foi corretamente bloqueada');
    } else {
      log.warning(`Segunda música bloqueada, mas com erro inesperado: ${JSON.stringify(secondMusic.error, null, 2)}`);
    }
  }

  console.log('\n' + '-'.repeat(80));

  // CENÁRIO 3: Novo Usuário Anônimo (Device ID diferente)
  log.step('CENÁRIO 3: Novo Usuário Anônimo com Device ID diferente (deve passar)');
  
  const newAnonDeviceId = generateDeviceId();
  const newAnonGuestId = generateGuestId();
  
  log.info(`Novo Device ID: ${newAnonDeviceId}`);
  log.info(`Novo Guest ID: ${newAnonGuestId}`);

  const newUserStatus = await checkCreationStatus(newAnonDeviceId, newAnonGuestId);
  if (newUserStatus.success) {
    log.info(`Status do novo usuário: ${JSON.stringify(newUserStatus.data, null, 2)}`);
    
    if (newUserStatus.data.isFree) {
      log.success('Novo usuário pode criar primeira música gratuitamente');
    } else {
      log.error('Novo usuário deveria poder criar primeira música gratuitamente');
    }
  } else {
    log.error(`Erro ao verificar status do novo usuário: ${JSON.stringify(newUserStatus.error, null, 2)}`);
  }

  console.log('\n' + '-'.repeat(80));

  // CENÁRIO 4: Verificação de IP Fallback
  log.step('CENÁRIO 4: Verificação de Fallback por IP');
  
  // Tentar com device IDs vazios para forçar fallback por IP
  const ipFallbackStatus = await checkCreationStatus('', '');
  if (ipFallbackStatus.success) {
    log.info(`Status com fallback por IP: ${JSON.stringify(ipFallbackStatus.data, null, 2)}`);
    
    if (ipFallbackStatus.data.userType && ipFallbackStatus.data.userType.includes('ip')) {
      log.success('Fallback por IP está funcionando');
    } else {
      log.warning('Fallback por IP pode não estar sendo usado');
    }
  } else {
    log.error(`Erro no teste de fallback por IP: ${JSON.stringify(ipFallbackStatus.error, null, 2)}`);
  }

  console.log('\n' + '='.repeat(80));

  // RESUMO FINAL
  log.header('📊 RESUMO DOS TESTES');
  
  const dbRecordsFinal = await checkDatabaseRecords(anonDeviceId, anonGuestId);
  if (dbRecordsFinal && dbRecordsFinal.length > 0) {
    log.info('Registros finais no banco de dados:');
    dbRecordsFinal.forEach((record, index) => {
      log.info(`  ${index + 1}. Device: ${record.device_id}`);
      log.info(`     Free Songs Used: ${record.freesongsused}`);
      log.info(`     Last Used IP: ${record.last_used_ip}`);
      log.info(`     User ID: ${record.user_id || 'null (anônimo)'}`);
      log.info(`     Created At: ${record.created_at}`);
    });

    // Verificar se o IP está sendo registrado corretamente
    const recordsWithIP = dbRecordsFinal.filter(record => record.last_used_ip === NETWORK_IP);
    if (recordsWithIP.length > 0) {
      log.success(`IP da rede (${NETWORK_IP}) está sendo registrado corretamente`);
    } else {
      log.warning(`IP da rede (${NETWORK_IP}) não foi encontrado nos registros`);
      log.info('IPs encontrados nos registros:');
      dbRecordsFinal.forEach(record => {
        if (record.last_used_ip) {
          log.info(`  - ${record.last_used_ip}`);
        }
      });
    }
  } else {
    log.warning('Nenhum registro encontrado no banco de dados');
  }

  console.log('\n' + '='.repeat(80));
  log.header('🎯 CONCLUSÕES');
  
  log.info('1. Verifique se o bloqueio da segunda música está funcionando');
  log.info('2. Confirme se o last_used_ip está sendo registrado com o IP da rede');
  log.info('3. Teste se usuários maliciosos podem burlar o sistema');
  log.info(`4. IP testado: ${NETWORK_IP}`);
  
  console.log('\n');
}

// Executar o teste
if (import.meta.url === `file://${process.argv[1]}`) {
  runPaywallTest().catch(error => {
    log.error(`Erro durante execução do teste: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

export { runPaywallTest };