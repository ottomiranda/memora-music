# Modificação do Sistema de Paywall - Pagamento Individual por Música

## 1. Visão Geral da Mudança

### Situação Atual
- Sistema de paywall com 1 música gratuita por usuário
- Upgrade premium via pagamento único que libera acesso ilimitado
- Verificação de acesso premium através da tabela `stripe_transactions`
- Função `hasUnlimitedAccess()` que verifica se o usuário tem acesso premium

### Nova Proposta
- Manter 1 música gratuita por usuário
- **Eliminar** o conceito de usuário premium com acesso ilimitado
- **Implementar** pagamento individual por música após a cota gratuita
- Cada nova música requer um novo pagamento

## 2. Análise do Sistema Atual

### 2.1 Componentes Principais

#### Verificação do Paywall
- **Arquivo:** `api/routes/paywall.ts`
- **Função principal:** `/creation-status` endpoint
- **Lógica atual:**
  ```typescript
  const hasUnlimited = await hasUnlimitedAccess(userId, deviceIds);
  if (hasUnlimited) {
    return { isFree: true, reason: 'premium_access' };
  }
  ```

#### Geração de Música
- **Arquivo:** `api/routes/generate-preview.ts`
- **Lógica atual:**
  ```typescript
  const hasUnlimited = await hasUnlimitedAccess(userId, deviceIds);
  if (!hasUnlimited && freesongsused >= FREE_SONG_LIMIT) {
    return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
  }
  ```

#### Função de Verificação Premium
- **Arquivo:** `api/lib/paywall-utils.ts`
- **Função:** `hasUnlimitedAccess()`
- **Consulta:** Verifica `stripe_transactions` com status 'succeeded'

### 2.2 Tabelas Envolvidas

#### `user_creations`
```sql
CREATE TABLE user_creations (
  device_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  freesongsused INTEGER DEFAULT 0,
  creations INTEGER DEFAULT 0,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `stripe_transactions`
```sql
CREATE TABLE stripe_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  payment_intent_id VARCHAR NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR,
  status VARCHAR NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Nova Arquitetura - Pagamento Individual

### 3.1 Conceito Central

**Modelo Atual:** 1 música grátis → Upgrade premium (acesso ilimitado)

**Novo Modelo:** 1 música grátis → Pagamento por música individual

### 3.2 Fluxo de Funcionamento

1. **Primeira música:** Gratuita (como atualmente)
2. **Segunda música em diante:** 
   - Usuário deve pagar por cada música individual
   - Após pagamento confirmado, libera criação de 1 música
   - Contador é incrementado e nova música fica disponível
   - Para próxima música, novo pagamento é necessário

### 3.3 Mudanças na Lógica

#### Eliminação da Verificação Premium
```typescript
// REMOVER esta lógica:
const hasUnlimited = await hasUnlimitedAccess(userId, deviceIds);
if (hasUnlimited) {
  return { isFree: true, reason: 'premium_access' };
}

// NOVA lógica: sempre verificar contador individual
const canCreate = freesongsused < FREE_SONG_LIMIT || hasPendingPayment;
```

#### Nova Verificação de Pagamento Individual
```typescript
// Verificar se há pagamento pendente para próxima música
const hasPendingPayment = await checkPendingPaymentForNextSong(userId, deviceId);
if (hasPendingPayment) {
  return { isFree: true, reason: 'individual_payment_confirmed' };
}
```

## 4. Mudanças Necessárias no Código

### 4.1 Arquivo: `api/lib/paywall-utils.ts`

#### Remover Função
```typescript
// REMOVER completamente:
export async function hasUnlimitedAccess(
  userId: string | null,
  deviceIds: string[]
): Promise<boolean> {
  // ... implementação atual
}
```

#### Adicionar Nova Função
```typescript
// ADICIONAR:
export async function checkIndividualPayment(
  userId: string | null,
  deviceId: string,
  songNumber: number
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  
  // Verificar se há pagamento confirmado para esta música específica
  const { data, error } = await supabase
    .from('individual_song_payments')
    .select('*')
    .eq('user_id', userId)
    .eq('device_id', deviceId)
    .eq('song_number', songNumber)
    .eq('status', 'confirmed')
    .single();
    
  return !error && data;
}
```

### 4.2 Arquivo: `api/routes/paywall.ts`

