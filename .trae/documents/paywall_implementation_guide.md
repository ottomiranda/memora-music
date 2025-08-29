# Guia de Implementação: Paywall Seguro para Músicas Adicionais

## 1. Visão Geral do Sistema

Este documento detalha a implementação de um sistema de paywall seguro para a plataforma Memora Music, onde a primeira música gerada é gratuita e as subsequentes são pagas. O sistema foi projetado para ser seguro contra bypass e oferecer uma experiência de usuário fluida.

### 1.1 Objetivos
- Permitir uma música gratuita por usuário
- Implementar cobrança segura para músicas adicionais
- Prevenir bypass através de limpeza de cache
- Manter boa experiência do usuário
- Garantir rastreamento confiável do uso

## 2. Modificações no Backend

### 2.1 Atualização do Modelo de Usuário

**Tabela: users**
```sql
-- Adicionar campo para rastrear músicas gratuitas utilizadas
ALTER TABLE users ADD COLUMN free_songs_used INTEGER DEFAULT 0;

-- Índice para otimizar consultas
CREATE INDEX idx_users_free_songs_used ON users(free_songs_used);
```

**Schema TypeScript:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  free_songs_used: number;
  created_at: Date;
  updated_at: Date;
}
```

### 2.2 Endpoint de Verificação de Status

**Rota:** `GET /api/user/creation-status`

**Funcionalidade:**
- Verifica se o usuário está autenticado
- Retorna se a próxima criação é gratuita ou paga
- Inclui informações sobre limite de músicas gratuitas

**Resposta:**
```typescript
interface CreationStatusResponse {
  isFree: boolean;
  freeSongsUsed: number;
  freeSongsLimit: number;
  requiresPayment: boolean;
}
```

**Exemplo de implementação:**
```typescript
// GET /api/user/creation-status
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isFree = user.free_songs_used < 1;
  
  return Response.json({
    isFree,
    freeSongsUsed: user.free_songs_used,
    freeSongsLimit: 1,
    requiresPayment: !isFree
  });
}
```

### 2.3 Proteção da Rota de Geração

**Rota:** `POST /api/generate-music`

**Validações de Segurança:**
1. Verificar autenticação do usuário
2. Validar se usuário tem direito à música gratuita
3. Verificar status de pagamento para músicas pagas
4. Incrementar contador após geração bem-sucedida

**Fluxo de Validação:**
```typescript
// POST /api/generate-music
export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar se precisa de pagamento
  if (user.free_songs_used >= 1) {
    // Verificar se há sessão de pagamento válida
    const paymentSession = await getValidPaymentSession(user.id);
    
    if (!paymentSession || paymentSession.status !== 'paid') {
      return Response.json(
        { error: 'Payment required', code: 'PAYMENT_REQUIRED' },
        { status: 402 }
      );
    }
  }

  // Gerar música
  const music = await generateMusic(musicData);
  
  // Incrementar contador apenas após sucesso
  if (user.free_songs_used === 0) {
    await updateUser(user.id, { free_songs_used: 1 });
  }
  
  return Response.json({ music });
}
```

### 2.4 Endpoint de Sessão de Pagamento

**Rota:** `POST /api/create-payment-session`

**Funcionalidade:**
- Criar sessão de pagamento com provedor (Stripe)
- Armazenar metadados da música a ser gerada
- Retornar ID da sessão para o frontend

**Payload:**
```typescript
interface CreatePaymentSessionRequest {
  musicData: {
    genre: string;
    mood: string;
    instruments: string[];
    duration: number;
  };
}

interface CreatePaymentSessionResponse {
  sessionId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
}
```

**Implementação:**
```typescript
// POST /api/create-payment-session
export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  const { musicData } = await request.json();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Criar sessão no Stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: {
          name: 'Criação de Música Personalizada',
          description: 'Gere sua música única com IA'
        },
        unit_amount: 1500, // R$ 15,00
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/criar`,
    metadata: {
      userId: user.id,
      musicData: JSON.stringify(musicData)
    }
  });

  return Response.json({
    sessionId: session.id,
    paymentUrl: session.url,
    amount: 1500,
    currency: 'BRL'
  });
}
```

### 2.5 Webhook de Confirmação de Pagamento

**Rota:** `POST /api/webhooks/stripe`

