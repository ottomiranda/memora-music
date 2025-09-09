import React, { useState, useEffect } from 'react';
import { useUiStore } from '../store/uiStore';
import { X, CreditCard, Star, Zap } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

// Carregar Stripe com a chave pública
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { user, token } = useAuthStore();
  const { unblockCreationFlow, hidePaymentPopup } = useUiStore();
  const navigate = useNavigate();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para gerenciar o clientSecret
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  
  // Verificação robusta da configuração do Stripe
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const isStripeConfigured = publishableKey && publishableKey.startsWith('pk_');
  
  // Função para criar Payment Intent e obter clientSecret
  const createPaymentIntent = async () => {
    try {
      setIsLoadingPayment(true);
      setErrorMessage(null);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: 1490, // R$ 14,90 em centavos
          currency: 'brl',
          metadata: {
            userId: user?.id || undefined,
            deviceId: localStorage.getItem('deviceId') || undefined,
            productType: 'music_generation',
            description: 'Geração de música premium'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao criar o Payment Intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      console.debug('[PAYMENT_MODAL] ClientSecret obtido com sucesso');
    } catch (error) {
      console.error('[PAYMENT_MODAL] Erro ao buscar clientSecret:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao carregar formulário de pagamento';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  // Debug logs para troubleshooting
  useEffect(() => {
    if (isOpen) {
      console.debug('[PAYMENT_MODAL] Modal aberto');
      console.debug('[PAYMENT_MODAL] Chave pública configurada:', !!publishableKey);
      console.debug('[PAYMENT_MODAL] Chave válida:', isStripeConfigured);
      
      if (!isStripeConfigured && publishableKey) {
        console.warn('[PAYMENT_MODAL] Chave pública inválida:', publishableKey.substring(0, 10) + '...');
      }
    }
  }, [isOpen, publishableKey, isStripeConfigured]);
  
  const handleUpgradeClick = async () => {
    if (isStripeConfigured) {
      setShowPaymentForm(true);
      // Buscar clientSecret quando o usuário decidir pagar
      await createPaymentIntent();
    } else {
      // Fallback para pagamento simulado
      handleSimulatedPayment();
    }
  };
  
  const handleSimulatedPayment = () => {
    setIsProcessing(true);
    // Simula processamento de pagamento
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Pagamento simulado realizado com sucesso!');
      onConfirm();
    }, 2000);
  };
  
  const handleStripeSuccess = async (paymentIntentId: string) => {
    toast.success('Pagamento aprovado! Liberando criação...');

    try {
      // Desbloquear imediatamente o fluxo na UI
      unblockCreationFlow();
      hidePaymentPopup();

      // Revalidar status no backend (pode haver pequena latência do webhook)
      const headers: Record<string, string> = {
        'X-Device-ID': localStorage.getItem('deviceId') || '',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const check = await fetch(`${import.meta.env.VITE_API_URL}/api/user/creation-status`, {
        method: 'GET',
        headers,
      });
      const data = await check.json().catch(() => ({}));
      const isFree = data?.isFree ?? data?.data?.isFree;

      if (isFree === true) {
        navigate('/criar');
      } else {
        // Tentar novamente após pequena espera (propagação do webhook)
        setTimeout(async () => {
          try {
            const retry = await fetch(`${import.meta.env.VITE_API_URL}/api/user/creation-status`, {
              method: 'GET',
              headers,
            });
            const retryData = await retry.json().catch(() => ({}));
            const retryFree = retryData?.isFree ?? retryData?.data?.isFree;
            if (retryFree === true) {
              navigate('/criar');
            }
          } catch {}
        }, 1500);
      }
    } catch (e) {
      // Não bloquear o usuário caso a verificação falhe; ele já está desbloqueado
      console.error('[PAYMENT_MODAL] Erro ao revalidar status após pagamento:', e);
    } finally {
      onConfirm();
    }
  };
  
  const handleStripeError = (error: string) => {
    setErrorMessage(`Erro no pagamento: ${error}`);
    setShowPaymentForm(false);
  };

  // useEffect para exibir notificações de erro
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      setErrorMessage(null);
    }
  }, [errorMessage]);
  
  const handleBackToPlans = () => {
    setShowPaymentForm(false);
    setClientSecret(null); // Limpar clientSecret ao voltar
    setIsLoadingPayment(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <Star className="text-yellow-300" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Upgrade para Premium</h2>
              <p className="text-purple-100 text-sm">Desbloqueie músicas ilimitadas</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium">🔒 Limite de músicas gratuitas atingido</p>
              <p className="text-red-600 text-sm mt-1">
                Você já criou sua música gratuita. Faça upgrade para continuar!
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-1 rounded-full">
                <Zap className="text-green-600" size={16} />
              </div>
              <span className="text-gray-700">Músicas ilimitadas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-1 rounded-full">
                <Star className="text-blue-600" size={16} />
              </div>
              <span className="text-gray-700">Qualidade premium</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-1 rounded-full">
                <CreditCard className="text-purple-600" size={16} />
              </div>
              <span className="text-gray-700">Sem anúncios</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">R$ 14,90</div>
              <div className="text-sm text-gray-600">pagamento único</div>
            </div>
          </div>

          {/* Payment Form or Actions */}
          {showPaymentForm && isStripeConfigured ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Finalizar Pagamento</h3>
                <button
                  onClick={handleBackToPlans}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Voltar
                </button>
              </div>
              
              {/* Loading state enquanto busca clientSecret */}
              {isLoadingPayment && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Carregando pagamento...</span>
                </div>
              )}
              
              {/* Erro ao carregar clientSecret */}
              {!isLoadingPayment && !clientSecret && errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">Ocorreu um erro ao carregar o formulário. Tente novamente.</p>
                </div>
              )}
              
              {/* Formulário de pagamento com Elements provider local */}
              {!isLoadingPayment && clientSecret && (
                <Elements 
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe' as const,
                      variables: {
                        colorPrimary: '#7c3aed',
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
                  <StripePaymentForm
                    amount={1490}
                    onSuccess={handleStripeSuccess}
                    onError={handleStripeError}
                    disabled={isProcessing}
                  />
                </Elements>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <button 
                onClick={handleUpgradeClick}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processando...' : 'Fazer Upgrade Agora'}
                {!isStripeConfigured && (
                  <span className="text-xs block mt-1 opacity-75">
                    (Modo simulado)
                  </span>
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Talvez mais tarde
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
