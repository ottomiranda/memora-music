# Documentação de Segurança - Memora Music

## 1. Visão Geral de Segurança

### 1.1 Objetivo
Este documento define as políticas, procedimentos e implementações de segurança da plataforma Memora Music, garantindo a proteção de dados dos usuários, integridade do sistema e conformidade com regulamentações.

### 1.2 Escopo
- Segurança da aplicação web
- Proteção de dados pessoais
- Segurança de APIs e integrações
- Infraestrutura e deploy
- Monitoramento e resposta a incidentes
- Conformidade com LGPD/GDPR

### 1.3 Princípios de Segurança

#### Defesa em Profundidade
```
┌─────────────────────────────────────┐
│           WAF/CDN                   │
├─────────────────────────────────────┤
│        Rate Limiting                │
├─────────────────────────────────────┤
│      Input Validation               │
├─────────────────────────────────────┤
│     Authentication                  │
├─────────────────────────────────────┤
│      Authorization                  │
├─────────────────────────────────────┤
│    Data Encryption                  │
├─────────────────────────────────────┤
│   Secure Infrastructure             │
└─────────────────────────────────────┘
```

#### Princípios Fundamentais
1. **Menor Privilégio**: Acesso mínimo necessário
2. **Falha Segura**: Sistema falha em estado seguro
3. **Segurança por Design**: Segurança desde o início
4. **Transparência**: Logs e auditoria completos
5. **Validação Contínua**: Testes e monitoramento constantes

## 2. Arquitetura de Segurança

### 2.1 Modelo de Ameaças

#### Ameaças Identificadas

| Ameaça | Probabilidade | Impacto | Risco | Mitigação |
|--------|---------------|---------|-------|----------|
| Injeção SQL | Baixa | Alto | Médio | Validação de entrada, ORM |
| XSS | Média | Médio | Médio | Sanitização, CSP |
| CSRF | Baixa | Médio | Baixo | Tokens CSRF, SameSite |
| DDoS | Alta | Alto | Alto | Rate limiting, CDN |
| Vazamento de dados | Baixa | Muito Alto | Alto | Criptografia, controle de acesso |
| Ataques de força bruta | Média | Médio | Médio | Rate limiting, captcha |
| Man-in-the-middle | Baixa | Alto | Médio | HTTPS, HSTS |
| Engenharia social | Média | Alto | Alto | Treinamento, 2FA |

#### Superfície de Ataque
```mermaid
graph TD
    A[Internet] --> B[CDN/WAF]
    B --> C[Load Balancer]
    C --> D[Frontend App]
    C --> E[API Gateway]
    E --> F[Backend Services]
    F --> G[Database]
    F --> H[External APIs]
    
    subgraph "Attack Vectors"
        I[Web Attacks]
        J[API Attacks]
        K[Infrastructure]
        L[Social Engineering]
    end
    
    I --> D
    J --> E
    K --> C
    L --> A
```

### 2.2 Controles de Segurança

#### Controles Preventivos
- Input validation e sanitização
- Autenticação e autorização
- Criptografia de dados
- Rate limiting
- CORS policy
- Content Security Policy (CSP)

#### Controles Detectivos
- Logging e monitoramento
- Alertas de segurança
- Análise de comportamento
- Vulnerability scanning

#### Controles Corretivos
- Incident response plan
- Backup e recovery
- Patch management
- Security updates

## 3. Segurança da Aplicação

### 3.1 Validação de Entrada

#### Implementação com Zod
```typescript
// schemas/validation.ts
import { z } from 'zod';
import DOMPurify from 'dompurify';

// Schema para briefing de música
export const musicBriefingSchema = z.object({
  briefing: z.string()
    .min(10, 'Briefing deve ter pelo menos 10 caracteres')
    .max(1000, 'Briefing não pode exceder 1000 caracteres')
    .refine(val => !containsMaliciousContent(val), 'Conteúdo não permitido'),
  
  style: z.enum(['Pop', 'Rock', 'Jazz', 'Classical', 'Electronic']),
  
  mood: z.enum(['Alegre', 'Triste', 'Energético', 'Relaxante', 'Romântico'])
});

// Schema para feedback
export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  
  comment: z.string()
    .max(500, 'Comentário não pode exceder 500 caracteres')
    .optional()
    .transform(val => val ? DOMPurify.sanitize(val) : val),
  
  musicStyle: z.string().max(50),
  
  improvements: z.array(z.string().max(100)).max(10)
});

// Função para detectar conteúdo malicioso
function containsMaliciousContent(input: string): boolean {
  const maliciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(input));
}

// Middleware de validação
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
}
```

