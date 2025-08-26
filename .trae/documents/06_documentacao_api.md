# Documentação da API - Memora Music

## 1. Visão Geral

### 1.1 Introdução
A API da Memora Music é uma REST API que permite a criação de músicas personalizadas utilizando inteligência artificial. A API integra serviços como OpenAI para geração de letras e Suno AI para geração de áudio musical.

### 1.2 Informações Gerais
- **Base URL**: `https://memora-music.vercel.app/api`
- **Versão**: v1.0
- **Protocolo**: HTTPS
- **Formato**: JSON
- **Autenticação**: Não requerida (MVP)
- **Rate Limiting**: Não implementado (planejado)

### 1.3 Códigos de Status HTTP

| Código | Descrição | Uso |
|--------|-----------|-----|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 400 | Bad Request | Dados de entrada inválidos |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |
| 502 | Bad Gateway | Erro de integração externa |
| 503 | Service Unavailable | Serviço temporariamente indisponível |

### 1.4 Headers Padrão

#### Request Headers
```http
Content-Type: application/json
Accept: application/json
User-Agent: Memora-Music-Client/1.0
```

#### Response Headers
```http
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## 2. Endpoints da API

### 2.1 Health Check

#### GET /api/health
**Descrição**: Verifica o status de saúde da API.

**Request**:
```http
GET /api/health HTTP/1.1
Host: memora-music.vercel.app
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-05-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "activeTasks": 5
}
```

**Response Schema**:
| Campo | Tipo | Descrição |
|-------|------|----------|
| status | string | Status da API ("healthy" ou "unhealthy") |
| timestamp | string | Timestamp ISO 8601 da resposta |
| version | string | Versão da API |
| uptime | number | Tempo de atividade em segundos |
| activeTasks | number | Número de tarefas de geração ativas |

### 2.2 Geração de Música

#### POST /api/generate-preview
**Descrição**: Inicia o processo de geração de música personalizada.

**Request**:
```http
POST /api/generate-preview HTTP/1.1
Host: memora-music.vercel.app
Content-Type: application/json

