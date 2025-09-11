import React, { useMemo, useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

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
    // Reordena métodos no componente (Stripe ignora no Elements root)
    paymentMethodOrder: ['pix', 'card', 'boleto'],
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Pagamento Seguro</h3>
          <div className="text-2xl font-bold text-indigo-600">
            {formatCurrency(amount)}
          </div>
        </div>

        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Método de Pagamento</span>
          </div>
          <PaymentElement options={paymentElementOptions} />
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 font-medium text-sm">Erro no pagamento</h4>
              <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {paymentStatus === 'succeeded' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-green-800 font-medium text-sm">Pagamento realizado!</h4>
              <p className="text-green-700 text-sm mt-1">Seu upgrade foi processado com sucesso.</p>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || disabled || paymentStatus === 'succeeded'}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2 w-full h-12 text-base font-semibold justify-center"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            <span>Processando...</span>
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
      </button>

      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>🔒 Pagamento seguro processado pelo Stripe</p>
        <p>Seus dados de cartão são criptografados e não são armazenados em nossos servidores</p>
      </div>
    </form>
  );
};

export default StripePaymentForm;