#### Sanitização de Dados
```typescript
// utils/sanitization.ts
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Configurar DOMPurify para Node.js
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export class DataSanitizer {
  static sanitizeHTML(input: string): string {
    return purify.sanitize(input, {
      ALLOWED_TAGS: [], // Não permitir tags HTML
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }
  
  static sanitizeText(input: string): string {
    return input
      .replace(/[<>"'&]/g, (match) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[match];
      })
      .trim();
  }
  
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }
  
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }
}
```

### 3.2 Autenticação e Autorização

#### Sistema de Autenticação (Futuro)
```typescript
// auth/authService.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Senha deve conter ao menos: 1 minúscula, 1 maiúscula, 1 número e 1 símbolo'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100)
});

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly JWT_EXPIRES_IN = '7d';
  
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  static generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }
  
  static verifyToken(token: string): { userId: string; email: string } | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { userId: string; email: string };
    } catch {
      return null;
    }
  }
  
  static async register(data: unknown) {
    const validatedData = registerSchema.parse(data);
    
    // Verificar se email já existe
    const existingUser = await this.findUserByEmail(validatedData.email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }
    
    // Hash da senha
    const passwordHash = await this.hashPassword(validatedData.password);
    
    // Criar usuário
    const user = await this.createUser({
      email: validatedData.email,
      passwordHash,
      name: validatedData.name
    });
    
    // Gerar token
    const token = this.generateToken(user.id, user.email);
    
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }
  
  static async login(data: unknown) {
    const validatedData = loginSchema.parse(data);
    
    // Buscar usuário
    const user = await this.findUserByEmail(validatedData.email);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }
    
    // Verificar senha
    const isValidPassword = await this.verifyPassword(validatedData.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }
    
    // Gerar token
    const token = this.generateToken(user.id, user.email);
    
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }
  
  private static async findUserByEmail(email: string) {
    // Implementar busca no banco de dados
    // return await db.user.findUnique({ where: { email } });
  }
  
  private static async createUser(data: { email: string; passwordHash: string; name: string }) {
    // Implementar criação no banco de dados
    // return await db.user.create({ data });
  }
}
```

#### Middleware de Autenticação
```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/authService';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso requerido'
    });
  }
  
  const token = authHeader.substring(7);
  const decoded = AuthService.verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado'
    });
  }
  
  req.user = decoded;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);
    
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
}
```

### 3.3 Proteção contra Ataques

#### Rate Limiting
```typescript
// middleware/rateLimiting.ts
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Configurar Redis (se disponível)
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

// Rate limiting geral
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }) : undefined
});

// Rate limiting para geração de música (mais restritivo)
export const musicGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 gerações por hora por IP
  message: {
    success: false,
    error: 'Limite de gerações atingido. Tente novamente em 1 hora.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }) : undefined
});

// Slow down para requisições frequentes
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 50, // Começar a atrasar após 50 requests
  delayMs: 500, // Atraso de 500ms por request adicional
  maxDelayMs: 20000, // Máximo de 20 segundos de atraso
});

// Rate limiting para login (proteção contra força bruta)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login por IP
  skipSuccessfulRequests: true, // Não contar logins bem-sucedidos
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  }
});
```

#### Content Security Policy
```typescript
// middleware/security.ts
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Necessário para Vite em desenvolvimento
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:"
      ],
      mediaSrc: [
        "'self'",
        "https://cdn.openai.com",
        "https://suno.ai",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://api.suno.ai",
        "wss://localhost:*" // WebSocket para desenvolvimento
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// CORS configurado
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://memoramusic.com',
    'https://www.memoramusic.com'
  ];
  
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}
```

## 4. Segurança de Dados

### 4.1 Criptografia

