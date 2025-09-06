# API de Pagamentos Stripe

Esta documentação descreve os endpoints da API de pagamentos integrados com o Stripe.

## Configuração

Antes de usar a API, certifique-se de que as seguintes variáveis de ambiente estão configuradas:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Endpoints

### 1. Criar Payment Intent

**POST** `/api/stripe/create-payment-intent`

Cria um novo Payment Intent no Stripe para processar um pagamento.

#### Request Body

```json
{
  "amount": 2000,
  "currency": "brl",
  "userId": "user_123"
}
```

#### Parâmetros

- `amount` (number, obrigatório): Valor em centavos (ex: 2000 = R$ 20,00)
- `currency` (string, obrigatório): Código da moeda ("brl", "usd", etc.)
- `userId` (string, obrigatório): ID do usuário que está fazendo o pagamento

#### Validações

- Valor mínimo: R$ 1,00 (100 centavos)
- Valor máximo: R$ 10.000,00 (1.000.000 centavos)
- Moedas suportadas: BRL, USD, EUR

#### Response (200 OK)

```json
{
  "success": true,
  "clientSecret": "pi_1234567890_secret_abcdef",
  "paymentIntentId": "pi_1234567890",
  "transactionId": "txn_uuid_123"
}
```

#### Códigos de Erro

- **400 Bad Request**: Dados inválidos
- **429 Too Many Requests**: Rate limiting ativado
- **500 Internal Server Error**: Erro interno do servidor

### 2. Confirmar Pagamento

**POST** `/api/stripe/confirm-payment`

Confirma um pagamento existente usando o Payment Intent ID.

#### Request Body

```json
{
  "paymentIntentId": "pi_1234567890",
  "paymentMethodId": "pm_1234567890"
}
```

#### Parâmetros

- `paymentIntentId` (string, obrigatório): ID do Payment Intent criado anteriormente
- `paymentMethodId` (string, obrigatório): ID do método de pagamento do Stripe

#### Response (200 OK)

```json
{
  "success": true,
  "status": "succeeded",
  "paymentIntentId": "pi_1234567890"
}
```

#### Códigos de Erro

- **400 Bad Request**: Payment Intent ID inválido
- **402 Payment Required**: Pagamento falhou
- **429 Too Many Requests**: Rate limiting ativado
- **500 Internal Server Error**: Erro interno do servidor

### 3. Webhook do Stripe

**POST** `/api/stripe/webhook`

Endpoint para receber eventos do Stripe via webhook.

#### Headers Obrigatórios

- `stripe-signature`: Assinatura do webhook para verificação de segurança

#### Eventos Suportados

- `payment_intent.succeeded`: Pagamento confirmado com sucesso
- `payment_intent.payment_failed`: Falha no pagamento

#### Response (200 OK)

```json
{
  "received": true
}
```

#### Códigos de Erro

- **400 Bad Request**: Assinatura inválida ou evento não suportado
- **500 Internal Server Error**: Erro interno do servidor

## Rate Limiting

Todos os endpoints têm rate limiting aplicado:

- **Limite**: 10 requisições por minuto por IP
- **Janela**: 15 minutos de bloqueio após exceder o limite
- **Response**: HTTP 429 com mensagem "Muitas tentativas de pagamento. Tente novamente em 15 minutos."

## Segurança

### Validação de Webhook

Todos os webhooks são validados usando a assinatura do Stripe:

```javascript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
```

### Validação de Entrada

Todos os dados de entrada são validados usando Zod:

- Tipos de dados corretos
- Valores dentro dos limites permitidos
- Campos obrigatórios presentes

## Integração com Supabase

Todas as transações são registradas na tabela `stripe_transactions`:

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

## Exemplos de Uso

### Fluxo Completo de Pagamento

1. **Criar Payment Intent**:
```bash
curl -X POST http://localhost:3000/api/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2000,
    "currency": "brl",
    "userId": "user_123"
  }'
```

2. **Confirmar Pagamento** (no frontend com Stripe Elements):
```javascript
const {error} = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: 'https://your-website.com/return'
  }
});
```

3. **Webhook será chamado automaticamente** quando o pagamento for processado.

## Tratamento de Erros

### Estrutura de Erro Padrão

```json
{
  "success": false,
  "message": "Descrição do erro",
  "error": "Detalhes técnicos (apenas em desenvolvimento)"
}
```

### Códigos de Status HTTP

- **200**: Sucesso
- **400**: Dados inválidos ou requisição malformada
- **402**: Pagamento necessário (falha no processamento)
- **429**: Rate limiting ativado
- **500**: Erro interno do servidor

## Monitoramento

Todos os endpoints geram logs estruturados para monitoramento:

- Requisições recebidas
- Validações falhadas
- Erros do Stripe
- Rate limiting ativado
- Webhooks processados

## Ambiente de Desenvolvimento

Para testar a integração:

1. Use as chaves de teste do Stripe (começam com `sk_test_` e `pk_test_`)
2. Configure o webhook endpoint no Dashboard do Stripe
3. Use cartões de teste do Stripe para simular pagamentos

### Cartões de Teste

- **Sucesso**: `4242424242424242`
- **Falha**: `4000000000000002`
- **3D Secure**: `4000002500003155`

Para mais informações, consulte a [documentação oficial do Stripe](https://stripe.com/docs).