{
  "occasion": "aniversário",
  "recipientName": "Maria",
  "relationship": "esposa",
  "senderName": "João",
  "hobbies": "jardinagem, leitura",
  "qualities": "carinhosa, inteligente",
  "uniqueTraits": "sempre sorrindo",
  "specialMemories": "nossa primeira viagem juntos",
  "genre": "MPB",
  "subgenre": "MPB Romântica",
  "emotion": "Romântica",
  "vocalPreference": "Masculina",
  "duration": "2-3 minutos",
  "lyricsOnly": false
}
```

**Request Schema**:
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| occasion | string | ✅ | Ocasião especial (máx. 100 chars) |
| recipientName | string | ✅ | Nome do destinatário (máx. 50 chars) |
| relationship | string | ✅ | Relação com o destinatário (máx. 50 chars) |
| senderName | string | ✅ | Nome do remetente (máx. 50 chars) |
| hobbies | string | ❌ | Hobbies do destinatário (máx. 200 chars) |
| qualities | string | ❌ | Qualidades do destinatário (máx. 200 chars) |
| uniqueTraits | string | ❌ | Traços únicos (máx. 200 chars) |
| specialMemories | string | ❌ | Memórias especiais (máx. 300 chars) |
| genre | string | ✅ | Gênero musical |
| subgenre | string | ❌ | Subgênero musical |
| emotion | string | ✅ | Emoção desejada |
| vocalPreference | string | ✅ | Preferência vocal |
| duration | string | ✅ | Duração desejada |
| lyricsOnly | boolean | ❌ | Se true, gera apenas letra (default: false) |

**Response (Sucesso)**:
```json
{
  "success": true,
  "taskId": "task_abc123def456",
  "message": "Geração iniciada com sucesso",
  "estimatedTime": "2-5 minutos",
  "lyricsOnly": false
}
```

**Response (Apenas Letra)**:
```json
{
  "success": true,
  "lyrics": "Verso 1:\nMaria, meu amor verdadeiro...",
  "title": "Para Maria, Meu Amor",
  "lyricsOnly": true
}
```

**Response Schema (Sucesso)**:
| Campo | Tipo | Descrição |
|-------|------|----------|
| success | boolean | Indica se a requisição foi bem-sucedida |
| taskId | string | ID único da tarefa (apenas se lyricsOnly=false) |
| message | string | Mensagem descritiva |
| estimatedTime | string | Tempo estimado para conclusão |
| lyrics | string | Letra gerada (apenas se lyricsOnly=true) |
| title | string | Título da música (apenas se lyricsOnly=true) |
| lyricsOnly | boolean | Indica o modo de geração |

**Response (Erro de Validação)**:
```json
{
  "success": false,
  "error": "Dados de entrada inválidos",
  "details": [
    {
      "field": "occasion",
      "message": "Campo obrigatório"
    },
    {
      "field": "recipientName",
      "message": "Máximo 50 caracteres"
    }
  ]
}
```

**Response (Erro de Serviço)**:
```json
{
  "success": false,
  "error": "Erro interno do servidor",
  "message": "Falha na comunicação com o serviço de IA",
  "code": "AI_SERVICE_ERROR"
}
```

### 2.3 Verificação de Status

#### GET /api/check-music-status/:taskId
**Descrição**: Verifica o status de uma tarefa de geração de música.

**Request**:
```http
GET /api/check-music-status/task_abc123def456 HTTP/1.1
Host: memora-music.vercel.app
```

**Response (Em Processamento)**:
```json
{
  "taskId": "task_abc123def456",
  "status": "PROCESSING",
  "completedClips": 0,
  "totalExpected": 2,
  "audioClips": [],
  "lyrics": "Verso 1:\nMaria, meu amor verdadeiro...",
  "metadata": {
    "title": "Para Maria, Meu Amor",
    "genre": "MPB",
    "emotion": "Romântica",
    "duration": "2-3 minutos"
  },
  "lastUpdate": "2024-05-15T10:35:00.000Z"
}
```

**Response (Concluído)**:
```json
{
  "taskId": "task_abc123def456",
  "status": "COMPLETED",
  "completedClips": 2,
  "totalExpected": 2,
  "audioClips": [
    {
      "id": "clip_001",
      "audioUrl": "https://cdn.suno.ai/audio/clip_001.mp3",
      "duration": 180,
      "title": "Para Maria, Meu Amor - Versão 1"
    },
    {
      "id": "clip_002",
      "audioUrl": "https://cdn.suno.ai/audio/clip_002.mp3",
      "duration": 175,
      "title": "Para Maria, Meu Amor - Versão 2"
    }
  ],
  "lyrics": "Verso 1:\nMaria, meu amor verdadeiro...",
  "metadata": {
    "title": "Para Maria, Meu Amor",
    "genre": "MPB",
    "emotion": "Romântica",
    "duration": "2-3 minutos"
  },
  "lastUpdate": "2024-05-15T10:40:00.000Z"
}
```

**Response (Erro)**:
```json
{
  "taskId": "task_abc123def456",
  "status": "FAILED",
  "completedClips": 0,
  "totalExpected": 2,
  "audioClips": [],
  "error": "Falha na geração de áudio",
  "lastUpdate": "2024-05-15T10:38:00.000Z"
}
```

**Response Schema**:
| Campo | Tipo | Descrição |
|-------|------|----------|
| taskId | string | ID único da tarefa |
| status | string | Status atual ("PROCESSING", "COMPLETED", "PARTIAL", "FAILED") |
| completedClips | number | Número de clipes de áudio concluídos |
| totalExpected | number | Número total de clipes esperados |
| audioClips | array | Lista de clipes de áudio gerados |
| lyrics | string | Letra da música |
| metadata | object | Metadados da música |
| error | string | Mensagem de erro (apenas se status="FAILED") |
| lastUpdate | string | Timestamp da última atualização |

**Audio Clip Schema**:
| Campo | Tipo | Descrição |
|-------|------|----------|
| id | string | ID único do clipe |
| audioUrl | string | URL do arquivo de áudio |
| duration | number | Duração em segundos |
| title | string | Título do clipe |

### 2.4 Salvamento de Feedback

#### POST /api/save-feedback
**Descrição**: Salva feedback do usuário sobre a experiência.

**Request**:
```http
POST /api/save-feedback HTTP/1.1
Host: memora-music.vercel.app
Content-Type: application/json