#### Criptografia em Trânsito
```typescript
// config/ssl.ts
import https from 'https';
import fs from 'fs';

// Configuração HTTPS para produção
export const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || '/path/to/private-key.pem'),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/path/to/certificate.pem'),
  // Configurações de segurança
  secureProtocol: 'TLSv1_2_method',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384'
  ].join(':'),
  honorCipherOrder: true
};

// Middleware para forçar HTTPS
export function forceHTTPS(req: Request, res: Response, next: NextFunction) {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
}
```

#### Criptografia em Repouso
```typescript
// utils/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, this.KEY);
    cipher.setAAD(Buffer.from('memora-music', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.ALGORITHM, this.KEY);
    decipher.setAAD(Buffer.from('memora-music', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
```

### 4.2 Proteção de Dados Pessoais (LGPD/GDPR)

#### Classificação de Dados
```typescript
// types/dataClassification.ts
export enum DataClassification {
  PUBLIC = 'public',           // Dados públicos
  INTERNAL = 'internal',       // Dados internos
  CONFIDENTIAL = 'confidential', // Dados confidenciais
  RESTRICTED = 'restricted'    // Dados restritos/sensíveis
}

export interface DataField {
  name: string;
  classification: DataClassification;
  retention: number; // dias
  encryption: boolean;
  anonymization: boolean;
}

// Mapeamento de dados do usuário
export const userDataFields: DataField[] = [
  {
    name: 'email',
    classification: DataClassification.CONFIDENTIAL,
    retention: 2555, // 7 anos
    encryption: true,
    anonymization: true
  },
  {
    name: 'name',
    classification: DataClassification.CONFIDENTIAL,
    retention: 2555,
    encryption: false,
    anonymization: true
  },
  {
    name: 'musicPreferences',
    classification: DataClassification.INTERNAL,
    retention: 1095, // 3 anos
    encryption: false,
    anonymization: true
  },
  {
    name: 'ipAddress',
    classification: DataClassification.RESTRICTED,
    retention: 90, // 3 meses
    encryption: true,
    anonymization: true
  }
];
```

#### Consentimento e Privacidade
```typescript
// services/privacyService.ts
export class PrivacyService {
  static async recordConsent(userId: string, consentType: string, granted: boolean) {
    const consent = {
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      ipAddress: this.hashIP(req.ip),
      userAgent: req.get('User-Agent')
    };
    
    // Salvar no banco de dados
    // await db.consent.create({ data: consent });
  }
  
  static async anonymizeUserData(userId: string) {
    // Anonimizar dados pessoais
    const anonymizedData = {
      email: this.anonymizeEmail(user.email),
      name: 'Usuário Anônimo',
      ipAddress: null,
      // Manter dados não pessoais para análise
      musicPreferences: user.musicPreferences,
      createdAt: user.createdAt
    };
    
    // Atualizar no banco
    // await db.user.update({ where: { id: userId }, data: anonymizedData });
  }
  
  static async deleteUserData(userId: string) {
    // Deletar todos os dados do usuário
    // await db.user.delete({ where: { id: userId } });
    // await db.musicHistory.deleteMany({ where: { userId } });
    // await db.feedback.deleteMany({ where: { userId } });
  }
  
  private static anonymizeEmail(email: string): string {
    const [local, domain] = email.split('@');
    const anonymizedLocal = local.substring(0, 2) + '***';
    return `${anonymizedLocal}@${domain}`;
  }
  
  private static hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip + process.env.IP_SALT).digest('hex');
  }
}
```

## 5. Segurança de Infraestrutura

### 5.1 Configuração Segura do Servidor

#### Dockerfile Seguro
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Instalar dependências de segurança
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY --chown=nextjs:nodejs . .

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Build da aplicação
RUN npm run build

# Remover arquivos desnecessários
RUN rm -rf .git .gitignore README.md docs/

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

#### Configuração de Ambiente
```bash
# .env.production
# Configurações de segurança
NODE_ENV=production
LOG_LEVEL=info

# Chaves de criptografia (geradas aleatoriamente)
JWT_SECRET=<generated-secret-256-bits>
ENCRYPTION_KEY=<generated-key-256-bits>
IP_SALT=<generated-salt>

# Configurações de banco
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# APIs externas
OPENAI_API_KEY=sk-prod-...
SUNO_API_KEY=prod-...

# Monitoramento
SENTRY_DSN=https://...
VERCEL_ANALYTICS_ID=...

# Configurações de segurança
CORS_ORIGIN=https://memoramusic.com
RATE_LIMIT_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/cert.pem
SSL_KEY_PATH=/etc/ssl/private/key.pem
```

