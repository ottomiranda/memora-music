# Configuração de Ambientes GitHub

Este documento descreve como configurar os ambientes GitHub para o projeto Memora Music, incluindo variáveis de ambiente, secrets e políticas de proteção.

## 📋 Ambientes Necessários

### 1. Development
- **Nome**: `development`
- **Branch**: `develop`
- **URL**: Local development server
- **Proteção**: Nenhuma (deploy automático)

### 2. Production
- **Nome**: `production`
- **Branch**: `main`
- **URL**: http://localhost:3000
- **Proteção**: Requer aprovação de revisores

## 🔧 Configuração dos Ambientes

### Passo 1: Criar Ambientes no GitHub

1. Vá para **Settings** → **Environments** no repositório
2. Clique em **New environment**
3. Crie os ambientes `development` e `production`

### Passo 2: Configurar Proteções

#### Environment: production
- ✅ **Required reviewers**: Adicione pelo menos 1 revisor
- ✅ **Wait timer**: 0 minutos
- ✅ **Deployment branches**: Selected branches → `main`

#### Environment: development
- ❌ **Required reviewers**: Não necessário
- ❌ **Wait timer**: Não necessário
- ✅ **Deployment branches**: Selected branches → `develop`

## 🔐 Secrets e Variáveis

### Secrets Globais (Repository level)

Estes secrets são compartilhados entre todos os ambientes:

```bash
# Vercel (removed - integration no longer used)
# VERCEL_TOKEN=your_vercel_token
# VERCEL_ORG_ID=your_vercel_org_id
# VERCEL_PROJECT_ID=your_vercel_project_id

# Supabase
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret

# OAuth Providers
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_SECRET=your_github_client_secret
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Email
SMTP_PASSWORD=your_smtp_password

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Environment: development

#### Secrets
```bash
SUPABASE_URL=your_dev_supabase_url
SUPABASE_ANON_KEY=your_dev_supabase_anon_key
NEXTAUTH_URL=http://localhost:3000
```

#### Variables
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Memora Music (Dev)
DEBUG=true
ENABLE_API_DOCS=true
FEATURE_ADVANCED_ANALYTICS=false
```

### Environment: production

#### Secrets
```bash
SUPABASE_URL=your_prod_supabase_url
SUPABASE_ANON_KEY=your_prod_supabase_anon_key
NEXTAUTH_URL=http://localhost:3000
```

#### Variables
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Memora Music
DEBUG=false
ENABLE_API_DOCS=false
FEATURE_ADVANCED_ANALYTICS=true
ENABLE_SECURITY_HEADERS=true
```

## 🚀 Como Configurar

### 1. Obter Tokens do Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Obter informações do projeto
vercel project ls
vercel teams ls
```

### 2. Configurar Secrets no GitHub

1. Vá para **Settings** → **Secrets and variables** → **Actions**
2. Adicione os secrets globais na aba **Repository secrets**
3. Para cada ambiente:
   - Vá para **Settings** → **Environments**
   - Selecione o ambiente
   - Adicione secrets específicos em **Environment secrets**
   - Adicione variáveis em **Environment variables**

### 3. Configurar Supabase

#### Desenvolvimento
```bash
# Criar projeto de desenvolvimento no Supabase
# Configurar RLS e políticas
# Obter URL e chaves
```

#### Produção
```bash
# Usar projeto existente ou criar novo
# Configurar RLS e políticas
# Obter URL e chaves
```

## 📊 Monitoramento

### Variáveis de Monitoramento

```bash
# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=your_public_sentry_dsn

# Performance Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

## 🔄 Fluxo de Deploy

### Development
1. Push para branch `develop`
2. GitHub Actions executa testes
3. Deploy automático para ambiente de desenvolvimento
4. URL de preview disponível

### Production
1. Merge para branch `main`
2. GitHub Actions executa testes completos
3. Aguarda aprovação de revisor
4. Deploy para produção após aprovação

## 🛡️ Segurança

### Boas Práticas

1. **Separação de Ambientes**
   - Use projetos Supabase separados
   - Use diferentes OAuth apps
   - Use diferentes chaves de API

2. **Rotação de Secrets**
   - Rotacione secrets regularmente
   - Use secrets temporários quando possível
   - Monitore uso de secrets

3. **Acesso Restrito**
   - Limite acesso aos ambientes
   - Use princípio do menor privilégio
   - Audite acessos regularmente

## 🔍 Troubleshooting

### Problemas Comuns

1. **Deploy falha com erro de autenticação**
   - Verifique se `VERCEL_TOKEN` está correto
   - Verifique se `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` estão corretos

2. **Aplicação não conecta com Supabase**
   - Verifique se `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretos
   - Verifique se as políticas RLS estão configuradas

3. **OAuth não funciona**
   - Verifique se `NEXTAUTH_URL` está correto
   - Verifique se os secrets OAuth estão corretos
   - Verifique se as URLs de callback estão configuradas

### Logs e Debugging

```bash
# Ver logs do Vercel
vercel logs your-deployment-url

# Ver logs do GitHub Actions
# Vá para Actions tab no GitHub

# Debug local
DEBUG=true npm run dev
```

## 📚 Recursos Adicionais

- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Setup](https://supabase.com/docs/guides/cli/managing-environments)
- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)