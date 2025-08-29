# Arquitetura Técnica: Sistema de Paywall para Memora Music

## 1. Arquitetura Geral do Sistema

```mermaid
graph TD
    A[Frontend React] --> B[API Routes Next.js]
    B --> C[Banco de Dados]
    B --> D[Stripe API]
    B --> E[Serviço de Geração de Música]
    D --> F[Stripe Webhooks]
    F --> B
    E --> G[Queue System]
    G --> H[Background Jobs]
    
    subgraph "Frontend Layer"
        A
        I[Auth Store]
        J[UI Store]
        K[Payment Components]
    end
    
    subgraph "Backend Layer"
        B
        L[Auth Middleware]
        M[Payment Service]
        N[Music Generation Service]
    end
    
    subgraph "Data Layer"
        C
        O[Payment Sessions]
        P[User Usage Tracking]
    end
    
    subgraph "External Services"
        D
        E
    end
```

## 2. Stack Tecnológico

### 2.1 Frontend
- **Framework:** React 18 com TypeScript
- **Roteamento:** Next.js App Router
- **Estilização:** Tailwind CSS + shadcn/ui
- **Estado Global:** Zustand (authStore, uiStore)
- **Formulários:** react-hook-form + zod
- **HTTP Client:** fetch nativo
- **Pagamentos:** Stripe Checkout (redirect)

### 2.2 Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Next.js API Routes
- **Validação:** Zod schemas
- **Autenticação:** Sistema customizado com JWT
- **Pagamentos:** Stripe SDK
- **Queue:** Redis Bull (para jobs assíncronos)

### 2.3 Banco de Dados
- **SGBD:** PostgreSQL
- **ORM:** Prisma
- **Migrações:** Prisma Migrate

### 2.4 Infraestrutura
- **Deploy:** Vercel
- **Cache:** Redis (Upstash)
- **Monitoramento:** Sentry
- **Logs:** Pino + Vercel Analytics

## 3. Definições de Rotas

### 3.1 Rotas Frontend

| Rota | Propósito | Componentes Principais |
|------|-----------|------------------------|
| `/criar` | Página inicial de criação | CreationForm, PaymentNotice |
| `/criar/genero` | Seleção de gênero musical | GenreSelector, PaymentInterceptor |
| `/criar/detalhes` | Detalhes da música | MusicDetailsForm |
| `/payment/success` | Confirmação de pagamento | PaymentSuccess, MusicStatusPoller |
| `/payment/cancel` | Cancelamento de pagamento | PaymentCancel |
| `/resultado` | Exibição da música gerada | MusicPlayer, DownloadButton |

### 3.2 Rotas API

| Rota | Método | Propósito |
|------|--------|----------|
| `/api/user/creation-status` | GET | Verificar status de criação do usuário |
| `/api/create-payment-session` | POST | Criar sessão de pagamento Stripe |
| `/api/generate-music` | POST | Gerar música (com validação de pagamento) |
| `/api/music/status` | GET | Verificar status de geração da música |
| `/api/webhooks/stripe` | POST | Webhook de confirmação de pagamento |
| `/api/user/usage` | GET | Obter estatísticas de uso do usuário |

## 4. Definições de API

### 4.1 Schemas de Validação

```typescript
// schemas/payment.ts
import { z } from 'zod';

export const CreatePaymentSessionSchema = z.object({
  musicData: z.object({
    genre: z.string().min(1),
    mood: z.string().min(1),
    instruments: z.array(z.string()),
    duration: z.number().min(30).max(300),
    description: z.string().optional()
  })
});

export const CreationStatusSchema = z.object({
  isFree: z.boolean(),
  freeSongsUsed: z.number(),
  freeSongsLimit: z.number(),
  requiresPayment: z.boolean()
});

export const MusicGenerationSchema = z.object({
  genre: z.string(),
  mood: z.string(),
  instruments: z.array(z.string()),
  duration: z.number(),
  paymentSessionId: z.string().optional()
});
```

### 4.2 Endpoints Detalhados

#### GET /api/user/creation-status

**Autenticação:** Requerida

