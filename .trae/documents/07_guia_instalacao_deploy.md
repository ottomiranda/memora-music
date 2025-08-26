# Guia de Instalação e Deploy - Memora Music

## 1. Visão Geral

### 1.1 Introdução
Este guia fornece instruções detalhadas para configurar, desenvolver e fazer deploy da aplicação Memora Music. O projeto utiliza uma arquitetura moderna com React no frontend e Express.js no backend, integrado com serviços de IA para geração de música personalizada.

### 1.2 Arquitetura do Sistema
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Serviços      │
│   React/Vite    │◄──►│   Express.js    │◄──►│   Externos      │
│   Port: 5173    │    │   Port: 3001    │    │   OpenAI/Suno   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Vercel      │    │     Vercel      │    │   Supabase      │
│   (Frontend)    │    │   (Backend)     │    │  (Database)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.3 Tecnologias Utilizadas

#### Frontend
- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes UI
- **Zustand** - Gerenciamento de estado
- **React Hook Form** - Formulários
- **React Router DOM** - Roteamento

#### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **Zod** - Validação de schemas
- **OpenAI SDK** - Integração com GPT-4
- **Axios** - Cliente HTTP

#### Serviços Externos
- **OpenAI API** - Geração de letras
- **Suno AI API** - Geração de áudio
- **Supabase** - Banco de dados PostgreSQL
- **Vercel** - Hospedagem e deploy

## 2. Pré-requisitos

### 2.1 Software Necessário