{
  "difficulty": 2,
  "wouldRecommend": true,
  "willingToPay": "R$ 5-10"
}
```

**Request Schema**:
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| difficulty | number | ✅ | Dificuldade de uso (1-5, onde 1=muito fácil, 5=muito difícil) |
| wouldRecommend | boolean | ✅ | Se recomendaria para outros |
| willingToPay | string | ✅ | Faixa de preço disposto a pagar |

**Response (Sucesso)**:
```json
{
  "success": true,
  "message": "Feedback salvo com sucesso",
  "id": "feedback_789xyz"
}
```

**Response (Erro)**:
```json
{
  "success": false,
  "error": "Erro ao salvar feedback",
  "details": "Falha na conexão com o banco de dados"
}
```

#### GET /api/save-feedback/health
**Descrição**: Verifica a saúde do serviço de feedback.

**Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-05-15T10:30:00.000Z"
}
```

### 2.5 Autenticação (Planejado)

#### POST /api/auth/register
**Descrição**: Registra um novo usuário (não implementado).
**Status**: 📋 Planejado para v1.1

#### POST /api/auth/login
**Descrição**: Autentica um usuário (não implementado).
**Status**: 📋 Planejado para v1.1

#### POST /api/auth/logout
**Descrição**: Encerra sessão do usuário (não implementado).
**Status**: 📋 Planejado para v1.1

## 3. Modelos de Dados

### 3.1 Esquemas de Validação (Zod)

#### GeneratePreviewSchema
```typescript
const generatePreviewSchema = z.object({
  // Campos obrigatórios
  occasion: z.string().min(1, "Ocasião é obrigatória").max(100, "Máximo 100 caracteres"),
  recipientName: z.string().min(1, "Nome do destinatário é obrigatório").max(50, "Máximo 50 caracteres"),
  relationship: z.string().min(1, "Relação é obrigatória").max(50, "Máximo 50 caracteres"),
  senderName: z.string().min(1, "Nome do remetente é obrigatório").max(50, "Máximo 50 caracteres"),
  genre: z.string().min(1, "Gênero é obrigatório"),
  emotion: z.string().min(1, "Emoção é obrigatória"),
  vocalPreference: z.string().min(1, "Preferência vocal é obrigatória"),
  duration: z.string().min(1, "Duração é obrigatória"),
  
  // Campos opcionais
  hobbies: z.string().max(200, "Máximo 200 caracteres").optional(),
  qualities: z.string().max(200, "Máximo 200 caracteres").optional(),
  uniqueTraits: z.string().max(200, "Máximo 200 caracteres").optional(),
  specialMemories: z.string().max(300, "Máximo 300 caracteres").optional(),
  subgenre: z.string().optional(),
  lyricsOnly: z.boolean().optional().default(false)
});
```

#### FeedbackSchema
```typescript
const feedbackSchema = z.object({
  difficulty: z.number().min(1).max(5),
  wouldRecommend: z.boolean(),
  willingToPay: z.string().min(1, "Faixa de preço é obrigatória")
});
```

### 3.2 Tipos TypeScript

#### MusicTask
```typescript
interface MusicTask {
  taskId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  jobIds: string[];
  audioClips: AudioClip[];
  completedClips: number;
  totalExpected: number;
  lyrics: string;
  metadata: MusicMetadata;
  createdAt: string;
  lastUpdate: string;
  error?: string;
}
```

