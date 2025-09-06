import React, { ReactNode } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Carregar Stripe com a chave pública
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Debug logs para verificar configuração
console.log('[STRIPE_PROVIDER] Chave pública:', publishableKey ? `${publishableKey.substring(0, 12)}...` : 'NÃO CONFIGURADA');
console.log('[STRIPE_PROVIDER] Ambiente:', import.meta.env.MODE);
console.log('[STRIPE_PROVIDER] Chave completa para debug:', publishableKey);

const stripePromise = loadStripe(publishableKey);

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Verificar se a chave pública está configurada
  if (!publishableKey) {
    console.warn('[STRIPE_PROVIDER] Chave pública do Stripe não configurada. Funcionalidades de pagamento podem não funcionar.');
  } else {
    console.log('[STRIPE_PROVIDER] Stripe inicializado com sucesso');
  }

  // Verificar se o Stripe foi carregado corretamente
  stripePromise.then((stripe) => {
    if (stripe) {
      console.log('[STRIPE_PROVIDER] Stripe.js carregado com sucesso');
      console.log('[STRIPE_PROVIDER] Chave pública completa:', publishableKey);
      console.log('[STRIPE_PROVIDER] Tipo da chave:', typeof publishableKey);
      console.log('[STRIPE_PROVIDER] Comprimento da chave:', publishableKey?.length);
      console.log('[STRIPE_PROVIDER] Inicia com pk_:', publishableKey?.startsWith('pk_'));
      console.log('[STRIPE_PROVIDER] Instância do Stripe:', stripe);
    } else {
      console.error('[STRIPE_PROVIDER] Falha ao carregar Stripe.js');
    }
  }).catch((error) => {
    console.error('[STRIPE_PROVIDER] Erro ao carregar Stripe.js:', error);
    console.error('[STRIPE_PROVIDER] Detalhes do erro:', error.message);
  });

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#6366f1',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
        locale: 'pt-BR',
      }}
    >
      {children}
    </Elements>
  );
};

export default StripeProvider;