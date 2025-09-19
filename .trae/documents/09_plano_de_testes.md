# Plano de Testes - Memora Music

## 1. Visão Geral

### 1.1 Objetivo
Este documento define a estratégia de testes para a plataforma Memora Music, garantindo qualidade, confiabilidade e performance em todas as funcionalidades do sistema.

### 1.2 Escopo
- Testes de funcionalidades core (geração de música)
- Testes de interface de usuário
- Testes de API e integrações
- Testes de performance e carga
- Testes de segurança
- Testes de compatibilidade

### 1.3 Estratégia de Testes

#### Pirâmide de Testes
```
        E2E Tests (10%)
      ┌─────────────────┐
     │   Integration    │ (20%)
    │     Tests        │
   └─────────────────────┘
  │    Unit Tests (70%)   │
 └─────────────────────────┘
```

#### Tipos de Teste
- **Unitários**: Funções isoladas, componentes React
- **Integração**: APIs, serviços externos, fluxos de dados
- **E2E**: Jornadas completas do usuário
- **Performance**: Tempo de resposta, throughput
- **Segurança**: Vulnerabilidades, autenticação
- **Usabilidade**: Experiência do usuário

## 2. Ambiente de Testes

### 2.1 Configuração de Ambientes

#### Desenvolvimento Local
```bash
# Configuração para testes locais
NODE_ENV=test
API_BASE_URL=http://localhost:3001
OPENAI_API_KEY=test-key
SUNO_API_KEY=test-key
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=test-key
```

#### Staging
```bash
# Ambiente de homologação
NODE_ENV=staging
API_BASE_URL=https://staging-api.memoramusic.com
OPENAI_API_KEY=staging-key
SUNO_API_KEY=staging-key
SUPABASE_URL=https://staging.supabase.co
SUPABASE_ANON_KEY=staging-key
```

### 2.2 Dados de Teste

#### Fixtures
```typescript
// fixtures/musicData.ts
export const mockMusicRequest = {
  briefing: "Uma música alegre sobre verão",
  lyrics: "Sol brilhando, mar azul...",
  style: "Pop",
  mood: "Alegre"
};

export const mockGeneratedMusic = {
  id: "test-task-123",
  status: "completed",
  audioUrl: "https://test.com/audio.mp3",
  metadata: {
    duration: 180,
    genre: "Pop",
    bpm: 120
  }
};
```

#### Mocks de APIs Externas
```typescript
// mocks/openai.ts
export const mockOpenAIResponse = {
  choices: [{
    message: {
      content: "Verso 1:\nSol brilhando no céu azul..."
    }
  }]
};

// mocks/sunoai.ts
export const mockSunoResponse = {
  id: "suno-task-123",
  status: "processing",
  audio_url: null
};
```

## 3. Testes Unitários

### 3.1 Frontend - Componentes React

#### Configuração
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  }
});
```

#### Exemplo de Teste de Componente
```typescript
// components/MusicCreator/MusicCreator.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MusicCreator } from './MusicCreator';
import { useMusicStore } from '../../store/musicStore';

// Mock do store
vi.mock('../../store/musicStore');

describe('MusicCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render briefing step initially', () => {
    render(<MusicCreator />);
    expect(screen.getByText('Conte-nos sobre sua música')).toBeInTheDocument();
  });

  it('should advance to lyrics step after briefing', async () => {
    const mockGenerateLyrics = vi.fn();
    (useMusicStore as any).mockReturnValue({
      currentStep: 1,
      generateLyrics: mockGenerateLyrics
    });

    render(<MusicCreator />);
    
    const briefingInput = screen.getByPlaceholderText('Descreva sua música...');
    fireEvent.change(briefingInput, { target: { value: 'Música sobre verão' } });
    
    const nextButton = screen.getByText('Próximo');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockGenerateLyrics).toHaveBeenCalledWith('Música sobre verão');
    });
  });

  it('should handle generation errors gracefully', async () => {
    const mockGenerateLyrics = vi.fn().mockRejectedValue(new Error('API Error'));
    (useMusicStore as any).mockReturnValue({
      currentStep: 1,
      generateLyrics: mockGenerateLyrics,
      error: 'Erro ao gerar letra'
    });

    render(<MusicCreator />);
    
    expect(screen.getByText('Erro ao gerar letra')).toBeInTheDocument();
  });
});
```

### 3.2 Backend - Serviços e Utilitários

#### Teste de Serviço
```typescript
// services/musicService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MusicService } from './musicService';
import { OpenAIService } from './openaiService';
import { SunoService } from './sunoService';