### 5.2 Monitoramento de Segurança

#### Sistema de Logs de Segurança
```typescript
// logging/securityLogger.ts
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'memora-music-security' },
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export class SecurityLogger {
  static logAuthAttempt(email: string, success: boolean, ip: string, userAgent: string) {
    securityLogger.info('Authentication attempt', {
      event: 'auth_attempt',
      email: this.hashEmail(email),
      success,
      ip: this.hashIP(ip),
      userAgent,
      timestamp: new Date().toISOString()
    });
  }
  
  static logSuspiciousActivity(type: string, details: any, ip: string) {
    securityLogger.warn('Suspicious activity detected', {
      event: 'suspicious_activity',
      type,
      details,
      ip: this.hashIP(ip),
      timestamp: new Date().toISOString()
    });
  }
  
  static logSecurityIncident(severity: 'low' | 'medium' | 'high' | 'critical', description: string, details: any) {
    securityLogger.error('Security incident', {
      event: 'security_incident',
      severity,
      description,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  static logDataAccess(userId: string, dataType: string, action: string) {
    securityLogger.info('Data access', {
      event: 'data_access',
      userId: this.hashUserId(userId),
      dataType,
      action,
      timestamp: new Date().toISOString()
    });
  }
  
  private static hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email).digest('hex').substring(0, 8);
  }
  
  private static hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip + process.env.IP_SALT).digest('hex').substring(0, 8);
  }
  
  private static hashUserId(userId: string): string {
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8);
  }
}
```

#### Alertas de Segurança
```typescript
// monitoring/securityAlerts.ts
import { SecurityLogger } from '../logging/securityLogger';

export class SecurityAlerts {
  private static readonly ALERT_THRESHOLDS = {
    FAILED_LOGINS: 5,
    RATE_LIMIT_HITS: 10,
    SUSPICIOUS_REQUESTS: 3
  };
  
  private static failedLoginAttempts = new Map<string, number>();
  private static rateLimitHits = new Map<string, number>();
  
  static checkFailedLogins(ip: string) {
    const attempts = this.failedLoginAttempts.get(ip) || 0;
    this.failedLoginAttempts.set(ip, attempts + 1);
    
    if (attempts + 1 >= this.ALERT_THRESHOLDS.FAILED_LOGINS) {
      this.sendAlert('BRUTE_FORCE_ATTEMPT', {
        ip,
        attempts: attempts + 1
      });
    }
  }
  
  static checkRateLimitHits(ip: string) {
    const hits = this.rateLimitHits.get(ip) || 0;
    this.rateLimitHits.set(ip, hits + 1);
    
    if (hits + 1 >= this.ALERT_THRESHOLDS.RATE_LIMIT_HITS) {
      this.sendAlert('RATE_LIMIT_ABUSE', {
        ip,
        hits: hits + 1
      });
    }
  }
  
  static checkSuspiciousRequest(req: Request) {
    const suspiciousPatterns = [
      /\b(union|select|insert|delete|drop|create|alter)\b/i,
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /\.\.\//g
    ];
    
    const requestData = JSON.stringify({
      url: req.url,
      body: req.body,
      query: req.query,
      headers: req.headers
    });
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));
    
    if (isSuspicious) {
      SecurityLogger.logSuspiciousActivity('MALICIOUS_REQUEST', {
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent')
      }, req.ip);
      
      this.sendAlert('SUSPICIOUS_REQUEST', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
    }
  }
  
  private static async sendAlert(type: string, details: any) {
    // Enviar alerta via Slack, email, etc.
    console.error(`🚨 SECURITY ALERT: ${type}`, details);
    
    // Integração com Sentry
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(new Error(`Security Alert: ${type}`), {
      //   tags: { type: 'security_alert' },
      //   extra: details
      // });
    }
  }
}
```

## 6. Resposta a Incidentes

### 6.1 Plano de Resposta

#### Classificação de Incidentes

