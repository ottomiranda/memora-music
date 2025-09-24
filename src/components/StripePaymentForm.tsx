import React, { useMemo, useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';

interface StripePaymentFormProps {
  amount: number;
  clientSecret?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  clientSecret,
  onSuccess,
  onError,
  disabled = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.log('❌ Stripe não está pronto:', { stripe: !!stripe, elements: !!elements });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      console.log('🔄 Confirmando pagamento...');
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
      });

      if (error) {
        console.error('❌ Erro no pagamento:', error);
        setPaymentStatus('failed');
        // Mensagem mais amigável para CPF/CNPJ inválido no Boleto
        if ((error as any)?.code === 'tax_id_invalid') {
          setErrorMessage('CPF/CNPJ inválido. Confira o número informado. Para testes, utilize um CPF/CNPJ válido.');
        } else {
          setErrorMessage((error as any)?.message || 'Erro no pagamento');
        }
        onError(error.message || 'Erro no pagamento');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Pagamento confirmado:', paymentIntent);
        setPaymentStatus('succeeded');
        onSuccess(paymentIntent.id);
      } else if (paymentIntent && (paymentIntent.status === 'processing' || paymentIntent.status === 'requires_action')) {
        console.log('⏳ Pagamento em processamento/ação requerida:', paymentIntent.status);
        setPaymentStatus('processing');
        setErrorMessage('Pagamento em processamento. Para Boleto/PIX, aguarde a confirmação. Você será liberado após a confirmação automática.');
      } else {
        console.log('⚠️ Status do pagamento:', paymentIntent?.status);
        setPaymentStatus('failed');
        setErrorMessage('Pagamento não foi processado corretamente');
        onError('Pagamento não foi processado corretamente');
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      setPaymentStatus('failed');
      const message = error instanceof Error ? error.message : 'Erro inesperado';
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // PaymentElement não precisa de configurações complexas
  // Ele gerencia automaticamente os campos e layout

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const paymentElementOptions = useMemo(() => ({
    defaultValues: {
      billingDetails: {
        name: user?.name || undefined,
        email: user?.email || undefined,
        address: { country: 'BR' as const },
      },
    },
    fields: {
      billingDetails: {
        name: 'auto' as const,
        email: 'auto' as const,
        address: {
          // Permite que o Payment Element envie o país (usa defaultValues BR)
          country: 'auto' as const,
        },
      },
    },
  }), [user?.name, user?.email]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 -z-20 rounded-[36px] bg-gradient-to-br from-white/20 via-white/10 to-transparent blur-[60px] opacity-80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-1 -z-10 rounded-[28px] border border-white/25 bg-white/6 backdrop-blur-2xl"
        />
        <LiquidGlassCard
          variant="primary"
          size="md"
          className="relative z-10 space-y-4 border-white/25 p-4 sm:p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold sm:text-xl">Pagamento Seguro</h3>
            <div className="text-xl font-heading font-semibold sm:text-2xl">
              {formatCurrency(amount)}
            </div>
          </div>

          <LiquidGlassCard
            variant="secondary"
            size="md"
            className="relative z-10 space-y-4 border-white/20 bg-white/90 p-4 text-slate-900 overflow-hidden"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-3 -z-10 rounded-[28px] border border-white/40 bg-gradient-to-br from-white via-white/70 to-white/40 opacity-90 blur-[18px]"
            />
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CreditCard className="h-5 w-5 text-slate-500" />
              <span>Método de Pagamento</span>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
              <PaymentElement options={paymentElementOptions} />
            </div>
          </LiquidGlassCard>

          {errorMessage && (
            <LiquidGlassCard
              variant="secondary"
            size="md"
            className="flex items-start gap-3 border-red-200/60 bg-red-500/20 p-4 text-sm text-white shadow-none"
          >
            <AlertCircle className="h-5 w-5 text-red-100 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold">Erro no pagamento</h4>
              <p className="mt-1 text-sm text-red-50">{errorMessage}</p>
            </div>
            </LiquidGlassCard>
          )}

          {paymentStatus === 'succeeded' && (
            <LiquidGlassCard
              variant="secondary"
              size="md"
              className="flex items-start gap-3 border-emerald-200/60 bg-emerald-500/20 p-4 text-sm text-white shadow-none"
            >
              <CheckCircle className="h-5 w-5 text-emerald-100 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Pagamento realizado!</h4>
                <p className="mt-1 text-sm text-emerald-50">Seu upgrade foi processado com sucesso.</p>
              </div>
            </LiquidGlassCard>
          )}
        </LiquidGlassCard>
      </div>

      <div className="sticky bottom-0 left-0 right-0 pt-2 pb-3 sm:pb-4 [--s:env(safe-area-inset-bottom)] pb-[max(0px,var(--s))]">
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-2 -z-10 rounded-[24px] bg-gradient-to-br from-white/30 via-white/10 to-transparent blur-2xl opacity-80"
          />
          <LiquidGlassButton
            type="submit"
            disabled={!stripe || isProcessing || disabled || paymentStatus === 'succeeded'}
            className="w-full h-12 text-base font-semibold disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <span className="mr-2 flex h-4 w-4 items-center justify-center">
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                </span>
                Processando...
              </>
            ) : paymentStatus === 'succeeded' ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Pagamento Concluído
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pagar {formatCurrency(amount)}
              </>
            )}
          </LiquidGlassButton>
        </div>

        <div className="mt-2 text-center text-[11px] leading-4 text-white/80">
          <p>🔒 Pagamento seguro processado pelo Stripe</p>
        </div>
      </div>
    </form>
  );
};

export default StripePaymentForm;
