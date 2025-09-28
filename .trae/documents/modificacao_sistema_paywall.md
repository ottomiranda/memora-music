# Modificação do Sistema de Paywall - Pagamento Individual por Música

## 1. Visão Geral da Mudança

Este documento especifica as modificações necessárias para alterar o sistema de paywall atual, removendo o conceito de usuário premium com acesso ilimitado e implementando um modelo de pagamento individual por música.

### 1.1 Modelo Atual vs Novo Modelo

**Modelo Atual:**
- 1 música gratuita por usuário
- Upgrade premium = acesso ilimitado
- Verificação via tabela `stripe_transactions`

**Novo Modelo:**
- 1 música gratuita por usuário
- Cada música adicional requer pagamento individual
- Sem conceito de usuário premium
- Pagamento por música consumido após a geração

## 2. Mudanças na Arquitetura

### 2.1 Modificações no Banco de Dados

#### Tabela `user_creations` (Modificar)
```sql
-- Adicionar colunas para controle de pagamentos individuais
ALTER TABLE user_creations ADD COLUMN pending_payments INTEGER DEFAULT 0;
ALTER TABLE user_creations ADD COLUMN total_paid_songs INTEGER DEFAULT 0;

-- Índices para performance
CREATE INDEX idx_user_creations_pending_payments ON user_creations(pending_payments);
CREATE INDEX idx_user_creations_total_paid ON user_creations(total_paid_songs);
```

#### Nova Tabela `individual_song_payments`
```sql
CREATE TABLE individual_song_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_id TEXT,
    payment_intent_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL, -- em centavos
    currency TEXT DEFAULT 'brl',
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    song_generated BOOLEAN DEFAULT FALSE,
    song_id TEXT, -- referência à música gerada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Índices
CREATE INDEX idx_individual_payments_user_id ON individual_song_payments(user_id);
CREATE INDEX idx_individual_payments_device_id ON individual_song_payments(device_id);
CREATE INDEX idx_individual_payments_status ON individual_song_payments(status);
CREATE INDEX idx_individual_payments_expires ON individual_song_payments(expires_at);

-- RLS Policies
ALTER TABLE individual_song_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON individual_song_payments
    FOR SELECT USING (
        auth.uid() = user_id OR 
        device_id = current_setting('request.headers')::json->>'x-device-id'
    );

CREATE POLICY "Users can insert own payments" ON individual_song_payments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        device_id = current_setting('request.headers')::json->>'x-device-id'
    );
```

### 2.2 Remoção de Funcionalidades Premium

#### Tabela `stripe_transactions` (Deprecar)
```sql
-- Manter tabela para histórico, mas não usar para verificação de acesso
-- Adicionar coluna para marcar como depreciada
ALTER TABLE stripe_transactions ADD COLUMN deprecated BOOLEAN DEFAULT TRUE;
```

## 3. Modificações na Lógica de Negócio

### 3.1 Nova Lógica de Verificação do Paywall

#### Arquivo: `api/lib/paywall-utils.ts`

**Remover função `hasUnlimitedAccess`:**
```typescript
// REMOVER COMPLETAMENTE
// export const hasUnlimitedAccess = async (...) => { ... }
```

**Nova função `hasPendingPayment`:**
```typescript
export const hasPendingPayment = async (
  supabase: SupabaseClient,
  options: { userId?: string | null; deviceIds?: Array<string | null | undefined> }
): Promise<{ hasPending: boolean; paymentId?: string }> => {
  const { userId, deviceIds = [] } = options;
  const normalizedDeviceIds = normalizeIds(deviceIds);
  const orFilters: string[] = [];

  if (userId) {
    orFilters.push(`user_id.eq.${userId}`);
  }

  normalizedDeviceIds.forEach(id => {
    orFilters.push(`device_id.eq.${id}`);
  });

  if (orFilters.length === 0) {
    return { hasPending: false };
  }

  const { data, error } = await supabase
    .from('individual_song_payments')
    .select('id, payment_intent_id')
    .eq('status', 'succeeded')
    .eq('song_generated', false)
    .gt('expires_at', new Date().toISOString())
    .or(orFilters.join(','))
    .limit(1);

  if (error) {
    console.error('[PAYWALL] Erro ao verificar pagamento pendente:', error);
    return { hasPending: false };
  }

  return {
    hasPending: data && data.length > 0,
    paymentId: data?.[0]?.payment_intent_id
  };
};
```

### 3.2 Modificação da API `/api/user/creation-status`

#### Arquivo: `api/routes/paywall.ts`

