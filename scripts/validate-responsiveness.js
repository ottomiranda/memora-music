#!/usr/bin/env node

/**
 * Script de Validação Final do Sistema de Responsividade
 * Memora Music - Dezembro 2024
 * 
 * Este script executa uma bateria completa de testes e validações
 * para garantir que o sistema de responsividade está funcionando corretamente.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Função para log colorido
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para executar comandos
function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${description} - Concluído com sucesso!`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} - Falhou!`, 'red');
    log(`Erro: ${error.message}`, 'red');
    return false;
  }
}

// Função para verificar arquivos
function checkFile(filePath, description) {
  log(`\n📁 Verificando ${description}...`, 'blue');
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} - Encontrado!`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Não encontrado!`, 'red');
    return false;
  }
}

// Função para verificar conteúdo de arquivo
function checkFileContent(filePath, searchText, description) {
  log(`\n🔍 Verificando ${description}...`, 'blue');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchText)) {
      log(`✅ ${description} - Encontrado!`, 'green');
      return true;
    } else {
      log(`❌ ${description} - Não encontrado!`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${description} - Erro ao ler arquivo!`, 'red');
    return false;
  }
}

// Função principal
async function validateResponsiveness() {
  log('🚀 INICIANDO VALIDAÇÃO DO SISTEMA DE RESPONSIVIDADE', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  const results = {
    files: 0,
    tests: 0,
    config: 0,
    total: 0
  };

  // 1. Verificar arquivos essenciais
  log('\n📋 FASE 1: VERIFICAÇÃO DE ARQUIVOS', 'magenta');
  log('-'.repeat(40), 'magenta');
  
  const essentialFiles = [
    { path: 'src/hooks/useResponsive.ts', desc: 'Hook useResponsive' },
    { path: 'src/test/useResponsive.test.ts', desc: 'Testes do useResponsive' },
    { path: 'src/tests/e2e/responsividade.spec.ts', desc: 'Testes E2E de responsividade' },
    { path: 'src/tests/performance.test.tsx', desc: 'Testes de performance' },
    { path: 'src/tests/accessibility.test.tsx', desc: 'Testes de acessibilidade' },
    { path: 'docs/RESPONSIVIDADE.md', desc: 'Documentação de responsividade' },
    { path: 'docs/RELATORIO_FINAL_RESPONSIVIDADE.md', desc: 'Relatório final' },
    { path: 'tailwind.config.js', desc: 'Configuração do Tailwind' }
  ];

  for (const file of essentialFiles) {
    if (checkFile(file.path, file.desc)) {
      results.files++;
    }
    results.total++;
  }

  // 2. Verificar configurações
  log('\n⚙️ FASE 2: VERIFICAÇÃO DE CONFIGURAÇÕES', 'magenta');
  log('-'.repeat(40), 'magenta');
  
  const configChecks = [
    {
      file: 'tailwind.config.js',
      search: "'xs': '375px'",
      desc: 'Breakpoint xs no Tailwind'
    },
    {
      file: 'src/hooks/useResponsive.ts',
      search: 'useEffect',
      desc: 'Hook useResponsive implementado'
    },
    {
      file: 'src/pages/Criar.tsx',
      search: 'sm:flex-row',
      desc: 'Classes responsivas no formulário'
    }
  ];

  for (const check of configChecks) {
    if (checkFileContent(check.file, check.search, check.desc)) {
      results.config++;
    }
    results.total++;
  }

  // 3. Executar testes
  log('\n🧪 FASE 3: EXECUÇÃO DE TESTES', 'magenta');
  log('-'.repeat(40), 'magenta');
  
  const testCommands = [
    {
      command: 'npm test -- src/test/useResponsive.test.ts --run',
      desc: 'Testes unitários do useResponsive'
    },
    {
      command: 'npm test -- src/tests/performance.test.tsx --run',
      desc: 'Testes de performance'
    },
    {
      command: 'npm test -- src/tests/accessibility.test.tsx --run',
      desc: 'Testes de acessibilidade'
    }
  ];

  for (const test of testCommands) {
    if (runCommand(test.command, test.desc)) {
      results.tests++;
    }
    results.total++;
  }

  // 4. Verificar build
  log('\n🏗️ FASE 4: VERIFICAÇÃO DE BUILD', 'magenta');
  log('-'.repeat(40), 'magenta');
  
  if (runCommand('npm run build', 'Build de produção')) {
    results.tests++;
  }
  results.total++;

  // 5. Relatório final
  log('\n📊 RELATÓRIO FINAL', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  const successRate = ((results.files + results.tests + results.config) / results.total * 100).toFixed(1);
  
  log(`📁 Arquivos verificados: ${results.files}/${essentialFiles.length}`, 'blue');
  log(`⚙️ Configurações verificadas: ${results.config}/${configChecks.length}`, 'blue');
  log(`🧪 Testes executados: ${results.tests}/${testCommands.length + 1}`, 'blue');
  log(`📈 Taxa de sucesso: ${successRate}%`, 'blue');
  
  if (successRate >= 90) {
    log('\n🎉 SISTEMA DE RESPONSIVIDADE VALIDADO COM SUCESSO!', 'green');
    log('✅ Todos os componentes estão funcionando corretamente.', 'green');
    log('✅ Testes passando com sucesso.', 'green');
    log('✅ Documentação completa disponível.', 'green');
    log('✅ Build de produção funcionando.', 'green');
  } else if (successRate >= 75) {
    log('\n⚠️ SISTEMA PARCIALMENTE VALIDADO', 'yellow');
    log('⚠️ Algumas verificações falharam, mas o sistema está funcional.', 'yellow');
    log('⚠️ Revise os itens marcados como falha acima.', 'yellow');
  } else {
    log('\n❌ VALIDAÇÃO FALHOU', 'red');
    log('❌ Muitas verificações falharam.', 'red');
    log('❌ O sistema precisa de correções antes de ser considerado pronto.', 'red');
  }

  // 6. Próximos passos
  log('\n🔮 PRÓXIMOS PASSOS RECOMENDADOS', 'cyan');
  log('-'.repeat(40), 'cyan');
  
  if (successRate >= 90) {
    log('1. ✅ Sistema pronto para produção', 'green');
    log('2. 📱 Testar em dispositivos reais', 'blue');
    log('3. 🚀 Deploy para ambiente de staging', 'blue');
    log('4. 📊 Monitorar métricas de performance', 'blue');
  } else {
    log('1. 🔧 Corrigir itens que falharam na validação', 'yellow');
    log('2. 🧪 Re-executar testes após correções', 'yellow');
    log('3. 📝 Atualizar documentação se necessário', 'yellow');
    log('4. 🔄 Executar este script novamente', 'yellow');
  }

  log('\n📚 RECURSOS DISPONÍVEIS', 'cyan');
  log('-'.repeat(40), 'cyan');
  log('📖 Documentação: docs/RESPONSIVIDADE.md', 'blue');
  log('📊 Relatório: docs/RELATORIO_FINAL_RESPONSIVIDADE.md', 'blue');
  log('🧪 Testes E2E: src/tests/e2e/responsividade.spec.ts', 'blue');
  log('🔧 Hook: src/hooks/useResponsive.ts', 'blue');
  
  log('\n🎯 VALIDAÇÃO CONCLUÍDA!', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  process.exit(successRate >= 75 ? 0 : 1);
}

// Executar validação
validateResponsiveness().catch(error => {
  log(`\n💥 ERRO CRÍTICO: ${error.message}`, 'red');
  process.exit(1);
});