#### Obrigatório
- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (incluído com Node.js)
- **Git** ([Download](https://git-scm.com/))

#### Recomendado
- **VS Code** com extensões:
  - TypeScript and JavaScript Language Features
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint

#### Verificação de Versões
```bash
# Verificar versões instaladas
node --version    # Deve ser >= 18.0.0
npm --version     # Deve ser >= 9.0.0
git --version     # Qualquer versão recente
```

### 2.2 Contas e Chaves de API

#### Obrigatório para Desenvolvimento
1. **OpenAI API Key**
   - Criar conta em [platform.openai.com](https://platform.openai.com/)
   - Gerar API key no dashboard
   - Adicionar créditos (mínimo $5)

2. **Suno AI API Key**
   - Criar conta em [suno.ai](https://suno.ai/)
   - Assinar plano Pro ($10/mês)
   - Obter API key no painel de desenvolvedor

3. **Supabase Project**
   - Criar conta em [supabase.com](https://supabase.com/)
   - Criar novo projeto
   - Obter URL e chave anônima

#### Opcional para Deploy
4. **Vercel Account**
   - Criar conta em [vercel.com](https://vercel.com/)
   - Conectar com GitHub

## 3. Instalação Local

### 3.1 Clone do Repositório

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/memora-music.git
cd memora-music

# Verificar estrutura do projeto
ls -la
# Deve mostrar: src/, api/, public/, package.json, etc.
```

### 3.2 Configuração de Variáveis de Ambiente

#### Frontend (.env)
```bash
# Criar arquivo .env na raiz do projeto
cp .env.example .env

# Editar .env com suas configurações
nano .env
```

**Conteúdo do .env**:
```env
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Development
VITE_DEV_MODE=true

# Analytics (opcional)
VITE_GA_TRACKING_ID=
```

#### Backend (api/.env)
```bash
# Criar arquivo .env na pasta api
cd api
cp .env.example .env
nano .env
```

**Conteúdo do api/.env**:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-key-here

# Suno AI Configuration
SUNO_API_KEY=your-suno-api-key-here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

### 3.3 Instalação de Dependências

#### Frontend
```bash
# Voltar para raiz do projeto
cd ..

# Instalar dependências do frontend
npm install

# Verificar se instalação foi bem-sucedida
npm list --depth=0
```

#### Backend
```bash
# Instalar dependências do backend
cd api
npm install

# Verificar instalação
npm list --depth=0

# Voltar para raiz
cd ..
```

### 3.4 Configuração do Banco de Dados

#### Supabase Setup
1. **Acessar Dashboard do Supabase**
   - Login em [app.supabase.com](https://app.supabase.com/)
   - Selecionar seu projeto

2. **Criar Tabela de Feedback**
```sql
-- Executar no SQL Editor do Supabase
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  would_recommend BOOLEAN NOT NULL,
  willing_to_pay TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_difficulty ON feedback(difficulty);
```

3. **Configurar Políticas RLS (Row Level Security)**
```sql
-- Habilitar RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Permitir inserção para usuários anônimos
CREATE POLICY "Allow anonymous insert" ON feedback
  FOR INSERT TO anon
  WITH CHECK (true);

-- Permitir leitura para usuários autenticados (futuro)
CREATE POLICY "Allow authenticated read" ON feedback
  FOR SELECT TO authenticated
  USING (true);
```

4. **Testar Conexão**
```bash
# Testar conexão com Supabase
cd api
npm run test:db
```

## 4. Desenvolvimento Local

### 4.1 Executar em Modo de Desenvolvimento

#### Opção 1: Executar Separadamente

**Terminal 1 - Backend**:
```bash
cd api
npm run dev

# Deve mostrar:
# Server running on http://localhost:3001
# OpenAI API: Connected
# Supabase: Connected
```

**Terminal 2 - Frontend**:
```bash
# Na raiz do projeto
npm run dev

# Deve mostrar:
# Local:   http://localhost:5173/
# Network: http://192.168.1.x:5173/
```

#### Opção 2: Executar Simultaneamente
```bash
# Na raiz do projeto
npm run dev:all

# Ou usando os scripts disponíveis
npm run client:dev    # Apenas frontend
npm run server:dev    # Apenas backend
npm run turbo:dev     # Ambos com Turbo
```

### 4.2 Verificação da Instalação

#### Testes de Conectividade
```bash
# Testar backend
curl http://localhost:3001/api/health
# Resposta esperada: {"status":"healthy",...}

# Testar frontend
open http://localhost:5173
# Deve abrir a aplicação no navegador
```

#### Testes de Integração
```bash
# Testar geração de letra (apenas)
curl -X POST http://localhost:3001/api/generate-preview \
  -H "Content-Type: application/json" \
  -d '{
    "occasion": "teste",
    "recipientName": "João",
    "relationship": "amigo",
    "senderName": "Maria",
    "genre": "Pop",
    "emotion": "Alegre",
    "vocalPreference": "Masculina",
    "duration": "2-3 minutos",
    "lyricsOnly": true
  }'
```

### 4.3 Scripts de Desenvolvimento

#### Scripts do Frontend (package.json)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "client:dev": "vite",
    "server:dev": "cd api && npm run dev",
    "dev:all": "concurrently \"npm run client:dev\" \"npm run server:dev\"",
    "turbo:dev": "turbo dev"
  }
}
```

#### Scripts do Backend (api/package.json)
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test:db": "tsx src/test-db.ts"
  }
}
```

### 4.4 Estrutura de Desenvolvimento

#### Hot Reload
- **Frontend**: Vite fornece hot reload automático
- **Backend**: tsx watch reinicia automaticamente
- **Tipos**: TypeScript compila incrementalmente

#### Debugging
```bash
# Debug do backend com logs detalhados
DEBUG=memora:* npm run dev

# Debug do frontend
VITE_DEBUG=true npm run dev
```

## 5. Build e Produção

### 5.1 Build Local

#### Frontend
```bash
# Build do frontend
npm run build

# Verificar build
ls -la dist/
# Deve conter: index.html, assets/, etc.

# Testar build localmente
npm run preview
# Abre em http://localhost:4173
```

#### Backend
```bash
# Build do backend
cd api
npm run build

# Verificar build
ls -la dist/
# Deve conter: index.js, routes/, etc.

# Testar build
npm start
```

### 5.2 Otimizações de Build

#### Configuração do Vite (vite.config.ts)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Otimizações de produção
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select']
        }
      }
    },
    // Limite de tamanho de chunk
    chunkSizeWarningLimit: 1000
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
```

## 6. Deploy na Vercel

### 6.1 Preparação para Deploy

#### Configuração do Projeto
1. **Criar vercel.json na raiz**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/index.ts": {
      "maxDuration": 60
    }
  }
}
```

2. **Configurar Scripts de Build**:
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:legacy": "vite build --mode legacy",
    "build:dev": "vite build --mode development"
  }
}
```