#### AudioClip
```typescript
interface AudioClip {
  id: string;
  audioUrl: string;
  duration: number;
  title: string;
}
```

#### MusicMetadata
```typescript
interface MusicMetadata {
  title: string;
  genre: string;
  subgenre?: string;
  emotion: string;
  vocalPreference: string;
  duration: string;
  recipientName: string;
  occasion: string;
}
```

#### Feedback
```typescript
interface Feedback {
  id: string;
  difficulty: number;
  wouldRecommend: boolean;
  willingToPay: string;
  createdAt: string;
}
```

## 4. Integração com Serviços Externos

### 4.1 OpenAI API

#### Configuração
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000
});
```

#### Uso para Geração de Letras
```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "Você é um compositor especializado em criar letras personalizadas..."
    },
    {
      role: "user",
      content: prompt
    }
  ],
  max_tokens: 1000,
  temperature: 0.8
});
```

### 4.2 Suno AI API

#### Configuração
```typescript
class SunoAPI {
  private baseURL = 'https://studio-api.suno.ai';
  private apiKey = process.env.SUNO_API_KEY;
  
  async generateMusic(payload: SunoGeneratePayload): Promise<SunoResponse> {
    // Implementação da geração
  }
  
  async checkStatus(jobIds: string[]): Promise<SunoStatusResponse> {
    // Implementação da verificação de status
  }
}
```

#### Payload para Geração
```typescript
interface SunoGeneratePayload {
  prompt: string;
  style: string;
  title: string;
  callBackUrl?: string;
  model?: string;
}
```

### 4.3 Supabase

#### Configuração
```typescript
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

#### Salvamento de Feedback
```typescript
const { data, error } = await supabase
  .from('feedback')
  .insert({
    difficulty: convertedDifficulty,
    would_recommend: wouldRecommend,
    willing_to_pay: willingToPay,
    created_at: new Date().toISOString()
  });
```

## 5. Tratamento de Erros

### 5.1 Tipos de Erro

#### Erros de Validação
```json
{
  "success": false,
  "error": "Dados de entrada inválidos",
  "type": "VALIDATION_ERROR",
  "details": [
    {
      "field": "occasion",
      "message": "Campo obrigatório",
      "code": "REQUIRED"
    }
  ]
}
```

#### Erros de Serviço Externo
```json
{
  "success": false,
  "error": "Falha na comunicação com serviço externo",
  "type": "EXTERNAL_SERVICE_ERROR",
  "service": "OpenAI",
  "code": "API_TIMEOUT",
  "retryable": true
}
```

#### Erros Internos
```json
{
  "success": false,
  "error": "Erro interno do servidor",
  "type": "INTERNAL_ERROR",
  "code": "UNKNOWN_ERROR",
  "requestId": "req_abc123"
}
```

### 5.2 Códigos de Erro Customizados

| Código | Descrição | Ação Recomendada |
|--------|-----------|------------------|
| VALIDATION_ERROR | Dados de entrada inválidos | Corrigir dados e tentar novamente |
| AI_SERVICE_ERROR | Falha nos serviços de IA | Tentar novamente em alguns minutos |
| RATE_LIMIT_EXCEEDED | Limite de requisições excedido | Aguardar e tentar novamente |
| TASK_NOT_FOUND | Tarefa não encontrada | Verificar taskId |
| GENERATION_FAILED | Falha na geração | Tentar novamente com dados diferentes |
| DATABASE_ERROR | Erro no banco de dados | Contatar suporte |

## 6. Rate Limiting (Planejado)

### 6.1 Limites Propostos

| Endpoint | Limite | Janela | Observações |
|----------|--------|--------|-------------|
| /api/generate-preview | 5 req | 1 hora | Por IP |
| /api/check-music-status | 60 req | 1 minuto | Por IP |
| /api/save-feedback | 10 req | 1 hora | Por IP |
| /api/health | 100 req | 1 minuto | Sem limite prático |

