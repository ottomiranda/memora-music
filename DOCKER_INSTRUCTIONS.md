# Instruções de Deploy com Docker - Memora Music

## Pré-requisitos

1. **Docker instalado e rodando**
   - Instale o Docker Desktop: https://www.docker.com/products/docker-desktop
   - Certifique-se de que o Docker daemon está rodando

2. **Variáveis de ambiente configuradas**
   - Copie o arquivo `.env.example` para `.env`
   - Configure todas as variáveis necessárias (veja seção abaixo)

## Configuração das Variáveis de Ambiente

Antes de fazer o build, configure o arquivo `.env` com suas credenciais:

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env  # ou use seu editor preferido
```

### Variáveis Obrigatórias:

- `OPENAI_API_KEY`: Sua chave da API OpenAI
- `SUNO_API_KEY`: Sua chave da API Suno
- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase
- `SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe
- `STRIPE_PUBLISHABLE_KEY`: Chave pública do Stripe
- `STRIPE_WEBHOOK_SECRET`: Segredo do webhook Stripe

## Comandos Docker

### 1. Build da Imagem

```bash
# Build da imagem Docker
docker build -t memora-music .
```

### 2. Executar o Container

```bash
# Executar em modo desenvolvimento (com hot reload)
docker run -p 3003:3003 -p 5173:5173 --env-file .env memora-music

# Executar em background
docker run -d -p 3003:3003 -p 5173:5173 --env-file .env --name memora-music-app memora-music
```

### 3. Comandos Úteis

```bash
# Ver logs do container
docker logs memora-music-app

# Parar o container
docker stop memora-music-app

# Remover o container
docker rm memora-music-app

# Listar containers rodando
docker ps

# Entrar no container (debug)
docker exec -it memora-music-app sh
```

## Portas Expostas

- **3003**: Backend API (Express.js)
- **5173**: Frontend (Vite dev server)

## Estrutura do Dockerfile

O Dockerfile utiliza uma abordagem multi-stage para otimização:

1. **Base**: Imagem Node.js 20 Alpine
2. **Deps**: Instalação de dependências
3. **Builder**: Build da aplicação frontend
4. **Production**: Imagem final otimizada

## Características de Segurança

- Execução com usuário não-root (`nodejs`)
- Uso do `dumb-init` para gerenciamento de processos
- Imagem Alpine Linux (menor superfície de ataque)
- Separação de dependências de desenvolvimento e produção

## Troubleshooting

### Erro: "Cannot connect to the Docker daemon"
```bash
# Iniciar Docker Desktop ou Docker daemon
sudo systemctl start docker  # Linux
# ou abrir Docker Desktop no macOS/Windows
```

### Erro de variáveis de ambiente
```bash
# Verificar se o arquivo .env existe e está configurado
ls -la .env
cat .env
```

### Problemas de porta
```bash
# Verificar se as portas estão disponíveis
lsof -i :3003
lsof -i :5173

# Usar portas diferentes se necessário
docker run -p 8003:3003 -p 8173:5173 --env-file .env memora-music
```

## Deploy em Produção

Para deploy em produção, considere:

1. **Usar Docker Compose** para orquestração
2. **Configurar reverse proxy** (Nginx)
3. **Usar volumes** para persistência de dados
4. **Configurar health checks**
5. **Implementar logging centralizado**

### Exemplo docker-compose.yml

```yaml
version: '3.8'
services:
  memora-music:
    build: .
    ports:
      - "3003:3003"
      - "5173:5173"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs do container
2. Confirme se todas as variáveis de ambiente estão configuradas
3. Teste as APIs individualmente
4. Consulte a documentação do projeto