**Nova lógica de verificação:**
```typescript
// REMOVER todas as chamadas para hasUnlimitedAccess

// SUBSTITUIR por:
const pendingPayment = await hasPendingPayment(supabase, {
  userId,
  deviceIds: [deviceId, guestId, foundUser?.device_id, ...usageDeviceIds]
});

if (pendingPayment.hasPending) {
  console.log('[PAYWALL] Pagamento pendente encontrado - permitindo geração');
  res.status(200).json({
    success: true,
    isFree: true,
    freeSongsUsed: foundUser?.freesongsused || 0,
    message: 'Música paga disponível para geração',
    userType: userId ? 'authenticated_paid' : 'guest_paid',
    hasPendingPayment: true,
    paymentId: pendingPayment.paymentId
  });
  return;
}

// Continuar com lógica normal de música gratuita
const FREE_SONG_LIMIT = 1;
const freeSongsUsed = foundUser?.freesongsused || 0;
const isFree = freeSongsUsed < FREE_SONG_LIMIT;
```

### 3.3 Modificação da API de Geração `/api/generate-preview`

#### Arquivo: `api/routes/generate-preview.ts`

**Nova ordem de verificação:**
```typescript
// PASSO 1: Verificar pagamento pendente
const pendingPayment = await hasPendingPayment(supabaseClient, {
  userId,
  deviceIds: [deviceId, guestId, existingUser?.device_id, ...usageDeviceIds]
});

if (pendingPayment.hasPending) {
  console.log('[PAYWALL] Usando pagamento pendente para geração');
  // Continuar com geração
  // Marcar pagamento como consumido após geração bem-sucedida
} else {
  // Verificar música gratuita
  if (existingUser && existingUser.freesongsused >= FREE_SONG_LIMIT) {
    return res.status(402).json({
      success: false,
      error: 'PAYMENT_REQUIRED',
      message: 'Você precisa pagar por esta música. Cada música adicional requer pagamento individual.',
      freeSongsUsed: existingUser.freesongsused,
      maxFreeSongs: FREE_SONG_LIMIT,
      requiresPayment: true,
      paymentType: 'individual_song'
    });
  }
}
```

**Marcar pagamento como consumido:**
```typescript
// Após geração bem-sucedida
if (pendingPayment.hasPending) {
  await supabaseClient
    .from('individual_song_payments')
    .update({
      song_generated: true,
      song_id: generatedSongId,
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', pendingPayment.paymentId);

  // Incrementar contador de músicas pagas
  await supabaseClient
    .from('user_creations')
    .update({
      total_paid_songs: (existingUser?.total_paid_songs || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('device_id', canonicalDeviceId);
}
```

## 4. Novo Fluxo de Pagamento Individual

### 4.1 Nova API para Pagamento Individual

#### Arquivo: `api/routes/individual-payment.ts`

```typescript
/**
 * Create Individual Song Payment Intent
 * POST /api/individual-payment/create-intent
 */
router.post('/create-intent', async (req: Request, res: Response) => {
  try {
    const { userId, deviceId } = extractUserInfo(req);
    
    // Verificar se usuário já tem pagamento pendente
    const existingPayment = await hasPendingPayment(supabase, {
      userId,
      deviceIds: [deviceId]
    });
    
    if (existingPayment.hasPending) {
      return res.status(400).json({
        success: false,
        message: 'Você já tem um pagamento pendente. Use-o para gerar sua música.'
      });
    }
    
    // Criar Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500, // R$ 5,00 por música
      currency: 'brl',
      metadata: {
        type: 'individual_song',
        userId: userId || 'guest',
        deviceId: deviceId || '',
        timestamp: new Date().toISOString()
      }
    });
    
    // Salvar no banco
    await supabase
      .from('individual_song_payments')
      .insert({
        user_id: userId,
        device_id: deviceId,
        payment_intent_id: paymentIntent.id,
        amount: 500,
        currency: 'brl',
        status: 'pending'
      });
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
    
  } catch (error) {
    console.error('[INDIVIDUAL_PAYMENT] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});
```

### 4.2 Webhook para Pagamentos Individuais

```typescript
/**
 * Webhook para confirmar pagamentos individuais
 * POST /api/individual-payment/webhook
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed.`);
  }
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // Atualizar status do pagamento
    await supabase
      .from('individual_song_payments')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntent.id);
  }
  
  res.json({received: true});
});
```

## 5. Modificações no Frontend

### 5.1 Componente PaymentModal

#### Arquivo: `src/components/PaymentModal.tsx`

**Remover referências a planos premium:**
```typescript
// REMOVER:
// - Seleção de planos
// - Referências a "acesso ilimitado"
// - Lógica de upgrade premium

// ADICIONAR:
const INDIVIDUAL_SONG_PRICE = 5.00; // R$ 5,00

