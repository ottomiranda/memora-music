# Memora Music 🎵

Uma aplicação moderna para descoberta e compartilhamento de música, construída com React, Vite, Express e integrada com serviços como Last.fm e YouTube.

## 🚀 Stack Tecnológica

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Radix UI** para componentes acessíveis
- **Zustand** para gerenciamento de estado
- **TanStack Query** para cache e sincronização de dados

### Backend
- **Express.js** com TypeScript
- **Supabase** para banco de dados e autenticação
- **Multer** para upload de arquivos
- **CORS** e middlewares de segurança

### DevOps & CI/CD
- **GitHub Actions** para CI/CD
- **Vercel** para deploy
- **Turbo** para monorepo
- **ESLint** e **Prettier** para qualidade de código
- **Dependabot** para atualizações de segurança

## 📋 Pré-requisitos

- Node.js 18+ (recomendado: 20 LTS)
- npm ou pnpm
- Conta no Supabase
- Conta no Vercel (para deploy)
- API keys do Last.fm e YouTube (opcional)

## 🛠️ Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/memora.music.git
cd memora.music
```

### 2. Instale as dependências
```bash
npm install
# ou
pnpm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Aplicação
NODE_ENV=development
PORT=3001
VITE_API_URL=http://localhost:3001

# Supabase
VITE_SUPABASE_URL=sua_supabase_url
VITE_SUPABASE_ANON_KEY=sua_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_supabase_service_role_key

# APIs Externas (opcional)
LASTFM_API_KEY=sua_lastfm_api_key
YOUTUBE_API_KEY=sua_youtube_api_key
```

### 4. Valide as variáveis de ambiente
```bash
npm run validate-env
```

## 🚀 Desenvolvimento

### Executar em modo de desenvolvimento
```bash
# Frontend e Backend simultaneamente
npm run dev

# Apenas Frontend
npm run client:dev

# Apenas Backend
npm run server:dev
```

### Scripts disponíveis
```bash
# Desenvolvimento
npm run dev              # Inicia frontend e backend
npm run client:dev       # Apenas frontend (Vite)
npm run server:dev       # Apenas backend (Express)

# Build
npm run build           # Build completo
npm run build:legacy    # Build para Vercel
npm run client:build    # Build apenas frontend
npm run server:build    # Build apenas backend

# Qualidade de código
npm run lint            # ESLint
npm run lint:fix        # ESLint com correção automática
npm run format          # Prettier
npm run typecheck       # Verificação de tipos TypeScript
npm run check           # Lint + typecheck + validação de env

# Deploy
npm run deploy          # Deploy para produção
npm run deploy:dev      # Deploy para desenvolvimento
npm run deploy:prod     # Deploy para produção (com validações)
npm run deploy:quick    # Deploy rápido (pula testes)

