# Guia Completo do Stripe CLI para macOS

Este guia fornece instruções detalhadas para instalar e usar o Stripe CLI no macOS para testar webhooks localmente durante o desenvolvimento.

## 📋 Índice

1. [Instalação do Stripe CLI](#instalação-do-stripe-cli)
2. [Configuração Inicial](#configuração-inicial)
3. [Testando Webhooks Localmente](#testando-webhooks-localmente)
4. [Comandos Úteis](#comandos-úteis)
5. [Troubleshooting](#troubleshooting)
6. [Configuração do Projeto](#configuração-do-projeto)

## 🚀 Instalação do Stripe CLI

### Método 1: Homebrew (Recomendado)

O Homebrew é a forma mais simples e recomendada para instalar o Stripe CLI no macOS:

```bash
# Instalar o Stripe CLI via Homebrew
brew install stripe/stripe-cli/stripe

# Verificar a instalação
stripe --version
```

### Método 2: Download Manual do GitHub

Caso prefira instalar manualmente ou não tenha o Homebrew:

1. Acesse a página de releases: https://github.com/stripe/stripe-cli/releases
2. Baixe o arquivo para macOS (ex: `stripe_X.X.X_mac-os_x86_64.tar.gz`)
3. Extraia o arquivo:
   ```bash
   tar -xvf stripe_X.X.X_mac-os_x86_64.tar.gz
   ```
4. Mova o executável para um diretório no PATH:
   ```bash
   sudo mv stripe /usr/local/bin/
   ```
5. Verifique a instalação:
   ```bash
   stripe --version
   ```

## 🔐 Configuração Inicial

### 1. Login no Stripe CLI

Após a instalação, faça login na sua conta Stripe:

```bash
# Fazer login (abrirá o navegador para autenticação)
stripe login
```

Este comando:
- Abrirá seu navegador padrão
- Redirecionará para o dashboard do Stripe
- Solicitará permissão para conectar o CLI
- Configurará automaticamente as credenciais

### 2. Verificar Configuração

```bash
# Verificar se está logado corretamente
stripe config --list

# Testar conexão com a API
stripe balance retrieve
```

## 🎯 Testando Webhooks Localmente

### 1. Iniciar o Listener de Webhooks

O comando `stripe listen` substitui a necessidade de configurar webhooks manualmente no dashboard durante o desenvolvimento:

```bash
# Escutar webhooks e encaminhar para endpoint local
stripe listen --forward-to localhost:3003/api/stripe/webhook
```

**Importante:** Este comando deve permanecer rodando em um terminal separado durante todo o desenvolvimento.

### 2. Obter o Webhook Secret Temporário

Quando você executa `stripe listen`, o CLI gera um webhook secret temporário:

```bash
# O output será algo como:
# > Ready! Your webhook signing secret is whsec_1234567890abcdef...
# > 2024-01-15 10:30:00   --> charge.succeeded [evt_1234567890]
```

**Configure este secret no seu arquivo `.env`:**

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### 3. Configurar o Endpoint Local

Certifique-se de que sua aplicação está rodando na porta especificada (3003 no exemplo) e que o endpoint `/api/stripe/webhook` está implementado corretamente.

## 🧪 Testando Eventos de Pagamento

### Simular Eventos Específicos

```bash
# Simular pagamento bem-sucedido
stripe trigger payment_intent.succeeded

# Simular pagamento falhado
stripe trigger payment_intent.payment_failed

# Simular criação de customer
stripe trigger customer.created

# Simular atualização de subscription
stripe trigger customer.subscription.updated
```

### Eventos Disponíveis

Para ver todos os eventos que podem ser simulados:

```bash
stripe trigger --help
```

### Testar com Dados Específicos

```bash
# Criar um Payment Intent e simular sucesso
stripe payment_intents create \
  --amount=2000 \
  --currency=brl \
  --payment-method-types[]=card

# Usar o ID retornado para confirmar
stripe payment_intents confirm pi_1234567890 \
  --payment-method=pm_card_visa
```

## 🛠 Comandos Úteis para Debug

### Monitoramento de Logs

```bash
# Escutar webhooks com logs detalhados
stripe listen --forward-to localhost:3003/api/stripe/webhook --print-json

# Filtrar apenas eventos específicos
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed \
  --forward-to localhost:3003/api/stripe/webhook
```

### Verificação de Configuração

```bash
# Listar configurações atuais
stripe config --list

# Verificar status da conta
stripe balance retrieve

# Listar produtos disponíveis
stripe products list

# Listar preços configurados
stripe prices list
```

### Logs e Eventos

```bash
# Ver eventos recentes no Stripe
stripe events list --limit=10

# Ver detalhes de um evento específico
stripe events retrieve evt_1234567890

# Ver logs de requests da API
stripe logs tail
```

## 🔧 Configuração do Projeto

### Variáveis de Ambiente Necessárias

Configure estas variáveis no seu arquivo `.env`:

```env
# Chaves do Stripe (obtidas no dashboard)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Webhook secret (obtido do stripe listen)
STRIPE_WEBHOOK_SECRET=whsec_...

# URL do frontend para redirects
FRONTEND_URL=http://localhost:5173
```

### Implementação do Webhook

Certifique-se de que seu endpoint de webhook está configurado corretamente:

```typescript
// Exemplo de implementação
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.post('/api/stripe/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Processar o evento
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Lógica para pagamento bem-sucedido
      break;
    case 'payment_intent.payment_failed':
      // Lógica para pagamento falhado
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro 400 nos Webhooks

**Problema:** Webhooks retornam erro 400

**Soluções:**
- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
- Certifique-se de usar `express.raw()` para o endpoint do webhook
- Confirme que o endpoint está acessível na porta especificada

#### 2. Signature Verification Failed

**Problema:** Erro de verificação de assinatura

**Soluções:**
- Use o webhook secret gerado pelo `stripe listen`
- Certifique-se de que o body do request não foi parseado como JSON
- Verifique se está usando o header `stripe-signature` correto

#### 3. Connection Refused

**Problema:** Stripe CLI não consegue conectar ao endpoint local

**Soluções:**
- Verifique se sua aplicação está rodando na porta correta
- Confirme se o endpoint `/api/stripe/webhook` existe
- Teste o endpoint manualmente com curl

### Comandos de Diagnóstico

```bash
# Testar conectividade
curl -X POST http://localhost:3003/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Verificar se a porta está em uso
lsof -i :3003

# Ver logs detalhados do Stripe CLI
stripe listen --forward-to localhost:3003/api/stripe/webhook --log-level debug
```

## 📚 Recursos Adicionais

- **Documentação Oficial:** https://docs.stripe.com/stripe-cli
- **Webhooks Guide:** https://docs.stripe.com/webhooks
- **Testing Guide:** https://docs.stripe.com/testing
- **GitHub Repository:** https://github.com/stripe/stripe-cli

## 🎯 Vantagens do Stripe CLI

1. **Desenvolvimento Local:** Teste webhooks sem expor sua aplicação à internet
2. **Eventos Simulados:** Trigger eventos específicos para testar cenários
3. **Debug Facilitado:** Logs detalhados de todos os eventos
4. **Configuração Simples:** Não precisa configurar webhooks no dashboard
5. **Ambiente Isolado:** Testes não afetam dados de produção

---

**Nota:** Este guia substitui a necessidade de configurar webhooks manualmente no dashboard do Stripe durante o desenvolvimento. O Stripe CLI fornece uma forma mais eficiente e segura de testar integrações de pagamento localmente.