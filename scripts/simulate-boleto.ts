#!/usr/bin/env tsx
/**
 * Simulate boleto payment success in test mode using Stripe CLI triggers.
 * This does NOT tie to a specific PaymentIntent, but our webhook logic
 * resets the quota by metadata (userId/deviceId), which is enough to
 * validate the paywall flow end-to-end in development.
 *
 * Usage examples:
 *  - npm run stripe:listen  # in another terminal
 *  - npm run simulate:boleto -- --user 65e94b59-59ed-4288-bc8b-331c1812fadc
 *  - npm run simulate:boleto -- --device c1283ca7-2118-4fa5-8545-e936fe253922
 */

import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
let userId: string | null = null;
let deviceId: string | null = null;
let amount = '1490'; // cents (R$ 14,90)

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--user' && args[i + 1]) {
    userId = args[i + 1];
    i++;
  } else if (a === '--device' && args[i + 1]) {
    deviceId = args[i + 1];
    i++;
  } else if (a === '--amount' && args[i + 1]) {
    amount = String(Math.max(100, Number(args[i + 1]) || 1490)); // min R$1,00
    i++;
  }
}

if (!userId && !deviceId) {
  console.error('\nUsage: npm run simulate:boleto -- --user <uuid> | --device <id> [--amount 1490]');
  process.exit(1);
}

function hasStripeCLI(): boolean {
  try {
    execSync('stripe --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

if (!hasStripeCLI()) {
  console.error('❌ Stripe CLI não encontrado. Instale: https://stripe.com/docs/stripe-cli');
  process.exit(1);
}

const metaUser = userId ? `--add payment_intent:metadata[userId]=${userId}` : '';
const metaDevice = deviceId ? `--add payment_intent:metadata[deviceId]=${deviceId}` : '';
const common = `--add payment_intent:amount=${amount} --add payment_intent:currency=brl ${metaUser} ${metaDevice}`.trim();

try {
  console.log('🧪 Disparando webhook: payment_intent.processing');
  execSync(`stripe trigger payment_intent.processing ${common}`, { stdio: 'inherit' });

  console.log('⏳ Aguardando 1s...');
  execSync('sleep 1');

  console.log('🧪 Disparando webhook: payment_intent.succeeded');
  execSync(`stripe trigger payment_intent.succeeded ${common}`, { stdio: 'inherit' });

  console.log('\n🎉 Simulação enviada. Verifique o terminal do stripe listen.');
  console.log('💡 Agora chame GET /api/user/creation-status para validar a liberação.');
  process.exit(0);
} catch (err) {
  console.error('💥 Falha ao disparar simulação:', err);
  process.exit(1);
}