**Resposta:**
```typescript
interface CreationStatusResponse {
  isFree: boolean;
  freeSongsUsed: number;
  freeSongsLimit: number;
  requiresPayment: boolean;
}
```

**Exemplo:**
```json
{
  "isFree": false,
  "freeSongsUsed": 1,
  "freeSongsLimit": 1,
  "requiresPayment": true
}
```

#### POST /api/create-payment-session

**Autenticação:** Requerida

**Request Body:**
```typescript
interface CreatePaymentRequest {
  musicData: {
    genre: string;
    mood: string;
    instruments: string[];
    duration: number;
    description?: string;
  };
}
```

**Resposta:**
```typescript
interface CreatePaymentResponse {
  sessionId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  expiresAt: string;
}
```

#### POST /api/generate-music

**Autenticação:** Requerida

**Request Body:**
```typescript
interface GenerateMusicRequest {
  genre: string;
  mood: string;
  instruments: string[];
  duration: number;
  paymentSessionId?: string;
}
```

**Resposta (Sucesso):**
```typescript
interface GenerateMusicResponse {
  jobId: string;
  status: 'queued' | 'processing';
  estimatedTime: number;
}
```

**Resposta (Pagamento Requerido):**
```json
{
  "error": "Payment required",
  "code": "PAYMENT_REQUIRED",
  "message": "Esta funcionalidade requer pagamento"
}
```

#### GET /api/music/status

**Parâmetros:**
- `jobId` (string): ID do job de geração
- `sessionId` (string, opcional): ID da sessão de pagamento

**Resposta:**
```typescript
interface MusicStatusResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  musicUrl?: string;
  error?: string;
  estimatedTime?: number;
}
```

## 5. Modelo de Dados

### 5.1 Diagrama ER

```mermaid
erDiagram
    USERS ||--o{ PAYMENT_SESSIONS : creates
    USERS ||--o{ MUSIC_GENERATIONS : owns
    PAYMENT_SESSIONS ||--o| MUSIC_GENERATIONS : triggers
    
    USERS {
        uuid id PK
        string email UK
        string name
        string password_hash
        int free_songs_used
        timestamp created_at
        timestamp updated_at
    }
    
    PAYMENT_SESSIONS {
        uuid id PK
        uuid user_id FK
        string stripe_session_id UK
        string status
        int amount
        string currency
        json music_data
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }
    
    MUSIC_GENERATIONS {
        uuid id PK
        uuid user_id FK
        uuid payment_session_id FK
        string status
        string job_id
        json music_data
        string music_url
        string error_message
        timestamp started_at
        timestamp completed_at
        timestamp created_at
    }
```

### 5.2 Schema Prisma

```prisma
// prisma/schema.prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String    @map("password_hash")
  freeSongsUsed Int       @default(0) @map("free_songs_used")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  paymentSessions   PaymentSession[]
  musicGenerations  MusicGeneration[]
  
  @@map("users")
}

model PaymentSession {
  id              String    @id @default(cuid())
  userId          String    @map("user_id")
  stripeSessionId String    @unique @map("stripe_session_id")
  status          String    @default("pending")
  amount          Int
  currency        String    @default("BRL")
  musicData       Json      @map("music_data")
  expiresAt       DateTime  @map("expires_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  musicGeneration MusicGeneration?
  
  @@map("payment_sessions")
}

model MusicGeneration {
  id               String    @id @default(cuid())
  userId           String    @map("user_id")
  paymentSessionId String?   @unique @map("payment_session_id")
  status           String    @default("queued")
  jobId            String?   @map("job_id")
  musicData        Json      @map("music_data")
  musicUrl         String?   @map("music_url")
  errorMessage     String?   @map("error_message")
  startedAt        DateTime? @map("started_at")
  completedAt      DateTime? @map("completed_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  paymentSession PaymentSession? @relation(fields: [paymentSessionId], references: [id])
  
  @@map("music_generations")
}
```

### 5.3 Migrações SQL