| Severidade | Descrição | Tempo de Resposta | Exemplos |
|------------|-----------|-------------------|----------|
| **Crítica** | Sistema comprometido, dados expostos | 15 minutos | Vazamento de dados, acesso não autorizado |
| **Alta** | Funcionalidade principal afetada | 1 hora | DDoS, falha de autenticação |
| **Média** | Funcionalidade secundária afetada | 4 horas | Rate limiting falhou, logs suspeitos |
| **Baixa** | Problema menor, sem impacto | 24 horas | Tentativas de scan, alertas falsos |

#### Procedimento de Resposta
```typescript
// incident/responseTeam.ts
export class IncidentResponse {
  static async handleSecurityIncident(severity: 'critical' | 'high' | 'medium' | 'low', details: any) {
    const incident = {
      id: this.generateIncidentId(),
      severity,
      details,
      timestamp: new Date(),
      status: 'open'
    };
    
    // Log do incidente
    SecurityLogger.logSecurityIncident(severity, 'Security incident detected', incident);
    
    // Ações baseadas na severidade
    switch (severity) {
      case 'critical':
        await this.handleCriticalIncident(incident);
        break;
      case 'high':
        await this.handleHighIncident(incident);
        break;
      case 'medium':
        await this.handleMediumIncident(incident);
        break;
      case 'low':
        await this.handleLowIncident(incident);
        break;
    }
  }
  
  private static async handleCriticalIncident(incident: any) {
    // 1. Notificar equipe imediatamente
    await this.notifyTeam('CRITICAL', incident);
    
    // 2. Ativar modo de manutenção se necessário
    if (incident.details.type === 'data_breach') {
      await this.enableMaintenanceMode();
    }
    
    // 3. Coletar evidências
    await this.collectEvidence(incident);
    
    // 4. Iniciar investigação
    await this.startInvestigation(incident);
  }
  
  private static async handleHighIncident(incident: any) {
    // 1. Notificar equipe
    await this.notifyTeam('HIGH', incident);
    
    // 2. Implementar contramedidas
    if (incident.details.type === 'ddos') {
      await this.enableDDoSProtection();
    }
    
    // 3. Monitorar situação
    await this.enhanceMonitoring(incident);
  }
  
  private static async notifyTeam(severity: string, incident: any) {
    // Implementar notificação via Slack, email, SMS
    console.log(`🚨 ${severity} INCIDENT:`, incident);
  }
  
  private static async enableMaintenanceMode() {
    // Implementar modo de manutenção
    console.log('🔧 Maintenance mode enabled');
  }
  
  private static async collectEvidence(incident: any) {
    // Coletar logs, snapshots, etc.
    console.log('🔍 Collecting evidence for incident:', incident.id);
  }
  
  private static generateIncidentId(): string {
    return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 6.2 Backup e Recovery

```typescript
// backup/backupService.ts
export class BackupService {
  static async createBackup(type: 'full' | 'incremental' = 'incremental') {
    const backupId = `backup-${Date.now()}`;
    
    try {
      // 1. Backup do banco de dados
      await this.backupDatabase(backupId, type);
      
      // 2. Backup de arquivos
      await this.backupFiles(backupId);
      
      // 3. Backup de configurações
      await this.backupConfigurations(backupId);
      
      // 4. Verificar integridade
      await this.verifyBackup(backupId);
      
      console.log(`✅ Backup ${backupId} created successfully`);
      return backupId;
    } catch (error) {
      console.error(`❌ Backup ${backupId} failed:`, error);
      throw error;
    }
  }
  
  static async restoreBackup(backupId: string) {
    try {
      // 1. Verificar backup
      await this.verifyBackup(backupId);
      
      // 2. Parar serviços
      await this.stopServices();
      
      // 3. Restaurar banco de dados
      await this.restoreDatabase(backupId);
      
      // 4. Restaurar arquivos
      await this.restoreFiles(backupId);
      
      // 5. Restaurar configurações
      await this.restoreConfigurations(backupId);
      
      // 6. Reiniciar serviços
      await this.startServices();
      
      console.log(`✅ Backup ${backupId} restored successfully`);
    } catch (error) {
      console.error(`❌ Restore ${backupId} failed:`, error);
      throw error;
    }
  }
  
