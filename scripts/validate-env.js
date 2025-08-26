#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * 
 * This script validates that all required environment variables are set
 * and have valid values. It should be run before starting the application.
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Environment-specific required variables
const requiredVars = {
  development: [
    'NODE_ENV',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ],
  production: [
    'NODE_ENV',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_APP_URL'
  ]
};

// Optional variables with warnings
const optionalVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_ID',
  'GITHUB_SECRET',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SENTRY_DSN',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID'
];

// Variable validation rules
const validationRules = {
  'NODE_ENV': (value) => ['development', 'production', 'test'].includes(value),
  'NEXT_PUBLIC_SUPABASE_URL': (value) => value.startsWith('https://') && value.includes('supabase.co'),
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': (value) => value.length > 100,
  'SUPABASE_SERVICE_ROLE_KEY': (value) => value.length > 100,
  'NEXTAUTH_SECRET': (value) => value.length >= 32,
  'NEXTAUTH_URL': (value) => value.startsWith('http'),
  'NEXT_PUBLIC_APP_URL': (value) => value.startsWith('http')
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
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

function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredVars[env] || requiredVars.development;
  
  log(`\n${colors.bold}🔍 Validating environment variables for: ${env}${colors.reset}\n`);
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required variables
  log(`${colors.bold}Required Variables:${colors.reset}`);
  for (const varName of required) {
    const value = process.env[varName];
    
    if (!value) {
      logError(`${varName} is required but not set`);
      hasErrors = true;
    } else if (validationRules[varName] && !validationRules[varName](value)) {
      logError(`${varName} has invalid format or value`);
      hasErrors = true;
    } else {
      logSuccess(`${varName} is set and valid`);
    }
  }
  
  // Check optional variables
  log(`\n${colors.bold}Optional Variables:${colors.reset}`);
  for (const varName of optionalVars) {
    const value = process.env[varName];
    
    if (!value) {
      logWarning(`${varName} is not set (optional)`);
      hasWarnings = true;
    } else if (validationRules[varName] && !validationRules[varName](value)) {
      logWarning(`${varName} is set but has invalid format`);
      hasWarnings = true;
    } else {
      logSuccess(`${varName} is set and valid`);
    }
  }
  
  // Check for .env files
  log(`\n${colors.bold}Environment Files:${colors.reset}`);
  const envFiles = ['.env.local', '.env', '.env.development', '.env.production'];
  
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} exists`);
    } else {
      logInfo(`${file} not found`);
    }
  }
  
  // Summary
  log(`\n${colors.bold}Validation Summary:${colors.reset}`);
  
  if (hasErrors) {
    logError('Validation failed! Please fix the errors above.');
    process.exit(1);
  } else if (hasWarnings) {
    logWarning('Validation passed with warnings. Some optional features may not work.');
    logInfo('Consider setting the optional variables for full functionality.');
  } else {
    logSuccess('All environment variables are properly configured!');
  }
  
  // Environment-specific tips
  if (env === 'development') {
    log(`\n${colors.bold}Development Tips:${colors.reset}`);
    logInfo('Make sure you have a .env.local file with your development variables');
    logInfo('You can copy .env.example to .env.local and fill in your values');
  } else if (env === 'production') {
    log(`\n${colors.bold}Production Tips:${colors.reset}`);
    logInfo('Ensure all secrets are properly configured in your deployment platform');
    logInfo('Never commit production secrets to version control');
  }
}

function showHelp() {
  log(`\n${colors.bold}Environment Variables Validation Script${colors.reset}\n`);
  log('Usage: node scripts/validate-env.js [options]\n');
  log('Options:');
  log('  --help, -h    Show this help message');
  log('  --list, -l    List all required and optional variables');
  log('  --env <env>   Validate for specific environment (development|production)');
  log('\nExamples:');
  log('  node scripts/validate-env.js');
  log('  node scripts/validate-env.js --env production');
  log('  node scripts/validate-env.js --list');
}

function listVariables() {
  log(`\n${colors.bold}Environment Variables Reference${colors.reset}\n`);
  
  for (const [env, vars] of Object.entries(requiredVars)) {
    log(`${colors.bold}${env.toUpperCase()} - Required:${colors.reset}`);
    vars.forEach(varName => log(`  • ${varName}`));
    log('');
  }
  
  log(`${colors.bold}Optional (all environments):${colors.reset}`);
  optionalVars.forEach(varName => log(`  • ${varName}`));
  log('');
  
  log(`${colors.bold}For detailed descriptions, see .env.example${colors.reset}`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--list') || args.includes('-l')) {
  listVariables();
  process.exit(0);
}

const envIndex = args.indexOf('--env');
if (envIndex !== -1 && args[envIndex + 1]) {
  process.env.NODE_ENV = args[envIndex + 1];
}

// Run validation
try {
  validateEnvironment();
} catch (error) {
  logError(`Validation script failed: ${error.message}`);
  process.exit(1);
}