#### Modificar Endpoint `/creation-status`
```typescript
// ANTES:
const hasUnlimited = await hasUnlimitedAccess(userId, deviceIds);
if (hasUnlimited) {
  return res.json({ isFree: true, reason: 'premium_access' });
}

// DEPOIS:
const nextSongNumber = (foundUser.freesongsused || 0) + 1;
if (nextSongNumber === 1) {
  // Primeira música sempre gratuita
  return res.json({ isFree: true, reason: 'free_quota' });
}

// Verificar pagamento individual para próxima música
const hasIndividualPayment = await checkIndividualPayment(
  userId, 
  deviceId, 
  nextSongNumber
);

if (hasIndividualPayment) {
  return res.json({ isFree: true, reason: 'individual_payment' });
}

// Requer pagamento
return res.json({ 
  isFree: false, 
  reason: 'payment_required',
  songNumber: nextSongNumber,
  amount: INDIVIDUAL_SONG_PRICE
});
```

### 4.3 Arquivo: `api/routes/generate-preview.ts`

#### Modificar Lógica de Verificação
```typescript
// ANTES:
const hasUnlimited = await hasUnlimitedAccess(userId, deviceIds);
if (!hasUnlimited && freesongsused >= FREE_SONG_LIMIT) {
  return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
}

// DEPOIS:
const nextSongNumber = (freesongsused || 0) + 1;

if (nextSongNumber === 1) {
  // Primeira música gratuita - prosseguir
} else {
  // Verificar pagamento individual
  const hasPayment = await checkIndividualPayment(userId, deviceId, nextSongNumber);
  if (!hasPayment) {
    return res.status(402).json({ 
      error: 'INDIVIDUAL_PAYMENT_REQUIRED',
      songNumber: nextSongNumber
    });
  }
}
```

## 5. Mudanças no Banco de Dados

### 5.1 Nova Tabela: `individual_song_payments`

```sql
CREATE TABLE individual_song_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  device_id TEXT NOT NULL,
  song_number INTEGER NOT NULL,
  payment_intent_id VARCHAR NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR DEFAULT 'brl',
  status VARCHAR NOT NULL, -- 'pending', 'confirmed', 'failed'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  UNIQUE(user_id, device_id, song_number),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_individual_payments_user_device ON individual_song_payments(user_id, device_id);
CREATE INDEX idx_individual_payments_status ON individual_song_payments(status);
CREATE INDEX idx_individual_payments_song_number ON individual_song_payments(song_number);
```

### 5.2 Migração de Dados Existentes

```sql
-- Migração: usuários premium existentes
-- Opção 1: Manter acesso premium por tempo limitado
ALTER TABLE user_creations ADD COLUMN premium_expires_at TIMESTAMPTZ;

-- Definir data de expiração para usuários premium atuais (ex: 30 dias)
UPDATE user_creations 
SET premium_expires_at = NOW() + INTERVAL '30 days'
WHERE device_id IN (
  SELECT DISTINCT metadata->>'deviceId' 
  FROM stripe_transactions 
  WHERE status = 'succeeded'
);
```

### 5.3 Modificação da Tabela `stripe_transactions`

```sql
-- Adicionar campo para identificar tipo de pagamento
ALTER TABLE stripe_transactions 
ADD COLUMN payment_type VARCHAR DEFAULT 'premium'; -- 'premium' ou 'individual_song'

ALTER TABLE stripe_transactions 
ADD COLUMN song_number INTEGER; -- Para pagamentos individuais
```

## 6. Modificações no Fluxo de Pagamento

### 6.1 Novo Endpoint: Pagamento Individual

```typescript
// api/routes/stripe.ts
router.post('/create-individual-payment', async (req, res) => {
  const { userId, deviceId, songNumber } = req.body;
  
  // Validar se realmente precisa de pagamento
  const needsPayment = await validateIndividualPaymentNeeded(userId, deviceId, songNumber);
  if (!needsPayment) {
    return res.status(400).json({ error: 'Payment not required' });
  }
  
  // Criar Payment Intent para música individual
  const paymentIntent = await stripe.paymentIntents.create({
    amount: INDIVIDUAL_SONG_PRICE, // Ex: 500 centavos = R$ 5,00
    currency: 'brl',
    payment_method_types: ['card', 'boleto', 'pix'],
    metadata: {
      userId: userId || 'guest',
      deviceId,
      songNumber,
      paymentType: 'individual_song'
    }
  });
  
  // Salvar na nova tabela
  await supabase.from('individual_song_payments').insert({
    user_id: userId,
    device_id: deviceId,
    song_number: songNumber,
    payment_intent_id: paymentIntent.id,
    amount: INDIVIDUAL_SONG_PRICE,
    status: 'pending'
  });
  
  res.json({ 
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  });
});
```