// Mocks
vi.mock('./openaiService');
vi.mock('./sunoService');

describe('MusicService', () => {
  let musicService: MusicService;
  let mockOpenAI: any;
  let mockSuno: any;

  beforeEach(() => {
    mockOpenAI = {
      generateLyrics: vi.fn()
    };
    mockSuno = {
      generateMusic: vi.fn(),
      checkStatus: vi.fn()
    };
    
    (OpenAIService as any).mockImplementation(() => mockOpenAI);
    (SunoService as any).mockImplementation(() => mockSuno);
    
    musicService = new MusicService();
  });

  describe('generateLyrics', () => {
    it('should generate lyrics from briefing', async () => {
      const briefing = 'Música sobre verão';
      const expectedLyrics = 'Sol brilhando...';
      
      mockOpenAI.generateLyrics.mockResolvedValue(expectedLyrics);

      const result = await musicService.generateLyrics(briefing);

      expect(mockOpenAI.generateLyrics).toHaveBeenCalledWith(briefing);
      expect(result).toBe(expectedLyrics);
    });

    it('should handle OpenAI API errors', async () => {
      mockOpenAI.generateLyrics.mockRejectedValue(new Error('API Error'));

      await expect(musicService.generateLyrics('test'))
        .rejects.toThrow('Erro ao gerar letra');
    });
  });

  describe('generateMusic', () => {
    it('should create music generation task', async () => {
      const request = {
        lyrics: 'Test lyrics',
        style: 'Pop',
        mood: 'Alegre'
      };
      
      const taskId = 'task-123';
      mockSuno.generateMusic.mockResolvedValue({ id: taskId });

      const result = await musicService.generateMusic(request);

      expect(mockSuno.generateMusic).toHaveBeenCalledWith(request);
      expect(result.id).toBe(taskId);
      expect(result.status).toBe('processing');
    });
  });
});
```

### 3.3 Utilitários e Helpers

```typescript
// utils/validation.test.ts
import { validateMusicRequest, sanitizeInput } from './validation';

