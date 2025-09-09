import React, { ReactNode, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { API_BASE_URL } from '@/config/api';

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  const [publishableKey, setPublishableKey] = useState<string | null>(envKey && envKey.startsWith('pk_') ? envKey : null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(
    publishableKey ? loadStripe(publishableKey) : null
  );

  useEffect(() => {
    if (publishableKey || stripePromise) return; // já carregado
    const fetchKey = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/stripe/public-key`);
        if (!resp.ok) return;
        const data = await resp.json();
        const key = data?.publishableKey;
        if (typeof key === 'string' && key.startsWith('pk_')) {
          setPublishableKey(key);
          setStripePromise(loadStripe(key));
        }
      } catch (e) {
        // Evita quebrar o app se o endpoint não estiver disponível
        console.warn('[StripeProvider] Não foi possível obter a publishable key do backend');
      }
    };
    void fetchKey();
  }, [publishableKey, stripePromise]);

  // Se não temos Stripe configurado, renderiza a app sem Elements.
  if (!stripePromise) {
    return <>{children}</>;
  }

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