### 6.2 Modificação do Webhook

```typescript
// api/routes/stripe.ts - webhook handler
case 'payment_intent.succeeded':
  const paymentIntent = event.data.object;
  const paymentType = paymentIntent.metadata.paymentType;
  
  if (paymentType === 'individual_song') {
    // Confirmar pagamento individual
    await supabase
      .from('individual_song_payments')
      .update({ status: 'confirmed' })
      .eq('payment_intent_id', paymentIntent.id);
      
    // Liberar criação da música específica
    await liberateIndividualSongCreation(
      paymentIntent.metadata.userId,
      paymentIntent.metadata.deviceId,
      paymentIntent.metadata.songNumber
    );
  } else {
    // Lógica antiga para pagamentos premium (manter temporariamente)
    await handleLegacyPremiumPayment(paymentIntent);
  }
  break;
```

## 7. Impactos na UI/UX

### 7.1 Modal de Paywall

#### Mudanças no `PaymentModal.tsx`
```typescript
// Antes: "Upgrade para Premium - Acesso Ilimitado"
// Depois: "Pagar por esta música - R$ 5,00"

const PaymentModal = ({ songNumber, onConfirm }) => {
  return (
    <div className="payment-modal">
      <h2>Criar Nova Música</h2>
      <p>Esta será sua música #{songNumber}</p>
      <p>Valor: R$ 5,00</p>
      <p>Após o pagamento, você poderá criar esta música.</p>
      <p>Para a próxima música, será necessário um novo pagamento.</p>
      
      <StripePaymentForm 
        amount={500} // R$ 5,00
        paymentType="individual_song"
        songNumber={songNumber}
        onSuccess={onConfirm}
      />
    </div>
  );
};
```

### 7.2 Indicadores na Interface

```typescript
// Componente para mostrar status de pagamento
const SongPaymentStatus = ({ songNumber, isPaid }) => {
  return (
    <div className="song-status">
      <span>Música #{songNumber}</span>
      {isPaid ? (
        <span className="paid">✓ Paga</span>
      ) : (
        <span className="unpaid">Requer pagamento</span>
      )}
    </div>
  );
};
```

### 7.3 Histórico de Músicas

```typescript
// Mostrar histórico com status de pagamento
const MusicHistory = () => {
  const [songs, setSongs] = useState([]);
  
  useEffect(() => {
    // Buscar músicas com status de pagamento
    fetchSongsWithPaymentStatus();
  }, []);
  
  return (
    <div className="music-history">
      <h3>Suas Músicas</h3>
      {songs.map((song, index) => (
        <div key={song.id} className="song-item">
          <span>Música #{index + 1}</span>
          <span>{song.title}</span>
          {index === 0 ? (
            <span className="free">Gratuita</span>
          ) : (
            <span className={song.isPaid ? 'paid' : 'unpaid'}>
              {song.isPaid ? 'R$ 5,00 - Paga' : 'Requer pagamento'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
```

## 8. Configurações e Constantes

### 8.1 Novas Constantes

```typescript
// api/config/constants.ts
export const INDIVIDUAL_SONG_PRICE = 500; // R$ 5,00 em centavos
export const FREE_SONG_LIMIT = 1; // Manter como está
export const PAYMENT_TYPES = {
  PREMIUM: 'premium', // Legado
  INDIVIDUAL_SONG: 'individual_song'
} as const;
```

### 8.2 Variáveis de Ambiente

```env
# .env
INDIVIDUAL_SONG_PRICE=500
LEGACY_PREMIUM_SUPPORT=true # Para manter compatibilidade temporária
PREMIUM_MIGRATION_DEADLINE=2024-12-31 # Data limite para migração
```

## 9. Plano de Implementação

### 9.1 Fase 1: Preparação (Semana 1)

#### Critérios de Aceite:
- [ ] Nova tabela `individual_song_payments` criada
- [ ] Migração de dados existentes executada
- [ ] Constantes e configurações definidas
- [ ] Testes unitários para novas funções