describe('Validation Utils', () => {
  describe('validateMusicRequest', () => {
    it('should validate correct music request', () => {
      const request = {
        briefing: 'Música sobre verão',
        lyrics: 'Sol brilhando...',
        style: 'Pop'
      };

      const result = validateMusicRequest(request);
      expect(result.success).toBe(true);
    });

    it('should reject empty briefing', () => {
      const request = {
        briefing: '',
        lyrics: 'Test',
        style: 'Pop'
      };

      const result = validateMusicRequest(request);
      expect(result.success).toBe(false);
      expect(result.error).toContain('briefing');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });
  });
});
```

## 4. Testes de Integração

### 4.1 Testes de API

```typescript
// api/integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { setupTestDB, cleanupTestDB } from '../test/helpers';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  describe('POST /api/generate-preview', () => {
    it('should generate lyrics from briefing', async () => {
      const response = await request(app)
        .post('/api/generate-preview')
        .send({
          type: 'lyrics',
          briefing: 'Música sobre verão'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lyrics).toBeDefined();
      expect(response.body.data.lyrics.length).toBeGreaterThan(0);
    });

    it('should start music generation', async () => {
      const response = await request(app)
        .post('/api/generate-preview')
        .send({
          type: 'audio',
          lyrics: 'Sol brilhando no céu azul',
          style: 'Pop',
          mood: 'Alegre'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.taskId).toBeDefined();
      expect(response.body.data.status).toBe('processing');
    });

    it('should validate request data', async () => {
      const response = await request(app)
        .post('/api/generate-preview')
        .send({
          type: 'lyrics'
          // missing briefing
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('briefing');
    });
  });

  describe('GET /api/check-music-status/:taskId', () => {
    it('should return task status', async () => {
      // First create a task
      const createResponse = await request(app)
        .post('/api/generate-preview')
        .send({
          type: 'audio',
          lyrics: 'Test lyrics',
          style: 'Pop'
        });

      const taskId = createResponse.body.data.taskId;

      // Then check status
      const statusResponse = await request(app)
        .get(`/api/check-music-status/${taskId}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.status).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .get('/api/check-music-status/non-existent')
        .expect(404);
    });
  });

  describe('POST /api/save-feedback', () => {
    it('should save user feedback', async () => {
      const feedback = {
        rating: 5,
        comment: 'Excelente música!',
        musicStyle: 'Pop',
        improvements: ['Mais instrumentos']
      };

      const response = await request(app)
        .post('/api/save-feedback')
        .send(feedback)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
```

### 4.2 Testes de Serviços Externos

```typescript
// services/external.integration.test.ts
import { OpenAIService } from './openaiService';
import { SunoService } from './sunoService';

// Testes com APIs reais (executados apenas em staging)
describe('External Services Integration', () => {
  const isStaging = process.env.NODE_ENV === 'staging';
  
  describe.skipIf(!isStaging)('OpenAI Integration', () => {
    let openaiService: OpenAIService;

    beforeAll(() => {
      openaiService = new OpenAIService();
    });

    it('should generate lyrics from briefing', async () => {
      const briefing = 'Uma música alegre sobre verão na praia';
      
      const lyrics = await openaiService.generateLyrics(briefing);
      
      expect(lyrics).toBeDefined();
      expect(lyrics.length).toBeGreaterThan(50);
      expect(lyrics).toContain('verão' || 'praia');
    }, 30000); // 30s timeout

    it('should handle rate limiting gracefully', async () => {
      // Fazer múltiplas requisições rapidamente
      const promises = Array(5).fill(0).map(() => 
        openaiService.generateLyrics('Test briefing')
      );

      const results = await Promise.allSettled(promises);
      
      // Pelo menos uma deve ter sucesso
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe.skipIf(!isStaging)('Suno AI Integration', () => {
    let sunoService: SunoService;

    beforeAll(() => {
      sunoService = new SunoService();
    });

    it('should start music generation', async () => {
      const request = {
        lyrics: 'Sol brilhando no céu azul\nVerão chegou para ficar',
        style: 'Pop',
        mood: 'Alegre'
      };
      
      const task = await sunoService.generateMusic(request);
      
      expect(task.id).toBeDefined();
      expect(task.status).toBe('processing');
    }, 30000);

    it('should check task status', async () => {
      // Usar um task ID conhecido do staging
      const taskId = process.env.TEST_SUNO_TASK_ID;
      
      if (taskId) {
        const status = await sunoService.checkStatus(taskId);
        
        expect(status).toBeDefined();
        expect(['processing', 'completed', 'failed']).toContain(status.status);
      }
    }, 15000);
  });
});
```

## 5. Testes End-to-End (E2E)

### 5.1 Configuração Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### 5.2 Testes de Jornada do Usuário

```typescript
// e2e/music-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Music Creation Flow', () => {
  test('should complete full music creation journey', async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('/');
    
    // Verificar se a página carregou
    await expect(page.getByText('Crie sua música com IA')).toBeVisible();
    
    // Clicar no botão "Começar"
    await page.getByRole('button', { name: 'Começar' }).click();
    
    // Passo 1: Briefing
    await expect(page.getByText('Conte-nos sobre sua música')).toBeVisible();
    
    const briefingInput = page.getByPlaceholder('Descreva sua música...');
    await briefingInput.fill('Uma música alegre sobre verão na praia com guitarra');
    
    await page.getByRole('button', { name: 'Próximo' }).click();
    
    // Aguardar geração da letra
    await expect(page.getByText('Gerando letra...')).toBeVisible();
    await expect(page.getByText('Letra gerada com sucesso!')).toBeVisible({ timeout: 30000 });
    
    // Passo 2: Letra
    await expect(page.getByText('Revise e edite a letra')).toBeVisible();
    
    const lyricsTextarea = page.getByRole('textbox', { name: 'Letra da música' });
    await expect(lyricsTextarea).toHaveValue(/verão|praia/i);
    
    await page.getByRole('button', { name: 'Próximo' }).click();
    
    // Passo 3: Estilo
    await expect(page.getByText('Escolha o estilo musical')).toBeVisible();
    
    await page.getByRole('button', { name: 'Pop' }).click();
    await page.getByRole('button', { name: 'Próximo' }).click();
    
    // Passo 4: Prévia
    await expect(page.getByText('Sua música está sendo criada')).toBeVisible();
    
    // Aguardar geração do áudio (pode demorar)
    await expect(page.getByText('Música gerada com sucesso!')).toBeVisible({ timeout: 300000 }); // 5 min
    
    // Verificar se o player de áudio apareceu
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    
    // Testar reprodução
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    
    // Testar download
    const downloadPromise = page.waitForDownload();
    await page.getByRole('button', { name: 'Download' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.mp3$/);
    
    // Testar feedback
    await page.getByRole('button', { name: 'Avaliar' }).click();
    
    await page.getByRole('button', { name: '5 estrelas' }).click();
    await page.getByPlaceholder('Deixe seu comentário...').fill('Música incrível!');
    await page.getByRole('button', { name: 'Enviar Feedback' }).click();
    
    await expect(page.getByText('Obrigado pelo seu feedback!')).toBeVisible();
  });

  test('should handle generation errors gracefully', async ({ page }) => {
    // Mock de erro na API
    await page.route('**/api/generate-preview', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Erro interno do servidor'
        })
      });
    });
    
    await page.goto('/');
    await page.getByRole('button', { name: 'Começar' }).click();
    
    await page.getByPlaceholder('Descreva sua música...').fill('Test briefing');
    await page.getByRole('button', { name: 'Próximo' }).click();
    
    // Verificar se o erro é exibido
    await expect(page.getByText('Erro ao gerar letra')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar Novamente' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/');
    
    // Verificar se o layout mobile está correto
    await expect(page.getByText('Crie sua música com IA')).toBeVisible();
    
    const startButton = page.getByRole('button', { name: 'Começar' });
    await expect(startButton).toBeVisible();
    
    // Verificar se o botão é clicável em mobile
    await startButton.click();
    await expect(page.getByText('Conte-nos sobre sua música')).toBeVisible();
  });
});
```

### 5.3 Testes de Performance

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Homepage deve carregar em menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
    
    // Verificar Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
          const fid = entries.find(entry => entry.entryType === 'first-input');
          const cls = entries.find(entry => entry.entryType === 'layout-shift');
          
          resolve({ lcp: lcp?.startTime, fid: fid?.processingStart, cls: cls?.value });
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Timeout após 10 segundos
        setTimeout(() => resolve({}), 10000);
      });
    });
    
    // LCP deve ser menor que 2.5s
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500);
    }
    
    // CLS deve ser menor que 0.1
    if (metrics.cls) {
      expect(metrics.cls).toBeLessThan(0.1);
    }
  });

  test('should handle concurrent users', async ({ browser }) => {
    const contexts = await Promise.all(
      Array(5).fill(0).map(() => browser.newContext())
    );
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );
    
    // Simular 5 usuários acessando simultaneamente
    const startTime = Date.now();
    
    await Promise.all(
      pages.map(page => page.goto('/'))
    );
    
    const loadTime = Date.now() - startTime;
    
    // Deve suportar 5 usuários simultâneos sem degradação significativa
    expect(loadTime).toBeLessThan(5000);
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
  });
});
```

## 6. Testes de Performance

### 6.1 Testes de Carga

```javascript
// performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições < 2s
    http_req_failed: ['rate<0.1'],     // Taxa de erro < 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'https://memoramusic.com';