# Utilitários
npm run validate-env           # Valida variáveis de ambiente
npm run validate-env:prod      # Valida para produção
npm run validate-env:list      # Lista todas as variáveis
```

## 🔄 CI/CD e Deploy

### Ambientes

#### Desenvolvimento
- **Branch**: `develop`, `feature/*`, `hotfix/*`
- **URL**: Preview deployments automáticos
- **Deploy**: Automático em PRs
- **Aprovação**: Não requerida

#### Produção
- **Branch**: `main`, `release/*`
- **URL**: https://memora-music.vercel.app
- **Deploy**: Automático em releases
- **Aprovação**: Requerida (2 revisores)

### Workflows GitHub Actions

#### CI/CD Pipeline (`.github/workflows/ci-cd.yml`)
- ✅ Validação (lint, typecheck, build)
- 🚀 Deploy de preview (PRs)
- 🚀 Deploy de desenvolvimento (branch `develop`)
- 🚀 Deploy de produção (branch `main`)
- 🏷️ Deploy de release (tags)

#### Qualidade e Segurança (`.github/workflows/quality.yml`)
- 🔍 Análise de qualidade (ESLint, dependências)
- 🛡️ Análise de segurança (npm audit, CodeQL)
- 🏗️ Build em múltiplos ambientes
- 📊 Análise de performance do bundle

#### CodeQL Security (`.github/workflows/codeql.yml`)
- 🔒 Análise automática de segurança
- 📅 Execução semanal e em PRs
- 🎯 Foco em JavaScript/TypeScript

### Proteção de Branches

#### Branch `main`
- ✅ Requer 2 aprovações
- ✅ Requer status checks
- ✅ Requer revisão de code owners
- ✅ Histórico linear obrigatório
- ❌ Force push desabilitado

#### Branch `develop`
- ✅ Requer 1 aprovação
- ✅ Requer status checks básicos
- ❌ Force push desabilitado

### Deploy Manual

```bash
# Deploy para desenvolvimento
npm run deploy:dev

# Deploy para produção (com todas as validações)
npm run deploy:prod

# Deploy rápido (pula testes - use com cuidado)
npm run deploy:quick
```

## 🔧 Configuração do GitHub

### 1. Secrets necessários

#### Desenvolvimento
```
# Vercel integration removed
# VERCEL_TOKEN=seu_vercel_token
# VERCEL_ORG_ID=seu_org_id
# VERCEL_PROJECT_ID=seu_project_id
SUPABASE_ACCESS_TOKEN=seu_supabase_token
```

#### Produção (adicionar aos secrets acima)
```
LASTFM_API_KEY=sua_lastfm_api_key
YOUTUBE_API_KEY=sua_youtube_api_key
SENTRY_DSN=seu_sentry_dsn
```

### 2. Configurar ambientes GitHub

1. Vá para **Settings** > **Environments**
2. Crie ambientes `development` e `production`
3. Configure proteções conforme `.github/environments/`

### 3. Configurar proteção de branches

Siga as instruções em `.github/branch-protection.md`

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:coverage

# Testes E2E
npm run test:e2e
```

## 📁 Estrutura do Projeto

```
memora.music/
├── .github/                 # GitHub Actions e templates
│   ├── workflows/          # CI/CD workflows
│   ├── ISSUE_TEMPLATE/     # Templates de issues
│   ├── environments/       # Configurações de ambiente
│   └── CODEOWNERS         # Revisores automáticos
├── api/                    # Backend Express
│   ├── routes/            # Rotas da API
│   ├── middleware/        # Middlewares
│   └── utils/             # Utilitários backend
├── src/                   # Frontend React
│   ├── components/        # Componentes React
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Páginas
│   ├── utils/            # Utilitários frontend
│   └── types/            # Definições TypeScript
├── public/               # Assets estáticos
├── scripts/              # Scripts de automação
├── supabase/            # Configurações Supabase
└── docs/                # Documentação
```

## 🔒 Segurança

### Relatório de Vulnerabilidades
Para relatar vulnerabilidades de segurança, consulte `.github/SECURITY.md`

### Atualizações Automáticas
- **Dependabot** configurado para atualizações semanais
- **CodeQL** para análise de segurança automática
- **npm audit** executado em todos os builds

## 🤝 Contribuição

### Fluxo de Trabalho

1. **Fork** o repositório
2. **Clone** seu fork
3. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
4. **Desenvolva** e **teste** suas mudanças
5. **Commit**: `git commit -m "feat: adiciona nova funcionalidade"`
6. **Push**: `git push origin feature/nova-funcionalidade`
7. **Abra** um Pull Request

### Padrões de Commit
Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
style: formatação, sem mudança de lógica
refactor: refatoração de código
test: adição ou correção de testes
chore: tarefas de manutenção
```

### Code Review
- Todos os PRs precisam de aprovação
- Testes devem passar
- Cobertura de código mantida
- Documentação atualizada quando necessário

## 📊 Monitoramento

### Métricas Disponíveis
- **Performance**: Core Web Vitals
- **Erros**: Sentry (produção)
- **Uptime**: Local monitoring
- **Bundle Size**: Análise automática no CI

### Health Checks
- **Frontend**: `/`
- **Backend**: `/api/health`
- **Database**: Verificação automática

## 🆘 Troubleshooting

### Problemas Comuns

#### Build falha
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar variáveis de ambiente
npm run validate-env
```

#### Erro de CORS
```bash
# Verificar configuração no backend
# Arquivo: api/index.js - configuração CORS
```

#### Deploy falha
```bash
# Verificar logs do servidor
# Verificar configuração do ambiente
# Validar configuração do Express
```

### Logs
```bash
# Logs do desenvolvimento
npm run dev

# Logs do servidor local
npm run server:dev

# Logs do GitHub Actions
# Disponíveis na aba Actions do repositório
```

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/memora.music/issues)
- **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/memora.music/discussions)
- **Documentação**: [Wiki](https://github.com/seu-usuario/memora.music/wiki)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Memora Music** - Criando memórias através da música 🎵