  private static async backupDatabase(backupId: string, type: string) {
    // Implementar backup do banco
    console.log(`📦 Creating ${type} database backup: ${backupId}`);
  }
  
  private static async verifyBackup(backupId: string) {
    // Verificar integridade do backup
    console.log(`🔍 Verifying backup: ${backupId}`);
  }
}
```

## 7. Conformidade e Auditoria

### 7.1 Auditoria de Segurança

```typescript
// audit/securityAudit.ts
export class SecurityAudit {
  static async performSecurityAudit(): Promise<AuditReport> {
    const report: AuditReport = {
      timestamp: new Date(),
      version: '1.0',
      findings: []
    };
    
    // 1. Auditoria de configurações
    const configFindings = await this.auditConfigurations();
    report.findings.push(...configFindings);
    
    // 2. Auditoria de dependências
    const depFindings = await this.auditDependencies();
    report.findings.push(...depFindings);
    
    // 3. Auditoria de logs
    const logFindings = await this.auditLogs();
    report.findings.push(...logFindings);
    
    // 4. Auditoria de acessos
    const accessFindings = await this.auditAccess();
    report.findings.push(...accessFindings);
    
    // 5. Calcular score de segurança
    report.securityScore = this.calculateSecurityScore(report.findings);
    
    return report;
  }
  
  private static async auditConfigurations(): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];
    
    // Verificar variáveis de ambiente
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      findings.push({
        severity: 'high',
        category: 'configuration',
        description: 'JWT secret is weak or missing',
        recommendation: 'Use a strong JWT secret with at least 32 characters'
      });
    }
    
    // Verificar HTTPS
    if (process.env.NODE_ENV === 'production' && !process.env.SSL_CERT_PATH) {
      findings.push({
        severity: 'critical',
        category: 'configuration',
        description: 'HTTPS not configured in production',
        recommendation: 'Configure SSL certificates for HTTPS'
      });
    }
    
    return findings;
  }
  
  private static async auditDependencies(): Promise<AuditFinding[]> {
    // Usar npm audit ou similar
    const findings: AuditFinding[] = [];
    
    try {
      const { execSync } = require('child_process');
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      if (audit.vulnerabilities) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]: [string, any]) => {
          findings.push({
            severity: vuln.severity,
            category: 'dependency',
            description: `Vulnerability in ${pkg}: ${vuln.title}`,
            recommendation: `Update ${pkg} to version ${vuln.fixAvailable}`
          });
        });
      }
    } catch (error) {
      console.error('Failed to run npm audit:', error);
    }
    
    return findings;
  }
  
  private static calculateSecurityScore(findings: AuditFinding[]): number {
    let score = 100;
    
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }
}

interface AuditReport {
  timestamp: Date;
  version: string;
  findings: AuditFinding[];
  securityScore?: number;
}

interface AuditFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  recommendation: string;
}
```

### 7.2 Conformidade LGPD

```typescript
// compliance/lgpdCompliance.ts
export class LGPDCompliance {
  static async generatePrivacyReport(userId: string): Promise<PrivacyReport> {
    const user = await this.getUserData(userId);
    
    return {
      userId,
      dataCollected: {
        personalData: {
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        },
        behavioralData: {
          musicPreferences: user.musicPreferences,
          generationHistory: user.generationHistory,
          feedbackHistory: user.feedbackHistory
        },
        technicalData: {
          ipAddress: '[Anonimizado]',
          userAgent: '[Anonimizado]',
          sessionData: '[Anonimizado]'
        }
      },
      legalBasis: {
        personalData: 'Consentimento do titular',
        behavioralData: 'Legítimo interesse para melhoria do serviço',
        technicalData: 'Legítimo interesse para segurança'
      },
      retentionPeriod: {
        personalData: '7 anos após inatividade',
        behavioralData: '3 anos após coleta',
        technicalData: '90 dias após coleta'
      },
      rights: {
        access: 'Disponível via API',
        rectification: 'Disponível via perfil do usuário',
        erasure: 'Disponível via solicitação',
        portability: 'Disponível via export de dados',
        objection: 'Disponível via configurações de privacidade'
      }
    };
  }
  
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await this.getUserData(userId);
    