const PaymentModal = ({ isOpen, onClose }) => {
  return (
    <div className="payment-modal">
      <h2>Pagar por Esta Música</h2>
      <p>Cada música adicional custa R$ {INDIVIDUAL_SONG_PRICE.toFixed(2)}</p>
      <p>Após o pagamento, você poderá gerar uma música. Para gerar outra música, será necessário um novo pagamento.</p>
      
      {/* Stripe Payment Element */}
      <PaymentElement />
      
      <button onClick={handlePayment}>
        Pagar R$ {INDIVIDUAL_SONG_PRICE.toFixed(2)}
      </button>
    </div>
  );
};
```

### 5.2 Modificação do Music Store

#### Arquivo: `src/store/musicStore.ts`

**Atualizar função `startNewCreationFlow`:**
```typescript
startNewCreationFlow: async (navigate, token) => {
  // ... código existente ...
  
  const response = await api.get('/user/creation-status');
  
  if (response.data.hasPendingPayment) {
    // Usuário tem pagamento pendente - permitir geração
    uiStore.setCreationFlowBlocked(false);
    uiStore.setShowPaymentPopup(false);
    return;
  }
  
  if (!response.data.isFree) {
    // Mostrar modal de pagamento individual
    uiStore.setCreationFlowBlocked(true);
    uiStore.setShowPaymentPopup(true);
    uiStore.setPaymentType('individual_song'); // Novo tipo
    return;
  }
  
  // Música gratuita disponível
  uiStore.setCreationFlowBlocked(false);
  uiStore.setShowPaymentPopup(false);
}
```

## 6. Migração e Limpeza

### 6.1 Script de Migração

```sql
-- Migration: Implementar pagamento individual por música
-- Arquivo: supabase/migrations/020_individual_song_payments.sql

-- 1. Criar nova tabela
CREATE TABLE individual_song_payments (
    -- definição completa acima
);

-- 2. Modificar tabela existente
ALTER TABLE user_creations ADD COLUMN pending_payments INTEGER DEFAULT 0;
ALTER TABLE user_creations ADD COLUMN total_paid_songs INTEGER DEFAULT 0;

-- 3. Deprecar tabela antiga
ALTER TABLE stripe_transactions ADD COLUMN deprecated BOOLEAN DEFAULT TRUE;

-- 4. Função de limpeza de pagamentos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_payments()
RETURNS void AS $$
BEGIN
    DELETE FROM individual_song_payments 
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Cron job para limpeza (se suportado)
-- SELECT cron.schedule('cleanup-expired-payments', '0 * * * *', 'SELECT cleanup_expired_payments();');
```

### 6.2 Limpeza de Código

**Arquivos a modificar:**
1. `api/lib/paywall-utils.ts` - Remover `hasUnlimitedAccess`
2. `api/routes/paywall.ts` - Remover verificações premium
3. `api/routes/generate-preview.ts` - Nova lógica de pagamento
4. `src/components/PaymentModal.tsx` - Remover planos premium
5. `src/store/musicStore.ts` - Atualizar fluxo de criação

**Arquivos a criar:**
1. `api/routes/individual-payment.ts` - Nova API de pagamento
2. `src/services/individualPayment.ts` - Serviço frontend

## 7. Testes e Validação

### 7.1 Cenários de Teste

1. **Usuário novo (anônimo)**
   - Deve poder gerar 1 música gratuita
   - Segunda música deve exigir pagamento

2. **Usuário autenticado**
   - Deve poder gerar 1 música gratuita
   - Segunda música deve exigir pagamento
   - Migração de dados deve preservar contador

3. **Pagamento individual**
   - Pagamento deve permitir geração de 1 música
   - Após geração, nova música deve exigir novo pagamento
   - Pagamentos expirados devem ser limpos

4. **Usuários premium existentes**
   - Devem ser migrados para modelo individual
   - Histórico deve ser preservado

### 7.2 Métricas de Monitoramento

- Taxa de conversão de pagamentos individuais
- Tempo médio entre pagamento e geração
- Pagamentos expirados não utilizados
- Receita por música gerada

## 8. Cronograma de Implementação

1. **Fase 1**: Modificações no banco de dados (1 dia)
2. **Fase 2**: Nova API de pagamento individual (2 dias)
3. **Fase 3**: Modificações na lógica de paywall (1 dia)
4. **Fase 4**: Atualizações no frontend (2 dias)
5. **Fase 5**: Testes e validação (1 dia)
6. **Fase 6**: Deploy e monitoramento (1 dia)

**Total estimado: 8 dias úteis**

## 9. Considerações de Segurança

- Validação rigorosa de pagamentos via webhook
- Prevenção de reutilização de pagamentos
- Limpeza automática de pagamentos expirados
- Logs detalhados para auditoria
- Rate limiting nas APIs de pagamento

## 10. Impacto na Receita

**Modelo Atual:**
- Receita única por usuário (upgrade premium)
- Uso ilimitado após pagamento

**Novo Modelo:**
- Receita recorrente por música
- Maior previsibilidade de receita
- Melhor controle de custos operacionais

Este novo modelo deve resultar em maior receita por usuário ativo e melhor sustentabilidade financeira da plataforma.