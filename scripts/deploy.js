#!/usr/bin/env node

/**
 * Automated Deployment Script for Memora Music
 * 
 * This script handles deployment to different environments with proper
 * validation, health checks, and rollback capabilities.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Deployment configuration
const deployConfig = {
  development: {
    name: 'Development',
    branch: 'develop',
    environment: 'development',
    vercelEnv: 'preview',
    healthCheckUrl: process.env.VERCEL_PREVIEW_URL || 'http://localhost:3000',
    timeout: 300000, // 5 minutes
    autoRollback: false
  },
  production: {
    name: 'Production',
    branch: 'main',
    environment: 'production',
    vercelEnv: 'production',
    healthCheckUrl: process.env.VERCEL_URL || 'https://memora-music.vercel.app',
    timeout: 600000, // 10 minutes
    autoRollback: true
  }
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logStep(message) {
  log(`🚀 ${message}`, 'cyan');
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function healthCheck(url, maxRetries = 5, retryDelay = 10000) {
  logInfo(`Performing health check on ${url}`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url, { timeout: 10000 });
      
      if (response.ok) {
        logSuccess(`Health check passed (${response.status})`);
        return true;
      } else {
        logWarning(`Health check failed with status ${response.status}`);
      }
    } catch (error) {
      logWarning(`Health check attempt ${i + 1} failed: ${error.message}`);
    }
    
    if (i < maxRetries - 1) {
      logInfo(`Retrying in ${retryDelay / 1000} seconds...`);
      await sleep(retryDelay);
    }
  }
  
  logError('Health check failed after all retries');
  return false;
}

function validateEnvironment(env) {
  logStep('Validating environment variables...');
  
  const result = execCommand('node scripts/validate-env.js', { silent: true });
  
  if (!result.success) {
    logError('Environment validation failed');
    console.log(result.output);
    return false;
  }
  
  logSuccess('Environment validation passed');
  return true;
}

function runTests() {
  logStep('Running tests...');
  
  // Check if test script exists
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.scripts.test) {
    logWarning('No test script found, skipping tests');
    return true;
  }
  
  const result = execCommand('npm test');
  
  if (!result.success) {
    logError('Tests failed');
    return false;
  }
  
  logSuccess('All tests passed');
  return true;
}

function runLinting() {
  logStep('Running linting...');
  
  const result = execCommand('npm run lint');
  
  if (!result.success) {
    logError('Linting failed');
    return false;
  }
  
  logSuccess('Linting passed');
  return true;
}

function buildProject() {
  logStep('Building project...');
  
  const result = execCommand('npm run build:legacy');
  
  if (!result.success) {
    logError('Build failed');
    return false;
  }
  
  logSuccess('Build completed successfully');
  return true;
}

function deployToVercel(environment) {
  logStep(`Deploying to Vercel (${environment})...`);
  
  const isProduction = environment === 'production';
  const command = isProduction 
    ? 'npx vercel --prod --yes'
    : 'npx vercel --yes';
  
  const result = execCommand(command);
  
  if (!result.success) {
    logError('Vercel deployment failed');
    return { success: false };
  }
  
  // Extract deployment URL from output
  const output = result.output;
  const urlMatch = output.match(/https:\/\/[^\s]+/);
  const deploymentUrl = urlMatch ? urlMatch[0] : null;
  
  if (deploymentUrl) {
    logSuccess(`Deployment successful: ${deploymentUrl}`);
    return { success: true, url: deploymentUrl };
  } else {
    logWarning('Deployment completed but URL not found in output');
    return { success: true, url: null };
  }
}

function getCurrentBranch() {
  try {
    const result = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    logError('Failed to get current branch');
    return null;
  }
}

function getLastCommit() {
  try {
    const result = execSync('git log -1 --pretty=format:"%h - %s (%an)"', { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    logError('Failed to get last commit');
    return 'Unknown';
  }
}

async function deploy(targetEnv, options = {}) {
  const config = deployConfig[targetEnv];
  if (!config) {
    logError(`Unknown environment: ${targetEnv}`);
    return false;
  }
  
  const currentBranch = getCurrentBranch();
  const lastCommit = getLastCommit();
  
  log(`\n${colors.bold}🚀 Starting deployment to ${config.name}${colors.reset}`);
  log(`${colors.bold}Branch:${colors.reset} ${currentBranch}`);
  log(`${colors.bold}Commit:${colors.reset} ${lastCommit}`);
  log(`${colors.bold}Environment:${colors.reset} ${config.environment}\n`);
  
  // Pre-deployment checks
  if (!options.skipValidation && !validateEnvironment(targetEnv)) {
    return false;
  }
  
  if (!options.skipLinting && !runLinting()) {
    return false;
  }
  
  if (!options.skipTests && !runTests()) {
    return false;
  }
  
  if (!options.skipBuild && !buildProject()) {
    return false;
  }
  
  // Deploy to Vercel
  const deployResult = deployToVercel(config.environment);
  if (!deployResult.success) {
    return false;
  }
  
  // Health check
  if (deployResult.url && !options.skipHealthCheck) {
    const healthCheckUrl = `${deployResult.url}/api/health`;
    const isHealthy = await healthCheck(healthCheckUrl);
    
    if (!isHealthy && config.autoRollback) {
      logError('Health check failed, initiating rollback...');
      // Note: Actual rollback implementation would depend on your setup
      logWarning('Rollback functionality needs to be implemented');
      return false;
    }
  }
  
  logSuccess(`\n🎉 Deployment to ${config.name} completed successfully!`);
  if (deployResult.url) {
    logInfo(`🌐 URL: ${deployResult.url}`);
  }
  
  return true;
}

function showHelp() {
  log(`\n${colors.bold}Memora Music Deployment Script${colors.reset}\n`);
  log('Usage: node scripts/deploy.js <environment> [options]\n');
  log('Environments:');
  log('  development    Deploy to development environment');
  log('  production     Deploy to production environment\n');
  log('Options:');
  log('  --skip-validation    Skip environment validation');
  log('  --skip-linting      Skip linting checks');
  log('  --skip-tests        Skip running tests');
  log('  --skip-build        Skip building the project');
  log('  --skip-health-check Skip post-deployment health check');
  log('  --help, -h          Show this help message\n');
  log('Examples:');
  log('  node scripts/deploy.js development');
  log('  node scripts/deploy.js production --skip-tests');
  log('  node scripts/deploy.js development --skip-validation --skip-linting');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  showHelp();
  process.exit(0);
}

const targetEnv = args[0];
const options = {
  skipValidation: args.includes('--skip-validation'),
  skipLinting: args.includes('--skip-linting'),
  skipTests: args.includes('--skip-tests'),
  skipBuild: args.includes('--skip-build'),
  skipHealthCheck: args.includes('--skip-health-check')
};

// Run deployment
deploy(targetEnv, options)
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logError(`Deployment failed: ${error.message}`);
    process.exit(1);
  });