    return {
      exportDate: new Date(),
      userId,
      personalData: {
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      musicData: {
        generatedMusics: user.generatedMusics,
        preferences: user.preferences,
        feedback: user.feedback
      },
      metadata: {
        totalGenerations: user.generatedMusics.length,
        accountAge: this.calculateAccountAge(user.createdAt),
        lastActivity: user.lastActivity
      }
    };
  }
  
  static async processDataDeletionRequest(userId: string): Promise<DeletionReport> {
    const deletionId = `DEL-${Date.now()}`;
    
    try {
      // 1. Backup dos dados antes da exclusão
      await this.backupUserDataForDeletion(userId, deletionId);
      
      // 2. Anonimizar dados que devem ser mantidos
      await this.anonymizeRetainedData(userId);
      
      // 3. Deletar dados pessoais
      await this.deletePersonalData(userId);
      
      // 4. Log da operação
      SecurityLogger.logDataAccess(userId, 'personal_data', 'deletion');
      
      return {
        deletionId,
        userId,
        timestamp: new Date(),
        status: 'completed',
        dataDeleted: {
          personalData: true,
          behavioralData: false, // Anonimizado
          technicalData: true
        },
        retainedData: {
          anonymizedBehavioralData: true,
          aggregatedStatistics: true
        }
      };
    } catch (error) {
      return {
        deletionId,
        userId,
        timestamp: new Date(),
        status: 'failed',
        error: error.message
      };
    }
  }
  
  private static async getUserData(userId: string) {
    // Implementar busca no banco de dados
    // return await db.user.findUnique({ where: { id: userId }, include: { ... } });
  }
  
  private static calculateAccountAge(createdAt: Date): number {
    return Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }
}

interface PrivacyReport {
  userId: string;
  dataCollected: any;
  legalBasis: any;
  retentionPeriod: any;
  rights: any;
}

interface UserDataExport {
  exportDate: Date;
  userId: string;
  personalData: any;
  musicData: any;
  metadata: any;
}

interface DeletionReport {
  deletionId: string;
  userId: string;
  timestamp: Date;
  status: 'completed' | 'failed';
  dataDeleted?: any;
  retainedData?: any;
  error?: string;
}
```

## 8. Treinamento e Conscientização

### 8.1 Diretrizes de Segurança para Desenvolvedores

#### Checklist de Segurança
```markdown
# Checklist de Segurança - Desenvolvimento

## Antes de Codificar
- [ ] Revisar requisitos de segurança
- [ ] Identificar dados sensíveis
- [ ] Definir controles de acesso necessários
- [ ] Planejar validação de entrada

## Durante o Desenvolvimento
- [ ] Validar todas as entradas do usuário
- [ ] Sanitizar dados antes de exibir
- [ ] Usar prepared statements para queries
- [ ] Implementar controle de acesso adequado
- [ ] Criptografar dados sensíveis
- [ ] Implementar logging de segurança
- [ ] Seguir princípio do menor privilégio

## Antes do Deploy
- [ ] Executar testes de segurança
- [ ] Revisar configurações de produção
- [ ] Verificar variáveis de ambiente
- [ ] Executar scan de vulnerabilidades
- [ ] Revisar logs de segurança
- [ ] Testar controles de acesso

## Pós-Deploy
- [ ] Monitorar logs de segurança
- [ ] Verificar alertas de segurança
- [ ] Executar testes de penetração
- [ ] Revisar métricas de segurança
```

### 8.2 Procedimentos de Emergência

```markdown
# Procedimentos de Emergência - Segurança

## Vazamento de Dados Suspeito
1. **Imediato (0-15 min)**
   - Isolar sistema afetado
   - Notificar equipe de segurança
   - Preservar evidências
   - Ativar modo de manutenção se necessário

2. **Curto Prazo (15 min - 1 hora)**
   - Investigar escopo do vazamento
   - Identificar dados afetados
   - Implementar correções
   - Notificar stakeholders

3. **Médio Prazo (1-24 horas)**
   - Notificar autoridades (se necessário)
   - Comunicar usuários afetados
   - Implementar melhorias de segurança
   - Documentar incidente

## Ataque DDoS
1. **Detecção**
   - Monitorar métricas de tráfego
   - Identificar padrões anômalos
   - Verificar logs de acesso