### 6.2 Deploy via CLI

#### Instalação da Vercel CLI
```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Login na Vercel
vercel login

# Seguir instruções de autenticação
```

#### Deploy Manual
```bash
# Na raiz do projeto
vercel

# Seguir prompts:
# ? Set up and deploy "~/memora-music"? [Y/n] y
# ? Which scope do you want to deploy to? [seu-usuario]
# ? Link to existing project? [y/N] n
# ? What's your project's name? memora-music
# ? In which directory is your code located? ./

# Deploy de produção
vercel --prod
```

### 6.3 Deploy via GitHub

#### Configuração do Repositório
1. **Push para GitHub**:
```bash
# Adicionar remote (se não existir)
git remote add origin https://github.com/seu-usuario/memora-music.git

# Push inicial
git add .
git commit -m "Initial commit"
git push -u origin main
```

2. **Conectar com Vercel**:
   - Acessar [vercel.com/dashboard](https://vercel.com/dashboard)
   - Clicar em "New Project"
   - Importar repositório do GitHub
   - Configurar variáveis de ambiente

#### Configuração de Variáveis de Ambiente
```bash
# Via CLI
vercel env add OPENAI_API_KEY
vercel env add SUNO_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# Ou via Dashboard da Vercel:
# Settings > Environment Variables
```

**Variáveis Necessárias**:
```
OPENAI_API_KEY=sk-proj-your-key
SUNO_API_KEY=your-suno-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production
CORS_ORIGIN=https://your-domain.vercel.app
```

### 6.4 Configuração de Domínio Customizado

#### Adicionar Domínio
```bash
# Via CLI
vercel domains add seu-dominio.com

# Configurar DNS
# Adicionar CNAME: seu-dominio.com -> cname.vercel-dns.com
```

#### Configuração SSL
- SSL é automático na Vercel
- Certificados Let's Encrypt renovados automaticamente
- HTTPS forçado por padrão

## 7. Configurações Avançadas

### 7.1 Monitoramento e Logs

#### Configuração do Sentry (Opcional)
```bash
# Instalar Sentry
npm install @sentry/react @sentry/node

# Configurar no frontend (src/main.tsx)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
});

# Configurar no backend (api/src/index.ts)
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### Logs Estruturados
```typescript
// api/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export default logger;
```

### 7.2 Performance e Cache

#### Cache de Respostas
```typescript
// api/src/middleware/cache.ts
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutos

export const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    
    next();
  };
};
```

#### Compressão
```typescript
// api/src/app.ts
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));
```

### 7.3 Segurança

#### Rate Limiting
```typescript
// api/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Uso
app.use('/api/generate-preview', createRateLimit(60 * 60 * 1000, 5)); // 5 req/hora
```

#### Headers de Segurança
```typescript
// api/src/middleware/security.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://studio-api.suno.ai"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 8. Troubleshooting

### 8.1 Problemas Comuns de Instalação

#### Erro: "Module not found"
```bash
# Limpar cache do npm
npm cache clean --force

# Deletar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Para o backend também
cd api
rm -rf node_modules package-lock.json
npm install
```

#### Erro: "Port already in use"
```bash
# Encontrar processo usando a porta
lsof -ti:3001

# Matar processo
kill -9 $(lsof -ti:3001)

# Ou usar porta diferente
PORT=3002 npm run dev
```