```sql
-- Migration: 001_add_payment_system.sql

-- Adicionar campo de controle de músicas gratuitas
ALTER TABLE users ADD COLUMN free_songs_used INTEGER DEFAULT 0;

-- Criar tabela de sessões de pagamento
CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  music_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de gerações de música
CREATE TABLE music_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_session_id UUID UNIQUE REFERENCES payment_sessions(id),
  status VARCHAR(50) DEFAULT 'queued',
  job_id VARCHAR(255),
  music_data JSONB NOT NULL,
  music_url TEXT,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_free_songs_used ON users(free_songs_used);
CREATE INDEX idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX idx_payment_sessions_expires_at ON payment_sessions(expires_at);
CREATE INDEX idx_music_generations_user_id ON music_generations(user_id);
CREATE INDEX idx_music_generations_status ON music_generations(status);
CREATE INDEX idx_music_generations_job_id ON music_generations(job_id);
```

## 6. Arquitetura de Serviços

### 6.1 Camadas da Aplicação

```mermaid
graph TD
    A[Presentation Layer] --> B[API Layer]
    B --> C[Service Layer]
    C --> D[Repository Layer]
    D --> E[Data Layer]
    
    subgraph "Presentation Layer"
        A1[React Components]
        A2[Hooks]
        A3[Stores]
    end
    
    subgraph "API Layer"
        B1[Route Handlers]
        B2[Middleware]
        B3[Validation]
    end
    
    subgraph "Service Layer"
        C1[PaymentService]
        C2[MusicService]
        C3[UserService]
        C4[NotificationService]
    end
    
    subgraph "Repository Layer"
        D1[UserRepository]
        D2[PaymentRepository]
        D3[MusicRepository]
    end
    
    subgraph "Data Layer"
        E1[PostgreSQL]
        E2[Redis]
        E3[File Storage]
    end
```

### 6.2 Serviços Principais

#### PaymentService
```typescript
// services/PaymentService.ts
export class PaymentService {
  async createPaymentSession(userId: string, musicData: MusicData): Promise<PaymentSession> {
    // Criar sessão no Stripe
    // Salvar no banco de dados
    // Retornar dados da sessão
  }
  
  async validatePayment(sessionId: string): Promise<boolean> {
    // Verificar status no Stripe
    // Validar assinatura do webhook
    // Atualizar status no banco
  }
  
  async processWebhook(event: Stripe.Event): Promise<void> {
    // Processar diferentes tipos de eventos
    // Atualizar status de pagamento
    // Disparar geração de música
  }
}
```

#### MusicService
```typescript
// services/MusicService.ts
export class MusicService {
  async canGenerateMusic(userId: string): Promise<CreationStatus> {
    // Verificar músicas gratuitas utilizadas
    // Verificar pagamentos pendentes
    // Retornar status de criação
  }
  
  async generateMusic(userId: string, musicData: MusicData, paymentSessionId?: string): Promise<MusicGeneration> {
    // Validar permissões
    // Criar job na queue
    // Salvar registro no banco
    // Retornar informações do job
  }
  
  async getMusicStatus(jobId: string): Promise<MusicStatus> {
    // Consultar status na queue
    // Retornar progresso e resultado
  }
}
```

## 7. Sistema de Queue e Jobs

### 7.1 Configuração Redis Bull

```typescript
// lib/queue.ts
import Queue from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export const musicGenerationQueue = new Queue('music generation', {
  redis: {
    port: redis.options.port,
    host: redis.options.host,
    password: redis.options.password
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Processor
musicGenerationQueue.process('generate', async (job) => {
  const { userId, musicData, paymentSessionId } = job.data;
  
  try {
    // Atualizar status para 'processing'
    await updateMusicGenerationStatus(job.id, 'processing');
    
    // Gerar música usando IA
    const musicUrl = await generateMusicWithAI(musicData);
    
    // Salvar resultado
    await saveMusicResult(job.id, musicUrl);
    
    // Incrementar contador se for música gratuita
    if (!paymentSessionId) {
      await incrementFreeSongsUsed(userId);
    }
    
    return { musicUrl };
  } catch (error) {
    await updateMusicGenerationStatus(job.id, 'failed', error.message);
    throw error;
  }
});
```

### 7.2 Monitoramento de Jobs