### 6.2 Headers de Rate Limiting

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1684152000
X-RateLimit-Window: 3600
```

### 6.3 Resposta de Rate Limit Excedido

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "type": "RATE_LIMIT_ERROR",
  "limit": 5,
  "window": 3600,
  "resetTime": "2024-05-15T11:00:00.000Z",
  "retryAfter": 1800
}
```

## 7. Monitoramento e Logs

### 7.1 Estrutura de Logs

#### Log de Requisição
```json
{
  "timestamp": "2024-05-15T10:30:00.000Z",
  "level": "info",
  "type": "request",
  "method": "POST",
  "url": "/api/generate-preview",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "requestId": "req_abc123",
  "duration": 1250
}
```

#### Log de Erro
```json
{
  "timestamp": "2024-05-15T10:30:00.000Z",
  "level": "error",
  "type": "error",
  "message": "OpenAI API timeout",
  "error": {
    "name": "TimeoutError",
    "message": "Request timeout after 60000ms",
    "stack": "..."
  },
  "requestId": "req_abc123",
  "endpoint": "/api/generate-preview"
}
```

### 7.2 Métricas Coletadas

#### Métricas de Performance
- Tempo de resposta por endpoint
- Taxa de erro por endpoint
- Throughput (requisições por minuto)
- Tempo de geração de música
- Taxa de sucesso das integrações externas

#### Métricas de Negócio
- Número de músicas geradas por dia
- Taxa de conclusão do fluxo
- Gêneros mais populares
- Feedback dos usuários

## 8. Segurança

### 8.1 Medidas Implementadas

#### Validação de Entrada
- Sanitização de todos os inputs
- Validação com Zod schemas
- Limitação de tamanho de campos
- Escape de caracteres especiais

#### Headers de Segurança
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

#### Proteção de Dados
- Variáveis de ambiente para chaves sensíveis
- Não armazenamento de dados pessoais
- Logs sem informações sensíveis
- HTTPS obrigatório

### 8.2 Medidas Planejadas

#### Rate Limiting
- Implementação de limites por IP
- Proteção contra ataques DDoS
- Throttling inteligente

#### Autenticação e Autorização
- JWT tokens
- Refresh tokens
- Controle de acesso baseado em roles

#### Auditoria
- Logs de auditoria
- Monitoramento de atividades suspeitas
- Alertas de segurança

## 9. Versionamento

### 9.1 Estratégia de Versionamento

#### Semantic Versioning
- **Major**: Mudanças incompatíveis
- **Minor**: Novas funcionalidades compatíveis
- **Patch**: Correções de bugs

#### Versionamento da API
- URL: `/api/v1/endpoint`
- Header: `API-Version: 1.0`
- Suporte a múltiplas versões simultâneas

### 9.2 Changelog

#### v1.0.0 (Atual)
- ✅ Geração de música com IA
- ✅ Verificação de status
- ✅ Salvamento de feedback
- ✅ Health checks

#### v1.1.0 (Planejado)
- 📋 Sistema de autenticação
- 📋 Rate limiting
- 📋 Histórico de músicas
- 📋 Melhorias de performance

#### v1.2.0 (Planejado)
- 📋 API pública
- 📋 Webhooks
- 📋 Múltiplos formatos de áudio
- 📋 Edição de letras

## 10. Exemplos de Uso

### 10.1 Fluxo Completo de Geração

#### Passo 1: Iniciar Geração
```bash
curl -X POST https://memora-music.vercel.app/api/generate-preview \
  -H "Content-Type: application/json" \
  -d '{
    "occasion": "aniversário",
    "recipientName": "Maria",
    "relationship": "esposa",
    "senderName": "João",
    "genre": "MPB",
    "emotion": "Romântica",
    "vocalPreference": "Masculina",
    "duration": "2-3 minutos"
  }'
```

#### Passo 2: Verificar Status (Polling)
```bash
curl https://memora-music.vercel.app/api/check-music-status/task_abc123def456
```

