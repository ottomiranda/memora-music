import express from 'express';
import cors from 'cors';
import request from 'supertest';
import Stripe from 'stripe';
import stripeRoutes from '../api/routes/stripe.js';

async function main() {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) {
    console.error('STRIPE_SECRET_KEY ausente ou inválida no ambiente.');
    process.exit(1);
  }

  // Monta um app mínimo apenas com as rotas do Stripe
  const app = express();
  app.use(cors());
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use('/api/stripe', stripeRoutes);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  console.log('🧪 Criando PaymentIntent via API interna...');
  const res = await request(app)
    .post('/api/stripe/create-payment-intent')
    .send({
      amount: 1490,
      currency: 'brl',
      metadata: {
        description: 'Teste E2E Payment Element BR',
        productType: 'music_generation',
      },
    })
    .set('Content-Type', 'application/json');

  console.log('📡 Status:', res.status);
  if (res.status !== 200) {
    console.error('❌ Falha ao criar PaymentIntent:', res.body || res.text);
    process.exit(1);
  }

  const { paymentIntentId, clientSecret } = res.body;
  console.log('✅ PaymentIntent criado:', paymentIntentId);
  console.log('🔑 ClientSecret:', typeof clientSecret === 'string' ? clientSecret.slice(0, 12) + '...' : 'N/A');

  console.log('🔍 Verificando configuração no Stripe...');
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  const pmTypes = pi.payment_method_types || [];
  console.log('💳 payment_method_types:', pmTypes);
  console.log('💱 currency:', pi.currency);
  console.log('📌 status:', pi.status);

  const hasPix = pmTypes.includes('pix');
  const hasBoleto = pmTypes.includes('boleto');
  const hasCard = pmTypes.includes('card');

  if (pi.currency !== 'brl' || !hasPix || !hasBoleto || !hasCard) {
    console.error('❌ Configuração inesperada no PaymentIntent. Esperado BRL com pix, boleto e card.');
    process.exit(2);
  }

  console.log('🎉 OK! PaymentIntent BR configurado com PIX/BOLETO/CARD.');
  process.exit(0);
}

main().catch((err) => {
  console.error('💥 Erro no teste E2E:', err);
  process.exit(1);
});