```typescript
// lib/queue-monitor.ts
import { musicGenerationQueue } from './queue';

// Dashboard de monitoramento
export const getQueueStats = async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    musicGenerationQueue.getWaiting(),
    musicGenerationQueue.getActive(),
    musicGenerationQueue.getCompleted(),
    musicGenerationQueue.getFailed()
  ]);
  
  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length
  };
};

// Limpeza automática
export const cleanOldJobs = async () => {
  await musicGenerationQueue.clean(24 * 60 * 60 * 1000, 'completed');
  await musicGenerationQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
};
```

## 8. Configuração de Ambiente

### 8.1 Variáveis de Ambiente

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/memora_music"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Redis
REDIS_URL="redis://localhost:6379"

# Music Generation API
MUSIC_API_URL="https://api.musicgen.com"
MUSIC_API_KEY="your-music-api-key"

# File Storage
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="memora-music-files"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
MUSIC_PRICE_CENTS=1500
FREE_SONGS_LIMIT=1
```

### 8.2 Configuração de Desenvolvimento

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "queue:dev": "tsx watch src/workers/queue-worker.ts",
    "stripe:listen": "stripe listen --forward-to localhost:3000/api/webhooks/stripe"
  }
}
```

## 9. Testes e Qualidade

### 9.1 Estrutura de Testes

```
tests/
├── unit/
│   ├── services/
│   │   ├── PaymentService.test.ts
│   │   └── MusicService.test.ts
│   └── utils/
├── integration/
│   ├── api/
│   │   ├── payment.test.ts
│   │   └── music-generation.test.ts
│   └── webhooks/
└── e2e/
    ├── payment-flow.spec.ts
    └── music-creation.spec.ts
```

### 9.2 Testes de Pagamento

```typescript
// tests/integration/api/payment.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { testClient } from '../setup';

describe('Payment API', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestUser();
  });
  
  it('should create payment session for paid user', async () => {
    const response = await testClient
      .post('/api/create-payment-session')
      .send({
        musicData: {
          genre: 'rock',
          mood: 'energetic',
          instruments: ['guitar', 'drums'],
          duration: 120
        }
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('paymentUrl');
    expect(response.body.amount).toBe(1500);
  });
  
  it('should reject music generation without payment', async () => {
    // Simular usuário que já usou música gratuita
    await updateUser(testUserId, { freeSongsUsed: 1 });
    
    const response = await testClient
      .post('/api/generate-music')
      .send(validMusicData)
      .expect(402);
    
    expect(response.body.code).toBe('PAYMENT_REQUIRED');
  });
});
```

## 10. Monitoramento e Observabilidade

### 10.1 Métricas Customizadas

```typescript
// lib/metrics.ts
import { createPrometheusMetrics } from '@prometheus/client';

export const metrics = {
  paymentSessions: new Counter({
    name: 'payment_sessions_total',
    help: 'Total number of payment sessions created',
    labelNames: ['status']
  }),
  
  musicGenerations: new Counter({
    name: 'music_generations_total',
    help: 'Total number of music generations',
    labelNames: ['type', 'status']
  }),
  
  generationDuration: new Histogram({
    name: 'music_generation_duration_seconds',
    help: 'Time taken to generate music',
    buckets: [10, 30, 60, 120, 300]
  })
};
```

### 10.2 Logs Estruturados

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err
  }
});

// Uso nos serviços
logger.info({
  userId,
  paymentSessionId,
  amount: 1500
}, 'Payment session created');
```

## 11. Segurança e Compliance

### 11.1 Validação de Webhooks

```typescript
// lib/webhook-validation.ts
import { stripe } from './stripe';

export const validateStripeWebhook = (body: string, signature: string) => {
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    throw new Error('Invalid webhook signature');
  }
};
```

### 11.2 Rate Limiting

```typescript
// middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true
});

export const rateLimitMiddleware = async (req: Request) => {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
  
  return { limit, reset, remaining };
};
```

## 12. Deploy e CI/CD

### 12.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 12.2 Configuração Vercel

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database-url",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "REDIS_URL": "@redis-url"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_APP_URL": "https://memora-music.vercel.app"
    }
  }
}
```