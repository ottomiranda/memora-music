import React, { useState, useEffect, useRef } from 'react';
import { useUiStore } from '../store/uiStore';
import { X, Star } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/config/api';
import { useNavigate } from 'react-router-dom';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { LiquidGlassButtonWhite } from '@/components/ui/LiquidGlassButtonWhite';
import { LiquidGlassButtonWhiteSmall } from '@/components/ui/LiquidGlassButtonWhiteSmall';
import { Button } from '@/components/ui/button';

// Removido carregamento estático para evitar loadStripe('') quando a env não está presente

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
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const openedRef = useRef<boolean>(false);
  
  // Estados para gerenciar o clientSecret
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [pending, setPending] = useState<Array<{ payment_intent_id: string; amount: number; currency: string; voucher_url?: string | null }>>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Verificação robusta da configuração do Stripe
  const envPublishable = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const envKeyValid = !!envPublishable && envPublishable.startsWith('pk_');
  const isStripeConfigured = (!!publishableKey && publishableKey.startsWith('pk_')) || envKeyValid;

  // Carregar a chave do Stripe de forma resiliente (env ou endpoint público)
  useEffect(() => {
    if (!isOpen) return;

    // Se já carregamos, não repetir
    if (stripePromise && publishableKey) return;

    const setupStripe = async () => {
      try {
        let key = envKeyValid ? envPublishable! : '';
        if (!key) {
          const resp = await fetch(`${API_BASE_URL}/api/stripe/public-key`);
          if (resp.ok) {
            const data = await resp.json();
            if (data?.publishableKey && typeof data.publishableKey === 'string') {
              key = data.publishableKey;
            }
          }
        }

        if (key && key.startsWith('pk_')) {
          setPublishableKey(key);
          setStripePromise(loadStripe(key));
        } else {
          console.warn('[PAYMENT_MODAL] Publishable key não disponível/ inválida em nenhum lugar');
        }
      } catch (e) {
        console.error('[PAYMENT_MODAL] Erro ao carregar publishable key do Stripe:', e);
      }
    };

    void setupStripe();
  }, [isOpen, envKeyValid, envPublishable, stripePromise, publishableKey]);
  
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

      const response = await fetch(`${API_BASE_URL}/api/stripe/create-payment-intent`, {
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
      console.debug('[PAYMENT_MODAL] Chave (env):', envPublishable ? envPublishable.substring(0, 10) + '...' : 'N/A');
      console.debug('[PAYMENT_MODAL] Chave (state):', publishableKey ? publishableKey.substring(0, 10) + '...' : 'N/A');
      console.debug('[PAYMENT_MODAL] Stripe configurado:', !!stripePromise);
    }
  }, [isOpen, envPublishable, publishableKey, stripePromise]);

  // Resetar estado visual ao abrir o modal novamente (evita reabrir direto no formulário)
  useEffect(() => {
    if (isOpen && !openedRef.current) {
      setShowPaymentForm(false);
      setClientSecret(null);
      setIsLoadingPayment(false);
      setErrorMessage(null);
    }
    openedRef.current = isOpen;
  }, [isOpen]);

  // Buscar pagamentos pendentes ao abrir o modal
  useEffect(() => {
    const fetchPending = async () => {
      try {
        if (!isOpen) return;
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Device-ID': localStorage.getItem('deviceId') || '' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch(`${API_BASE_URL}/api/stripe/pending`, { headers });
        if (!resp.ok) return;
        const data = await resp.json();
        setPending(Array.isArray(data?.items) ? data.items : []);
      } catch {}
    };
    fetchPending();
  }, [isOpen, token]);

  // Polling automático: enquanto há pendência, verifica liberação a cada 3s
  useEffect(() => {
    if (!isOpen) return;
    if (pending.length === 0 && !showPaymentForm) return;

    if (!pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        try {
          const headers: Record<string, string> = { 'X-Device-ID': localStorage.getItem('deviceId') || '' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const check = await fetch(`${API_BASE_URL}/api/user/creation-status`, { headers });
          const res = await check.json().catch(() => ({}));
          const isFree = res?.isFree ?? res?.data?.isFree;
          if (isFree === true) {
            unblockCreationFlow();
            hidePaymentPopup();
            onConfirm();
            navigate('/criar');
          }
        } catch {}
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, pending.length, showPaymentForm, token, unblockCreationFlow, hidePaymentPopup, navigate, onConfirm]);
  
  const handleUpgradeClick = async () => {
    if (isStripeConfigured && stripePromise) {
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

      // Finalizar no backend (verifica PaymentIntent e libera cota sem depender do webhook)
      try {
        const finalizeHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) finalizeHeaders['Authorization'] = `Bearer ${token}`;
        await fetch(`${API_BASE_URL}/api/stripe/finalize`, {
          method: 'POST',
          headers: finalizeHeaders,
          body: JSON.stringify({ paymentIntentId, deviceId: localStorage.getItem('deviceId') || undefined })
        });
      } catch (e) {
        console.warn('[PAYMENT_MODAL] Não foi possível finalizar pagamento no backend imediatamente. Prosseguindo.');
      }

      // Revalidar status no backend (pode haver pequena latência do webhook)
      const headers: Record<string, string> = {
        'X-Device-ID': localStorage.getItem('deviceId') || '',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const check = await fetch(`${API_BASE_URL}/api/user/creation-status`, {
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
            const retry = await fetch(`${API_BASE_URL}/api/user/creation-status`, {
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

  const handleOverlayClick = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />
      <LiquidGlassCard
        variant="primary"
        size="lg"
        className="relative w-full max-w-md sm:max-w-lg border-white/25 p-0 max-h-[88vh] flex flex-col overflow-hidden"
      >
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          aria-label="Fechar popup"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="relative overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#f97316]" />
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="relative px-5 py-6 sm:px-6 sm:py-6 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm">
                  <Star className="h-6 w-6 text-yellow-200" />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-semibold sm:text-2xl">Seja Premium</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 text-white sm:px-6 sm:py-6">
          {/* Aviso inicial e informações principais exibidos apenas fora do formulário */}
          {!showPaymentForm && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center shadow-lg shadow-purple-900/20">
                <p className="flex items-center justify-center gap-2 text-sm font-medium text-white">
                  <span role="img" aria-hidden="true">🔒</span>
                  Limite de músicas gratuitas atingido
                </p>
                <p className="mt-2 text-xs text-white/80 sm:text-sm">
                  Você já criou sua música gratuita. Faça upgrade para continuar!
                </p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-center">
                <p className="text-2xl font-heading font-semibold text-white sm:text-3xl">R$ 14,90</p>
                <p className="mt-1 text-xs text-white/70 sm:text-sm">pagamento único</p>
              </div>
            </div>
          )}

          {/* Pagamentos pendentes (exibe antes do formulário) */}
          {!showPaymentForm && isOpen && pending && pending.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-amber-200/60 bg-amber-500/15 p-4 text-amber-50">
              <p className="text-sm font-semibold sm:text-base">Pagamento pendente encontrado</p>
              <p className="text-xs text-amber-100/90 sm:text-sm">
                Finalize o boleto antes de continuar. Você pode abrir o comprovante abaixo e, após concluir o pagamento, clicar em verificar.
              </p>
              {pending.map((p) => (
                <div key={p.payment_intent_id} className="rounded-xl border border-white/10 bg-black/10 p-3 text-[11px] sm:text-xs">
                  <div className="font-mono tracking-tight text-white/90">Intent: {p.payment_intent_id}</div>
                  {p.voucher_url && (
                    <a
                      href={p.voucher_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-white underline-offset-4 hover:underline"
                    >
                      Abrir boleto
                    </a>
                  )}
                </div>
              ))}
              <LiquidGlassButtonWhiteSmall
                onClick={async () => {
                  try {
                    const headers: Record<string, string> = { 'X-Device-ID': localStorage.getItem('deviceId') || '' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    const check = await fetch(`${API_BASE_URL}/api/user/creation-status`, { headers });
                    const res = await check.json().catch(() => ({}));
                    const isFree = res?.isFree ?? res?.data?.isFree;
                    if (isFree === true) {
                      unblockCreationFlow();
                      hidePaymentPopup();
                      onConfirm();
                      navigate('/criar');
                    } else {
                      toast.info('Ainda aguardando confirmação. Tente novamente em alguns segundos.');
                    }
                  } catch {}
                }}
                className="w-full justify-center text-[11px] font-semibold uppercase tracking-wide text-slate-900"
              >
                Já paguei, verificar agora
              </LiquidGlassButtonWhiteSmall>
            </div>
          )}

          {/* Payment Form or Actions */}
          {showPaymentForm && isStripeConfigured && stripePromise ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-white">
                <h3 className="text-xl font-heading font-semibold tracking-tight">Finalizar Pagamento</h3>
                <button
                  onClick={handleBackToPlans}
                  className="text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  ← Voltar
                </button>
              </div>

              {isLoadingPayment && (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 py-6 text-white/80">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
                  <span>Carregando pagamento...</span>
                </div>
              )}

              {!isLoadingPayment && !clientSecret && errorMessage && (
                <div className="rounded-2xl border border-red-300/70 bg-red-500/20 p-4 text-sm text-red-50">
                  Ocorreu um erro ao carregar o formulário. Tente novamente.
                </div>
              )}

              {!isLoadingPayment && clientSecret && (
                <div className="rounded-2xl border border-white/20 bg-white/90 p-4 text-slate-900 shadow-lg shadow-purple-900/10">
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      paymentMethodOrder: ['pix', 'card', 'boleto'],
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
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <LiquidGlassButton
                onClick={handleUpgradeClick}
                disabled={isProcessing}
                className="w-full h-12 flex-col gap-0.5 text-center disabled:opacity-60"
              >
                <span>{isProcessing ? 'Processando...' : 'Fazer Upgrade Agora'}</span>
                {!isStripeConfigured && (
                  <span className="text-xs font-normal text-white/80">Modo simulado</span>
                )}
              </LiquidGlassButton>
              <LiquidGlassButtonWhite
                onClick={onClose}
                disabled={isProcessing}
                className="w-full h-12 text-sm font-semibold disabled:opacity-60"
              >
                Talvez mais tarde
              </LiquidGlassButtonWhite>
            </div>
          )}
        </div>
      </LiquidGlassCard>
    </div>
  );
};

export default PaymentModal;