export default function () {
  // Teste da homepage
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in <2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Teste de geração de letra
  const lyricsPayload = JSON.stringify({
    type: 'lyrics',
    briefing: 'Uma música sobre verão'
  });

  response = http.post(`${BASE_URL}/api/generate-preview`, lyricsPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'lyrics generation status is 200': (r) => r.status === 200,
    'lyrics generation response time <30s': (r) => r.timings.duration < 30000,
    'lyrics generation returns data': (r) => {
      const body = JSON.parse(r.body);
      return body.success && body.data.lyrics;
    },
  }) || errorRate.add(1);

  sleep(2);

  // Teste de health check
  response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time <500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);
}
```

### 6.2 Testes de Stress

```javascript
// performance/stress-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Mais tolerante em stress test
    http_req_failed: ['rate<0.3'],     // Taxa de erro < 30%
  },
};

const BASE_URL = 'https://memoramusic.com';

export default function () {
  const response = http.get(`${BASE_URL}/api/health`);
  
  check(response, {
    'status is 200 or 503': (r) => [200, 503].includes(r.status),
    'response time <5s': (r) => r.timings.duration < 5000,
  });
}
```

## 7. Testes de Segurança

### 7.1 Testes de Vulnerabilidades

```typescript
// security/security.test.ts
import request from 'supertest';
import { app } from '../app';