**Funcionalidade:**
- Receber confirmação de pagamento do Stripe
- Validar assinatura do webhook
- Processar geração da música após pagamento confirmado
- Atualizar status da sessão de pagamento

```typescript
// POST /api/webhooks/stripe
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, musicData } = session.metadata;
    
    // Iniciar geração da música em background
    await queueMusicGeneration({
      userId,
      musicData: JSON.parse(musicData),
      paymentSessionId: session.id
    });
  }

  return Response.json({ received: true });
}
```

## 3. Modificações no Frontend

### 3.1 Store de Estado Global

**Atualização do uiStore:**
```typescript
interface UiStore {
  // ... existing properties
  creationStatus: {
    isFree: boolean;
    requiresPayment: boolean;
    freeSongsUsed: number;
  } | null;
  paymentSession: {
    sessionId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  } | null;
}

const useUiStore = create<UiStore>((set, get) => ({
  // ... existing state
  creationStatus: null,
  paymentSession: null,
  
  setCreationStatus: (status) => set({ creationStatus: status }),
  setPaymentSession: (session) => set({ paymentSession: session }),
  clearPaymentSession: () => set({ paymentSession: null })
}));
```

### 3.2 Hook para Verificação de Status

```typescript
// hooks/useCreationStatus.ts
export const useCreationStatus = () => {
  const { creationStatus, setCreationStatus } = useUiStore();
  const { user } = useAuthStore();
  
  const checkCreationStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/user/creation-status');
      const data = await response.json();
      setCreationStatus(data);
      return data;
    } catch (error) {
      console.error('Error checking creation status:', error);
    }
  }, [user, setCreationStatus]);
  
  return {
    creationStatus,
    checkCreationStatus,
    isLoading: creationStatus === null
  };
};
```

### 3.3 Componente de Aviso de Custo

