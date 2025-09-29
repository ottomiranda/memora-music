# Dockerfile para Memora Music
# Multi-stage build para otimizar o tamanho da imagem final

# Stage 1: Base image com Node.js LTS
FROM public.ecr.aws/docker/library/node:24-bookworm-slim AS base

# Instalar dependências do sistema necessárias
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      dumb-init && \
    rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração de dependências
COPY package*.json ./
COPY bun.lockb* ./

# Stage 2: Instalação de dependências
FROM base AS deps

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Stage 3: Build da aplicação
FROM base AS builder

# Copiar node_modules da stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Copiar arquivos de configuração
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY nodemon.json ./

# Criar arquivo .env.example para referência
RUN echo "# Environment Variables for Memora Music\n\
# OpenAI API Configuration\n\
OPENAI_API_KEY=your_openai_api_key_here\n\
\n\
# Suno API Configuration\n\
SUNO_API_KEY=your_suno_api_key_here\n\
\n\
# Server Configuration\n\
PORT=3003\n\
\n\
# Frontend URL\n\
FRONTEND_URL=http://localhost:5173\n\
\n\
# API URL for frontend (Vite environment variable)\n\
VITE_API_URL=http://localhost:3003\n\
\n\
# Environment\n\
NODE_ENV=production\n\
\n\
# Supabase Configuration\n\
SUPABASE_URL=your_supabase_url_here\n\
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here\n\
SUPABASE_ANON_KEY=your_supabase_anon_key_here\n\
\n\
# Next.js Public Variables\n\
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here\n\
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here\n\
\n\
# NextAuth Configuration\n\
NEXTAUTH_SECRET=your_nextauth_secret_here\n\
NEXTAUTH_URL=http://localhost:3000\n\
\n\
# Stripe Configuration\n\
STRIPE_SECRET_KEY=your_stripe_secret_key_here\n\
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here\n\
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here\n\
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here" > .env.example

# Validar variáveis de ambiente
RUN npm run validate-env || echo "Warning: Environment validation failed, continuing with build..."

# Build da aplicação frontend
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN npm run build

# Build do backend
RUN npm run build:server

# Stage 4: Produção - imagem final otimizada
FROM public.ecr.aws/docker/library/node:24-bookworm-slim AS production

# Instalar dependências do sistema para produção
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      dumb-init && \
    rm -rf /var/lib/apt/lists/*

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs nodemon.json ./
COPY --chown=nodejs:nodejs tsconfig*.json ./

# Copiar apenas dependências de produção
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar build do frontend
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copiar backend compilado
COPY --from=builder --chown=nodejs:nodejs /app/dist-server ./dist-server

# Copiar arquivos públicos
COPY --chown=nodejs:nodejs public/ ./public/

# Copiar scripts necessários
COPY --chown=nodejs:nodejs scripts/ ./scripts/

# Copiar arquivo .env.example
COPY --from=builder --chown=nodejs:nodejs /app/.env.example ./

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3003
ENV FRONTEND_PORT=5173

# Expor as portas utilizadas
EXPOSE 3003 5173

# Mudar para usuário não-root
USER nodejs

# Comando de inicialização com dumb-init para gerenciamento de processos
CMD ["dumb-init", "npm", "run", "start"]

# Labels para metadados
LABEL maintainer="Memora Music Team"
LABEL description="Memora Music - Plataforma de geração de música com IA"
LABEL version="1.0.0"