describe('Security Tests', () => {
  describe('Input Validation', () => {
    it('should prevent XSS attacks', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/generate-preview')
        .send({
          type: 'lyrics',
          briefing: maliciousInput
        });
      
      // Verificar se o input foi sanitizado
      expect(response.body.data?.lyrics).not.toContain('<script>');
    });

    it('should prevent SQL injection', async () => {
      const sqlInjection = "'; DROP TABLE user_creations; --";
      
      const response = await request(app)
        .post('/api/save-feedback')
        .send({
          rating: 5,
          comment: sqlInjection
        });
      
      // Deve retornar erro de validação, não erro de SQL
      expect(response.status).toBe(400);
      expect(response.body.error).not.toContain('SQL');
    });

    it('should validate file uploads', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('malicious content'), 'malware.exe')
        .expect(400);
      
      expect(response.body.error).toContain('tipo de arquivo');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(20).fill(0).map(() => 
        request(app).get('/api/health')
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      await request(app)
        .get('/api/user/profile')
        .expect(401);
    });

    it('should validate JWT tokens', async () => {
      await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('CORS', () => {
    it('should enforce CORS policy', async () => {
      const response = await request(app)
        .options('/api/generate-preview')
        .set('Origin', 'https://malicious-site.com')
        .expect(403);
    });

    it('should allow legitimate origins', async () => {
      const response = await request(app)
        .options('/api/generate-preview')
        .set('Origin', 'https://memoramusic.com')
        .expect(200);
    });
  });
});
```

### 7.2 Testes de Penetração Automatizados

```bash
#!/bin/bash
# security/pentest.sh

echo "Running automated security tests..."

# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.memoramusic.com \
  -J zap-report.json

# Nuclei vulnerability scanner
nuclei -u https://staging.memoramusic.com \
  -t nuclei-templates/ \
  -o nuclei-report.txt

# SSL/TLS testing
testssl.sh --jsonfile ssl-report.json https://staging.memoramusic.com

echo "Security tests completed. Check reports for vulnerabilities."
```

## 8. Automação e CI/CD

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test
          OPENAI_API_KEY: ${{ secrets.OPENAI_TEST_KEY }}
          SUNO_API_KEY: ${{ secrets.SUNO_TEST_KEY }}

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Run K6 load tests
        uses: grafana/k6-action@v0.2.0
        with:
          filename: performance/load-test.js
        env:
          BASE_URL: https://staging.memoramusic.com

  security-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security scan
        run: |
          docker run --rm -v $(pwd):/zap/wrk/:rw \
            -t owasp/zap2docker-stable zap-baseline.py \
            -t https://staging.memoramusic.com \
            -J zap-report.json
      
      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: zap-report.json
```

### 8.2 Scripts de Teste

```json
// package.json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run --coverage",
    "test:unit:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:performance": "k6 run performance/load-test.js",
    "test:security": "./security/pentest.sh",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

## 9. Métricas e Relatórios

### 9.1 Cobertura de Código

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Thresholds específicos por arquivo
        './src/services/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test/',
        '**/e2e/'
      ]
    }
  }
});
```

### 9.2 Relatórios de Qualidade

```typescript
// scripts/test-report.ts
import fs from 'fs';
import path from 'path';

interface TestResults {
  unit: {
    passed: number;
    failed: number;
    coverage: number;
  };
  integration: {
    passed: number;
    failed: number;
  };
  e2e: {
    passed: number;
    failed: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
  };
}

function generateTestReport(results: TestResults) {
  const report = `
# Relatório de Testes - ${new Date().toISOString()}

## Resumo Executivo

- **Testes Unitários**: ${results.unit.passed}/${results.unit.passed + results.unit.failed} (${((results.unit.passed / (results.unit.passed + results.unit.failed)) * 100).toFixed(1)}%)
- **Cobertura de Código**: ${results.unit.coverage}%
- **Testes de Integração**: ${results.integration.passed}/${results.integration.passed + results.integration.failed}
- **Testes E2E**: ${results.e2e.passed}/${results.e2e.passed + results.e2e.failed}
- **Performance**: ${results.performance.avgResponseTime}ms (${results.performance.errorRate}% erro)

## Status Geral

${getOverallStatus(results)}

## Recomendações

${getRecommendations(results)}
  `;

  fs.writeFileSync('test-report.md', report);
  console.log('Relatório de testes gerado: test-report.md');
}

function getOverallStatus(results: TestResults): string {
  const unitSuccess = results.unit.failed === 0;
  const integrationSuccess = results.integration.failed === 0;
  const e2eSuccess = results.e2e.failed === 0;
  const coverageOk = results.unit.coverage >= 80;
  const performanceOk = results.performance.errorRate < 5;

  if (unitSuccess && integrationSuccess && e2eSuccess && coverageOk && performanceOk) {
    return '✅ **APROVADO** - Todos os testes passaram com sucesso';
  } else {
    return '❌ **REPROVADO** - Existem falhas que precisam ser corrigidas';
  }
}

function getRecommendations(results: TestResults): string {
  const recommendations = [];

  if (results.unit.coverage < 80) {
    recommendations.push('- Aumentar cobertura de testes unitários para pelo menos 80%');
  }

  if (results.unit.failed > 0) {
    recommendations.push('- Corrigir testes unitários que estão falhando');
  }

  if (results.performance.errorRate > 5) {
    recommendations.push('- Investigar e corrigir problemas de performance');
  }

  if (recommendations.length === 0) {
    recommendations.push('- Manter a qualidade atual dos testes');
    recommendations.push('- Considerar adicionar mais testes de edge cases');
  }

  return recommendations.join('\n');
}
```

## 10. Cronograma de Execução

### 10.1 Fases de Implementação

#### Fase 1: Fundação (Semanas 1-2)
- ✅ Configuração do ambiente de testes
- ✅ Testes unitários básicos
- ✅ Configuração do CI/CD
- 🔄 Testes de integração da API

#### Fase 2: Cobertura Completa (Semanas 3-4)
- 🔄 Testes unitários completos (>80% cobertura)
- 📋 Testes de integração com serviços externos
- 📋 Testes E2E básicos

#### Fase 3: Qualidade Avançada (Semanas 5-6)
- 📋 Testes E2E completos
- 📋 Testes de performance
- 📋 Testes de segurança

#### Fase 4: Automação e Monitoramento (Semanas 7-8)
- 📋 Automação completa no CI/CD
- 📋 Relatórios automatizados
- 📋 Monitoramento contínuo

### 10.2 Critérios de Aceite

#### Para Release em Produção
- [ ] Cobertura de testes unitários ≥ 80%
- [ ] Todos os testes de integração passando
- [ ] Testes E2E críticos passando
- [ ] Performance dentro dos SLAs
- [ ] Sem vulnerabilidades críticas
- [ ] Relatórios de qualidade aprovados

## 11. Conclusão

Este plano de testes garante a qualidade e confiabilidade da plataforma Memora Music através de:

### Pontos Fortes
- **Cobertura Abrangente**: Testes em todas as camadas
- **Automação Completa**: CI/CD integrado
- **Qualidade Contínua**: Monitoramento e relatórios
- **Segurança**: Testes de vulnerabilidades
- **Performance**: Validação de SLAs

### Próximos Passos
1. Implementar testes unitários faltantes
2. Completar testes de integração
3. Configurar testes E2E
4. Implementar testes de performance
5. Adicionar testes de segurança
6. Automatizar relatórios

### Métricas de Sucesso
- Cobertura de código > 80%
- Taxa de falha em produção < 1%
- Tempo de detecção de bugs < 1 hora
- Tempo de correção de bugs críticos < 4 horas
- Performance dentro dos SLAs 99% do tempo

Este plano será revisado e atualizado conforme a evolução do projeto e feedback da equipe.