```typescript
// components/PaymentNotice.tsx
interface PaymentNoticeProps {
  show: boolean;
  onDismiss: () => void;
}

export const PaymentNotice: React.FC<PaymentNoticeProps> = ({ show, onDismiss }) => {
  if (!show) return null;
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <InfoIcon className="h-5 w-5 text-amber-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            Lembrete sobre cobrança
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            Sua primeira música foi por nossa conta! A partir de agora, 
            a criação de novas músicas é um recurso pago (R$ 15,00).
          </p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onDismiss}
            className="text-amber-400 hover:text-amber-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 3.4 Integração no Fluxo de Criação

**Página inicial do fluxo (`/criar`):**
```typescript
// pages/criar/page.tsx
export default function CriarPage() {
  const { creationStatus, checkCreationStatus } = useCreationStatus();
  const [showPaymentNotice, setShowPaymentNotice] = useState(false);
  
  useEffect(() => {
    checkCreationStatus();
  }, [checkCreationStatus]);
  
  useEffect(() => {
    if (creationStatus && creationStatus.requiresPayment) {
      setShowPaymentNotice(true);
    }
  }, [creationStatus]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PaymentNotice 
        show={showPaymentNotice}
        onDismiss={() => setShowPaymentNotice(false)}
      />
      
      {/* Resto do componente */}
    </div>
  );
}
```

### 3.5 Interceptação para Pagamento

```typescript
// hooks/usePaymentFlow.ts
export const usePaymentFlow = () => {
  const { creationStatus } = useCreationStatus();
  const { setPaymentSession } = useUiStore();
  
  const handleCreateMusic = useCallback(async (musicData: MusicData) => {
    // Verificar se precisa de pagamento
    if (creationStatus?.requiresPayment) {
      try {
        const response = await fetch('/api/create-payment-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ musicData })
        });
        
        const { sessionId, paymentUrl } = await response.json();
        
        setPaymentSession({ sessionId, status: 'pending' });
        
        // Redirecionar para Stripe Checkout
        window.location.href = paymentUrl;
        
      } catch (error) {
        console.error('Error creating payment session:', error);
        toast.error('Erro ao processar pagamento');
      }
    } else {
      // Fluxo gratuito normal
      await generateMusic(musicData);
    }
  }, [creationStatus, setPaymentSession]);
  
  return { handleCreateMusic };
};
```

### 3.6 Página de Sucesso do Pagamento

```typescript
// pages/payment/success/page.tsx
export default function PaymentSuccessPage() {
  const [musicStatus, setMusicStatus] = useState<'generating' | 'ready' | 'error'>('generating');
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    if (!sessionId) return;
    
    // Polling para verificar status da música
    const pollMusicStatus = async () => {
      try {
        const response = await fetch(`/api/music/status?sessionId=${sessionId}`);
        const { status, musicUrl } = await response.json();
        
        if (status === 'completed') {
          setMusicStatus('ready');
          // Redirecionar para página de resultado
          router.push(`/resultado?musicUrl=${encodeURIComponent(musicUrl)}`);
        } else if (status === 'failed') {
          setMusicStatus('error');
        }
      } catch (error) {
        console.error('Error polling music status:', error);
      }
    };
    
    const interval = setInterval(pollMusicStatus, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);
  
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Pagamento Confirmado!</h1>
      
      {musicStatus === 'generating' && (
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Sua música está sendo gerada... Isso pode levar alguns minutos.</p>
        </div>
      )}
      
      {musicStatus === 'error' && (
        <div className="text-red-600">
          <p>Ocorreu um erro na geração da música. Nossa equipe foi notificada.</p>
        </div>
      )}
    </div>
  );
}
```

## 4. Considerações de Segurança

### 4.1 Prevenção de Bypass

**Validações no Backend:**
- Todas as verificações de pagamento são feitas no servidor
- Contador de músicas gratuitas armazenado no banco de dados
- Validação de sessão de pagamento antes da geração
- Webhooks assinados para confirmar pagamentos

**Medidas Anti-Fraude:**
- Rate limiting nas rotas de geração
- Logs detalhados de todas as operações
- Validação de integridade dos dados de pagamento
- Timeout para sessões de pagamento

### 4.2 Tratamento de Erros

**Cenários de Erro:**
1. Falha na criação da sessão de pagamento
2. Pagamento cancelado pelo usuário
3. Webhook não recebido
4. Falha na geração da música após pagamento

**Estratégias de Recuperação:**
- Retry automático para webhooks
- Reembolso automático em caso de falha na geração
- Notificação manual para casos edge
- Logs estruturados para debugging

## 5. Monitoramento e Métricas

### 5.1 Métricas de Negócio
- Taxa de conversão de usuários gratuitos para pagos
- Valor médio por transação
- Taxa de abandono no checkout
- Tempo médio de geração de música

### 5.2 Métricas Técnicas
- Latência dos endpoints de pagamento
- Taxa de sucesso dos webhooks
- Erros na geração de música
- Performance do polling de status

### 5.3 Alertas
- Falhas consecutivas na geração de música
- Webhooks não recebidos em tempo hábil
- Picos de erro 402 (Payment Required)
- Transações com valores anômalos

## 6. Testes

### 6.1 Testes Unitários
- Validação de lógica de pagamento
- Verificação de status de criação
- Processamento de webhooks
- Cálculo de músicas gratuitas

### 6.2 Testes de Integração
- Fluxo completo de pagamento
- Geração de música após pagamento
- Handling de webhooks do Stripe
- Polling de status

### 6.3 Testes E2E
- Jornada completa do usuário
- Cenários de erro e recuperação
- Responsividade em diferentes dispositivos
- Performance sob carga

## 7. Deployment e Rollback

### 7.1 Estratégia de Deploy
1. Deploy das mudanças de backend primeiro
2. Testes em ambiente de staging
3. Deploy gradual do frontend
4. Monitoramento intensivo nas primeiras 24h

### 7.2 Plano de Rollback
- Feature flags para desabilitar paywall
- Backup do banco antes das migrações
- Scripts de rollback para mudanças de schema
- Procedimento de emergência documentado

## 8. Próximos Passos

1. **Implementação por Fases:**
   - Fase 1: Backend e segurança
   - Fase 2: Frontend e UX
   - Fase 3: Testes e otimizações

2. **Melhorias Futuras:**
   - Planos de assinatura
   - Descontos para usuários frequentes
   - Integração com outros provedores de pagamento
   - Analytics avançados de conversão

3. **Otimizações:**
   - Cache de status de usuário
   - Pré-carregamento de sessões de pagamento
   - Compressão de dados de música
   - CDN para assets de áudio