#### Passo 3: Salvar Feedback
```bash
curl -X POST https://memora-music.vercel.app/api/save-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "difficulty": 2,
    "wouldRecommend": true,
    "willingToPay": "R$ 5-10"
  }'
```

### 10.2 Implementação de Cliente JavaScript

```javascript
class MemoraMusicAPI {
  constructor(baseURL = 'https://memora-music.vercel.app/api') {
    this.baseURL = baseURL;
  }

  async generateMusic(data) {
    const response = await fetch(`${this.baseURL}/generate-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async checkStatus(taskId) {
    const response = await fetch(`${this.baseURL}/check-music-status/${taskId}`);
    return response.json();
  }

  async saveFeedback(feedback) {
    const response = await fetch(`${this.baseURL}/save-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedback)
    });
    return response.json();
  }

  async pollStatus(taskId, onUpdate, maxAttempts = 45) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.checkStatus(taskId);
      onUpdate(status);
      
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        return status;
      }
      
      await new Promise(resolve => setTimeout(resolve, 7000));
    }
    throw new Error('Timeout: Geração não concluída no tempo esperado');
  }
}

// Uso
const api = new MemoraMusicAPI();

// Gerar música
const result = await api.generateMusic({
  occasion: 'aniversário',
  recipientName: 'Maria',
  // ... outros campos
});

if (result.success && result.taskId) {
  // Polling de status
  const finalStatus = await api.pollStatus(result.taskId, (status) => {
    console.log(`Status: ${status.status}, Clipes: ${status.completedClips}/${status.totalExpected}`);
  });
  
  if (finalStatus.status === 'COMPLETED') {
    console.log('Música gerada com sucesso!', finalStatus.audioClips);
  }
}
```

## 11. Troubleshooting

### 11.1 Problemas Comuns

#### Timeout na Geração
**Sintoma**: Requisição para `/api/generate-preview` demora mais que 60s
**Causa**: Sobrecarga nos serviços de IA
**Solução**: Implementar retry com backoff exponencial

#### Tarefa Não Encontrada
**Sintoma**: `/api/check-music-status/:taskId` retorna 404
**Causa**: TaskId inválido ou tarefa expirada
**Solução**: Verificar taskId e implementar persistência

#### Falha na Geração de Áudio
**Sintoma**: Status permanece em "PROCESSING" indefinidamente
**Causa**: Falha na Suno AI API
**Solução**: Implementar timeout e retry logic

### 11.2 Códigos de Debug

#### Ativar Logs Detalhados
```bash
DEBUG=memora:* npm start
```

#### Verificar Health da API
```bash
curl https://memora-music.vercel.app/api/health
```

#### Testar Conectividade
```bash
curl -I https://memora-music.vercel.app/api/health
```

## 12. Roadmap da API

### 12.1 Próximas Versões

#### v1.1 - Autenticação e Limites
- Sistema de autenticação JWT
- Rate limiting por usuário
- Histórico de músicas
- Endpoints de usuário

#### v1.2 - Funcionalidades Avançadas
- Edição de letras
- Múltiplos formatos de áudio
- Templates de música
- Compartilhamento social

#### v2.0 - API Pública
- API pública para desenvolvedores
- Webhooks para notificações
- SDK em múltiplas linguagens
- Dashboard para desenvolvedores

### 12.2 Melhorias de Infraestrutura

#### Curto Prazo
- Implementar Redis para cache
- Adicionar monitoramento com Sentry
- Implementar CI/CD

#### Médio Prazo
- Migrar para arquitetura de microserviços
- Implementar load balancer
- Adicionar CDN para arquivos de áudio

#### Longo Prazo
- Kubernetes para orquestração
- Machine learning próprio
- Edge computing para baixa latência

Esta documentação serve como referência completa para desenvolvedores que desejam integrar com a API da Memora Music, fornecendo todos os detalhes necessários para uma implementação bem-sucedida.