2. **Resposta**
   - Ativar proteção DDoS no CDN
   - Implementar rate limiting agressivo
   - Bloquear IPs maliciosos
   - Escalar recursos se necessário

3. **Recuperação**
   - Monitorar normalização do tráfego
   - Ajustar configurações de proteção
   - Analisar logs para melhorias
```

## 9. Roadmap de Segurança

### 9.1 Implementações Atuais (MVP)

**✅ Concluído:**
- Validação básica de entrada
- Rate limiting básico
- HTTPS obrigatório
- Logs de segurança básicos
- Sanitização de dados

**🔄 Em Andamento:**
- Testes de segurança automatizados
- Monitoramento de vulnerabilidades
- Backup automatizado

### 9.2 Próximas Implementações

#### Fase 2: Autenticação e Autorização (Q2 2024)
- [ ] Sistema de autenticação completo
- [ ] Autenticação multi-fator (2FA)
- [ ] Controle de acesso baseado em roles
- [ ] Session management seguro
- [ ] Password policy enforcement

#### Fase 3: Segurança Avançada (Q3 2024)
- [ ] Web Application Firewall (WAF)
- [ ] Detecção de anomalias com ML
- [ ] Criptografia end-to-end
- [ ] Secure code scanning
- [ ] Penetration testing automatizado

#### Fase 4: Conformidade e Governança (Q4 2024)
- [ ] Compliance LGPD/GDPR completo
- [ ] Auditoria de segurança automatizada
- [ ] Data Loss Prevention (DLP)
- [ ] Security Information and Event Management (SIEM)
- [ ] Incident response automation

#### Fase 5: Segurança Empresarial (Q1 2025)
- [ ] Zero Trust Architecture
- [ ] Advanced Threat Protection
- [ ] Security Orchestration (SOAR)
- [ ] Threat Intelligence integration
- [ ] Security metrics dashboard

### 9.3 Métricas de Segurança

#### KPIs de Segurança
- **Mean Time to Detection (MTTD)**: < 15 minutos
- **Mean Time to Response (MTTR)**: < 1 hora
- **Security Score**: > 90%
- **Vulnerability Remediation**: < 48 horas (críticas)
- **Incident Rate**: < 1 por mês
- **False Positive Rate**: < 5%

#### Métricas de Conformidade
- **LGPD Compliance Score**: 100%
- **Data Breach Incidents**: 0
- **Privacy Requests Response Time**: < 30 dias
- **Audit Findings**: < 5 por auditoria
- **Training Completion Rate**: 100%

## 10. Conclusão

A segurança da plataforma Memora Music é implementada através de uma abordagem em camadas, cobrindo:

### Pontos Fortes Atuais
- **Validação Robusta**: Entrada de dados validada e sanitizada
- **Rate Limiting**: Proteção contra abuso e ataques
- **Logging Completo**: Monitoramento e auditoria
- **HTTPS Obrigatório**: Comunicação segura
- **Backup Automatizado**: Recuperação de dados

### Áreas de Melhoria
- **Autenticação**: Implementar sistema completo
- **Monitoramento**: Alertas proativos
- **Conformidade**: LGPD/GDPR completo
- **Testes**: Automação de segurança
- **Treinamento**: Conscientização da equipe

### Próximos Passos Críticos
1. **Implementar autenticação de usuários**
2. **Configurar monitoramento avançado**
3.4. **Automatizar testes de segurança**
5. **Estabelecer programa de conformidade LGPD**

### Recursos Necessários
- **Equipe de Segurança**: 1-2 especialistas
- **Ferramentas de Monitoramento**: Sentry, DataDog, etc.
- **Testes de Segurança**: OWASP ZAP, Burp Suite
- **Compliance**: Consultoria jurídica especializada
- **Treinamento**: Cursos de segurança para equipe

### Investimento Estimado
- **Ferramentas**: $500-1000/mês
- **Consultoria**: $5000-10000 (setup inicial)
- **Treinamento**: $2000-5000/ano
- **Auditoria Externa**: $10000-20000/ano

---

**Documento elaborado em:** Janeiro 2024  
**Versão:** 1.0  
**Próxima revisão:** Abril 2024  
**Responsável:** Equipe de Segurança Memora Music