#### Tarefas:
1. Criar migração SQL para nova tabela
2. Executar migração em ambiente de desenvolvimento
3. Implementar função `checkIndividualPayment()`
4. Criar testes para nova lógica
5. Configurar variáveis de ambiente

### 9.2 Fase 2: Backend Core (Semana 2)

#### Critérios de Aceite:
- [ ] Endpoint `/creation-status` modificado
- [ ] Lógica de `generate-preview` atualizada
- [ ] Novo endpoint para pagamento individual
- [ ] Webhook atualizado para pagamentos individuais
- [ ] Função `hasUnlimitedAccess()` removida

#### Tarefas:
1. Modificar `api/routes/paywall.ts`
2. Atualizar `api/routes/generate-preview.ts`
3. Implementar endpoint de pagamento individual
4. Atualizar webhook handler
5. Remover código legado (com feature flag)
6. Testes de integração

### 9.3 Fase 3: Frontend (Semana 3)

#### Critérios de Aceite:
- [ ] Modal de paywall atualizado
- [ ] Interface mostra preço por música
- [ ] Histórico de músicas com status de pagamento
- [ ] Fluxo de pagamento individual funcional
- [ ] Mensagens de erro apropriadas

#### Tarefas:
1. Atualizar `PaymentModal.tsx`
2. Modificar textos e traduções
3. Implementar componente de status de pagamento
4. Atualizar histórico de músicas
5. Testes E2E do fluxo completo

### 9.4 Fase 4: Migração e Limpeza (Semana 4)

#### Critérios de Aceite:
- [ ] Usuários premium migrados com sucesso
- [ ] Sistema funcionando em produção
- [ ] Código legado removido
- [ ] Documentação atualizada
- [ ] Monitoramento implementado

#### Tarefas:
1. Executar migração em produção
2. Monitorar comportamento do sistema
3. Remover código legado após período de transição
4. Atualizar documentação da API
5. Implementar métricas de negócio

## 10. Riscos e Mitigações

### 10.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|----------|
| Perda de dados na migração | Baixa | Alto | Backup completo + testes em staging |
| Quebra do fluxo de pagamento | Média | Alto | Feature flags + rollback plan |
| Performance degradada | Baixa | Médio | Índices otimizados + cache |

### 10.2 Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|----------|
| Resistência dos usuários | Alta | Alto | Comunicação clara + período de transição |
| Queda na receita | Média | Alto | Análise de pricing + ajustes |
| Aumento do churn | Média | Médio | Monitoramento + suporte ativo |

## 11. Métricas de Sucesso

### 11.1 Métricas Técnicas
- Tempo de resposta da API < 200ms
- Taxa de erro < 1%
- Disponibilidade > 99.9%
- Taxa de sucesso de pagamentos > 95%

### 11.2 Métricas de Negócio
- Receita por usuário (ARPU)
- Taxa de conversão de pagamento
- Número de músicas criadas por usuário
- Taxa de retenção de usuários

## 12. Rollback Plan

### 12.1 Cenários de Rollback
1. **Falha crítica no pagamento:** Reverter para lógica premium
2. **Perda de dados:** Restaurar backup + reverter migração
3. **Performance inaceitável:** Desabilitar nova lógica via feature flag

### 12.2 Procedimento de Rollback
```bash
# 1. Ativar feature flag de emergência
echo "ENABLE_LEGACY_PREMIUM=true" >> .env

# 2. Reverter migração se necessário
psql -d database -f rollback_individual_payments.sql

# 3. Deploy da versão anterior
git checkout previous-stable-version
npm run deploy
```

## 13. Considerações Finais

Esta modificação representa uma mudança fundamental no modelo de negócio da plataforma, passando de um modelo de assinatura premium para um modelo de pagamento por uso. A implementação deve ser cuidadosa, com testes extensivos e um plano de rollback robusto.

O sucesso da implementação dependerá de:
1. **Comunicação clara** com os usuários sobre a mudança
2. **Implementação gradual** com feature flags
3. **Monitoramento constante** das métricas de negócio
4. **Suporte ativo** durante o período de transição

A nova arquitetura oferece maior flexibilidade e potencial de receita, mas requer cuidado na execução para manter a satisfação dos usuários existentes.