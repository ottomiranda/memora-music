#!/usr/bin/env node

/**
 * Script de validação da configuração do Render.com
 * Verifica se todos os arquivos e configurações necessárias estão presentes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');

// Cores para output no terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    log(`✅ ${description}: ${filePath}`, 'green');
    return true;
  } else {
    log(`❌ ${description}: ${filePath} não encontrado`, 'red');
    return false;
  }
}

function validateRenderYaml() {
  const renderYamlPath = path.join(projectRoot, 'render.yaml');
  
  if (!fs.existsSync(renderYamlPath)) {
    log('❌ Arquivo render.yaml não encontrado', 'red');
    return false;
  }

  try {
    const yamlContent = fs.readFileSync(renderYamlPath, 'utf8');
    
    log('✅ Arquivo render.yaml encontrado', 'green');
    
    // Verificação básica de conteúdo (sem parser YAML)
    const hasBackendService = yamlContent.includes('memora-music-backend');
    const hasFrontendService = yamlContent.includes('memora-music-frontend');
    const hasEnvVars = yamlContent.includes('envVars');
    const hasBuildCommand = yamlContent.includes('buildCommand');
    const hasStartCommand = yamlContent.includes('startCommand');
    
    if (hasBackendService) {
      log('✅ Serviço backend configurado', 'green');
    } else {
      log('❌ Serviço backend não encontrado', 'red');
      return false;
    }
    
    if (hasFrontendService) {
      log('✅ Serviço frontend configurado', 'green');
    } else {
      log('❌ Serviço frontend não encontrado', 'red');
      return false;
    }
    
    if (hasEnvVars) {
      log('✅ Variáveis de ambiente configuradas', 'green');
    } else {
      log('⚠️  Variáveis de ambiente não encontradas', 'yellow');
    }
    
    if (hasBuildCommand && hasStartCommand) {
      log('✅ Comandos de build e start configurados', 'green');
    } else {
      log('⚠️  Comandos de build/start podem estar faltando', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Erro ao validar render.yaml: ${error.message}`, 'red');
    return false;
  }
}

function validatePackageJson() {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json não encontrado', 'red');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Verificar scripts necessários
    const requiredScripts = ['build', 'server:dev', 'preview'];
    const scripts = packageJson.scripts || {};
    
    for (const script of requiredScripts) {
      if (scripts[script]) {
        log(`✅ Script encontrado: ${script}`, 'green');
      } else {
        log(`❌ Script não encontrado: ${script}`, 'red');
      }
    }
    
    // Verificar dependências críticas
    const requiredDeps = ['express', 'react', 'vite', 'tsx'];
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of requiredDeps) {
      if (allDeps[dep]) {
        log(`✅ Dependência encontrada: ${dep}`, 'green');
      } else {
        log(`❌ Dependência não encontrada: ${dep}`, 'red');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Erro ao validar package.json: ${error.message}`, 'red');
    return false;
  }
}

function validateProjectStructure() {
  const requiredFiles = [
    { path: 'api/server.ts', desc: 'Servidor backend' },
    { path: 'src/main.tsx', desc: 'Entry point do React' },
    { path: 'index.html', desc: 'HTML principal' },
    { path: 'vite.config.ts', desc: 'Configuração do Vite' },
    { path: '.env.example', desc: 'Exemplo de variáveis de ambiente' }
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (!checkFileExists(file.path, file.desc)) {
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

function main() {
  log('🔍 Validando configuração do Render.com para Memora Music', 'bold');
  log('=' .repeat(60), 'blue');
  
  let allValid = true;
  
  log('\n📁 Verificando estrutura do projeto:', 'blue');
  if (!validateProjectStructure()) {
    allValid = false;
  }
  
  log('\n📦 Verificando package.json:', 'blue');
  if (!validatePackageJson()) {
    allValid = false;
  }
  
  log('\n⚙️  Verificando render.yaml:', 'blue');
  if (!validateRenderYaml()) {
    allValid = false;
  }
  
  log('\n' + '=' .repeat(60), 'blue');
  
  if (allValid) {
    log('🎉 Configuração válida! Pronto para deploy no Render.com', 'green');
    log('\n📋 Próximos passos:', 'blue');
    log('1. Commit e push das alterações para o repositório', 'yellow');
    log('2. Conectar repositório ao Render.com', 'yellow');
    log('3. Configurar variáveis de ambiente no dashboard', 'yellow');
    log('4. Iniciar deploy via Blueprint', 'yellow');
    process.exit(0);
  } else {
    log('❌ Configuração inválida! Corrija os erros antes do deploy', 'red');
    process.exit(1);
  }
}

// Executar se for o módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  validateRenderYaml,
  validatePackageJson,
  validateProjectStructure
};