#### Erro: "Permission denied"
```bash
# Corrigir permissões do npm
sudo chown -R $(whoami) ~/.npm

# Ou usar npx para executar comandos
npx vite
```

### 8.2 Problemas de API

#### OpenAI API Errors
```bash
# Verificar chave da API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Verificar créditos
# Acessar https://platform.openai.com/usage
```

#### Suno AI API Errors
```bash
# Testar conectividade
curl -H "Authorization: Bearer $SUNO_API_KEY" \
  https://studio-api.suno.ai/api/external/generate/
```

#### Supabase Connection Issues
```bash
# Testar conexão
curl "$SUPABASE_URL/rest/v1/feedback?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### 8.3 Problemas de Deploy

#### Build Failures
```bash
# Verificar logs de build
vercel logs

# Build local para debug
npm run build

# Verificar variáveis de ambiente
vercel env ls
```

#### Function Timeouts
```json
// vercel.json - Aumentar timeout
{
  "functions": {
    "api/index.ts": {
      "maxDuration": 300
    }
  }
}
```

#### Memory Issues
```json
// vercel.json - Aumentar memória
{
  "functions": {
    "api/index.ts": {
      "memory": 1024
    }
  }
}
```

## 9. Scripts Úteis

### 9.1 Scripts de Desenvolvimento

#### setup.sh - Configuração Inicial
```bash
#!/bin/bash
# setup.sh - Script de configuração inicial

echo "🎵 Configurando Memora Music..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+"
    exit 1
fi

# Verificar versão do Node
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Instalar dependências
echo "📦 Instalando dependências do frontend..."
npm install

echo "📦 Instalando dependências do backend..."
cd api && npm install && cd ..

# Criar arquivos .env se não existirem
if [ ! -f .env ]; then
    echo "📝 Criando .env do frontend..."
    cp .env.example .env
fi

if [ ! -f api/.env ]; then
    echo "📝 Criando .env do backend..."
    cp api/.env.example api/.env
fi

echo "🎉 Configuração concluída!"
echo "📋 Próximos passos:"
echo "   1. Configure as chaves de API nos arquivos .env"
echo "   2. Execute 'npm run dev:all' para iniciar o desenvolvimento"
```

#### dev.sh - Script de Desenvolvimento
```bash
#!/bin/bash
# dev.sh - Script para desenvolvimento

echo "🚀 Iniciando Memora Music em modo desenvolvimento..."

# Verificar se .env existe
if [ ! -f .env ] || [ ! -f api/.env ]; then
    echo "❌ Arquivos .env não encontrados. Execute ./setup.sh primeiro"
    exit 1
fi

# Verificar se as chaves de API estão configuradas
if ! grep -q "OPENAI_API_KEY=sk-" api/.env; then
    echo "⚠️  OPENAI_API_KEY não configurada em api/.env"
fi

if ! grep -q "SUNO_API_KEY=" api/.env; then
    echo "⚠️  SUNO_API_KEY não configurada em api/.env"
fi

# Iniciar desenvolvimento
npm run dev:all
```

### 9.2 Scripts de Deploy

#### deploy.sh - Deploy Automatizado
```bash
#!/bin/bash
# deploy.sh - Script de deploy

echo "🚀 Iniciando deploy da Memora Music..."

# Verificar se está na branch main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Deploy deve ser feito a partir da branch main"
    echo "   Branch atual: $CURRENT_BRANCH"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Há mudanças não commitadas. Commit antes do deploy"
    git status --short
    exit 1
fi

# Build local para verificar
echo "🔨 Executando build local..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build falhou"
    exit 1
fi

# Deploy na Vercel
echo "☁️  Fazendo deploy na Vercel..."
vercel --prod

