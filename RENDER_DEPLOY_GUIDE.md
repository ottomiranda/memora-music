# Guia de Deploy no Render.com - Memora Music

## Visão Geral

Este guia fornece instruções detalhadas para fazer deploy da plataforma Memora Music no Render.com usando o arquivo `render.yaml` configurado.

## Pré-requisitos

1. Conta no Render.com
2. Repositório Git conectado ao Render
3. Variáveis de ambiente configuradas

## Estrutura do Deploy

O projeto será deployado com dois serviços:
- **Backend**: Node.js/Express na porta 3337
- **Frontend**: React/Vite servindo arquivos estáticos

## Variáveis de Ambiente Obrigatórias

### Backend Service (memora-music-backend)

#### Configurações Básicas
```
NODE_ENV=production
PORT=3337
```

#### Supabase (Obrigatório)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Stripe (Obrigatório para pagamentos)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### OpenAI (Obrigatório para IA)
```
OPENAI_API_KEY=sk-...
```

#### URL do Frontend (Configurado automaticamente)
```
FRONTEND_PROD_URL=[URL do serviço frontend no Render]
```

### Frontend Service (memora-music-frontend)

#### Configurações Básicas
```
NODE_ENV=production
```

#### API Backend (Configurado automaticamente)
```
VITE_API_URL=[URL do serviço backend no Render]
```

#### Supabase Frontend
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Stripe Frontend
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Passos para Deploy

### 1. Preparar o Repositório

1. Certifique-se de que o arquivo `render.yaml` está na raiz do projeto
2. Commit e push das alterações para o repositório Git

### 2. Conectar ao Render.com

1. Acesse [Render.com](https://render.com)
2. Faça login na sua conta
3. Clique em "New" > "Blueprint"
4. Conecte seu repositório Git
5. Selecione o repositório do Memora Music

### 3. Configurar Variáveis de Ambiente

1. No dashboard do Render, acesse cada serviço criado
2. Vá para "Environment" 
3. Adicione todas as variáveis listadas acima
4. **IMPORTANTE**: Use valores reais, não placeholders

### 4. Configurar Domínio Personalizado

1. No serviço backend, vá para "Settings" > "Custom Domains"
2. Adicione o domínio `memora.music`
3. Configure os registros DNS conforme instruções do Render

### 5. Deploy

1. O deploy será iniciado automaticamente após a configuração
2. Monitore os logs de build em cada serviço
3. Verifique se ambos os serviços estão "Live"

## Verificação Pós-Deploy

### Health Check
Acesse: `https://memora.music/api/health`

Resposta esperada:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "environment": "production"
}
```

### Teste de Funcionalidades
1. Acesse o frontend em `https://memora.music`
2. Teste o login/registro
3. Teste a geração de música
4. Verifique os pagamentos (se aplicável)

## Comandos de Build

### Backend
```bash
npm install && npm run build
```

### Frontend
```bash
npm install && npm run build
```

## Comandos de Start

### Backend
```bash
npm run server:dev
```

### Frontend
```bash
npm run preview
```

## Troubleshooting

### Erro de CORS
- Verifique se `FRONTEND_PROD_URL` está configurado corretamente no backend
- Confirme que o domínio está correto

### Erro de Conexão com Supabase
- Verifique as credenciais do Supabase
- Confirme que o projeto Supabase está ativo

### Erro de Build
- Verifique os logs de build no Render
- Confirme que todas as dependências estão no `package.json`

### Erro de Variáveis de Ambiente
- Use o endpoint `/api/health` para verificar quais variáveis estão faltando
- Confirme que não há espaços ou caracteres especiais nas variáveis

## Monitoramento

- Use os logs do Render para monitorar erros
- Configure alertas para downtime
- Monitore o uso de recursos (CPU, memória)

## Backup e Rollback

- O Render mantém histórico de deploys
- Para rollback, acesse "Deploys" e selecione uma versão anterior
- Mantenha backups regulares do banco Supabase

## Custos Estimados

- **Starter Plan**: $7/mês por serviço
- **Total**: ~$14/mês para backend + frontend
- **Database**: Adicional se usar PostgreSQL do Render

## Suporte

- Documentação oficial: [Render Docs](https://render.com/docs)
- Suporte: [Render Support](https://render.com/support)
- Comunidade: [Render Community](https://community.render.com)