echo "✅ Deploy concluído!"
```

### 9.3 Scripts de Manutenção

#### health-check.sh - Verificação de Saúde
```bash
#!/bin/bash
# health-check.sh - Verificação de saúde do sistema

API_URL="${1:-http://localhost:3001}"

echo "🏥 Verificando saúde da Memora Music..."
echo "   API URL: $API_URL"

# Verificar API de saúde
HEALTH_RESPONSE=$(curl -s "$API_URL/api/health")
if [ $? -eq 0 ]; then
    echo "✅ API de saúde respondendo"
    echo "   Resposta: $HEALTH_RESPONSE"
else
    echo "❌ API de saúde não respondendo"
    exit 1
fi

# Verificar endpoints principais
echo "🔍 Testando endpoints..."

# Testar geração de letra
LYRICS_RESPONSE=$(curl -s -X POST "$API_URL/api/generate-preview" \
  -H "Content-Type: application/json" \
  -d '{
    "occasion": "teste",
    "recipientName": "João",
    "relationship": "amigo",
    "senderName": "Maria",
    "genre": "Pop",
    "emotion": "Alegre",
    "vocalPreference": "Masculina",
    "duration": "2-3 minutos",
    "lyricsOnly": true
  }')

if echo "$LYRICS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Geração de letras funcionando"
else
    echo "❌ Geração de letras com problemas"
    echo "   Resposta: $LYRICS_RESPONSE"
fi

echo "🎉 Verificação de saúde concluída!"
```

## 10. Checklist de Deploy

### 10.1 Pré-Deploy

- [ ] **Código**
  - [ ] Todos os testes passando
  - [ ] Build local bem-sucedido
  - [ ] Linting sem erros
  - [ ] TypeScript sem erros
  - [ ] Código commitado e pushed

- [ ] **Configuração**
  - [ ] Variáveis de ambiente configuradas
  - [ ] Chaves de API válidas
  - [ ] Banco de dados configurado
  - [ ] CORS configurado corretamente

- [ ] **Segurança**
  - [ ] Chaves sensíveis não no código
  - [ ] Headers de segurança configurados
  - [ ] Rate limiting configurado (se aplicável)
  - [ ] HTTPS habilitado

### 10.2 Pós-Deploy

- [ ] **Verificação**
  - [ ] Site carregando corretamente
  - [ ] API respondendo
  - [ ] Funcionalidades principais funcionando
  - [ ] Logs sem erros críticos

- [ ] **Monitoramento**
  - [ ] Métricas de performance normais
  - [ ] Alertas configurados
  - [ ] Backup funcionando
  - [ ] SSL certificado válido

- [ ] **Comunicação**
  - [ ] Equipe notificada
  - [ ] Usuários comunicados (se necessário)
  - [ ] Documentação atualizada
  - [ ] Changelog atualizado

## 11. Recursos Adicionais

### 11.1 Documentação

- **React**: [react.dev](https://react.dev/)
- **Vite**: [vitejs.dev](https://vitejs.dev/)
- **Express.js**: [expressjs.com](https://expressjs.com/)
- **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org/)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com/)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

### 11.2 Ferramentas

- **VS Code Extensions**:
  - Thunder Client (API testing)
  - GitLens (Git integration)
  - Auto Rename Tag
  - Bracket Pair Colorizer

- **CLI Tools**:
  - `curl` - Testes de API
  - `jq` - Processamento de JSON
  - `htop` - Monitoramento de sistema
  - `ngrok` - Túneis para desenvolvimento

### 11.3 Comunidade

- **GitHub Issues**: Para reportar bugs
- **Discussions**: Para perguntas e sugestões
- **Discord**: Canal de desenvolvimento (se aplicável)
- **Email**: Suporte técnico

Este guia fornece uma base sólida para instalação, desenvolvimento e deploy da Memora Music. Para dúvidas específicas ou problemas não cobertos aqui, consulte a documentação oficial das tecnologias utilizadas ou entre em contato com a equipe de desenvolvimento.