# Guia de Deploy - Projeto Existente no Render.com

## Situação Atual

Você já tem:
✅ Projeto `memora-music` criado no dashboard do Render.com  
✅ Variáveis de ambiente configuradas  
✅ Arquivo `render.yaml` configurado no repositório  

## Passos para Fazer o Deploy

### 1. Conectar o Repositório GitHub

1. **Acesse o Dashboard do Render**
   - Vá para [dashboard.render.com](https://dashboard.render.com)
   - Localize o projeto `memora-music`

2. **Conectar o Repositório**
   - Clique no projeto `memora-music`
   - Se ainda não conectado, clique em "Connect Repository"
   - Selecione "GitHub" como provedor
   - Autorize o Render a acessar seus repositórios
   - Selecione o repositório do projeto Memora Music
   - Escolha a branch `main` (ou `master`)

3. **Configurar Blueprint**
   - O Render detectará automaticamente o arquivo `render.yaml`
   - Clique em "Apply Blueprint" ou "Use Blueprint"
   - Confirme a criação dos serviços:
     - `memora-music-backend` (Web Service)
     - `memora-music-frontend` (Static Site)
     - `memora-music-db` (Database - opcional)

### 2. Verificar Configurações dos Serviços

#### Backend Service (memora-music-backend)
```yaml
Tipo: Web Service
Runtime: Node.js
Build Command: npm install
Start Command: npx tsx api/server.ts
Port: 3337
Health Check: /api/health
```

#### Frontend Service (memora-music-frontend)
```yaml
Tipo: Static Site
Runtime: Node.js
Build Command: npm install && npm run build
Publish Directory: ./dist
```

### 3. Confirmar Variáveis de Ambiente

Verifique se estas variáveis estão configuradas:

#### Backend:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`

#### Frontend:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### 4. Iniciar o Deploy

1. **Deploy Automático**
   - Após conectar o repositório, o deploy iniciará automaticamente
   - O Render lerá o `render.yaml` e criará os serviços

2. **Deploy Manual (se necessário)**
   - Vá para cada serviço no dashboard
   - Clique em "Manual Deploy"
   - Selecione a branch `main`
   - Clique em "Deploy"

### 5. Monitorar o Processo de Deploy

#### Acompanhar Logs de Build:
1. Acesse cada serviço no dashboard
2. Clique na aba "Logs"
3. Monitore o processo de build em tempo real

#### Status Esperado:
- **Building**: Instalando dependências e fazendo build
- **Deploying**: Fazendo deploy da aplicação
- **Live**: Serviço ativo e funcionando

#### Tempo Estimado:
- Backend: 3-5 minutos
- Frontend: 2-4 minutos

### 6. Verificar Deploy Bem-sucedido

#### Teste do Backend:
```bash
# Substitua pela URL real do seu backend
curl https://memora-music-backend-xxx.onrender.com/api/health
```

Resposta esperada:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "environment": "production"
}
```

#### Teste do Frontend:
- Acesse a URL do frontend fornecida pelo Render
- Verifique se a página carrega corretamente
- Teste funcionalidades básicas

### 7. Configurar Domínio Personalizado (memora.music)

1. **No Backend Service:**
   - Vá para "Settings" > "Custom Domains"
   - Clique em "Add Custom Domain"
   - Digite: `memora.music`
   - Anote os registros DNS fornecidos

2. **No Frontend Service:**
   - Vá para "Settings" > "Custom Domains"
   - Clique em "Add Custom Domain"
   - Digite: `www.memora.music` (opcional)

3. **Configurar DNS:**
   - Acesse seu provedor de domínio
   - Adicione os registros DNS fornecidos pelo Render
   - Aguarde propagação (pode levar até 24h)

### 8. Troubleshooting Comum

#### ❌ Build Falha
**Possíveis causas:**
- Dependências faltando no `package.json`
- Erro de sintaxe no código
- Variáveis de ambiente faltando

**Solução:**
1. Verifique os logs de build
2. Corrija erros no código
3. Faça push das correções
4. O deploy será refeito automaticamente

#### ❌ Serviço não Inicia
**Possíveis causas:**
- Porta incorreta (deve ser 3337 para backend)
- Comando de start incorreto
- Variáveis de ambiente faltando

**Solução:**
1. Verifique o `render.yaml`
2. Confirme variáveis de ambiente
3. Teste localmente primeiro

#### ❌ CORS Error
**Causa:**
- Frontend e backend em domínios diferentes

**Solução:**
1. Verifique se `FRONTEND_PROD_URL` está configurado no backend
2. Confirme configuração de CORS no código

#### ❌ Database Connection Error
**Causa:**
- Credenciais do Supabase incorretas

**Solução:**
1. Verifique `SUPABASE_URL` e `SUPABASE_ANON_KEY`
2. Teste conexão localmente
3. Confirme que projeto Supabase está ativo

### 9. Próximos Passos Após Deploy

1. **Configurar Monitoramento:**
   - Configure alertas de downtime
   - Monitore logs regularmente

2. **Configurar CI/CD:**
   - Deploy automático a cada push na main
   - Já configurado via `render.yaml`

3. **Backup:**
   - Configure backups do Supabase
   - Documente processo de rollback

4. **Performance:**
   - Monitore métricas de performance
   - Configure CDN se necessário

### 10. URLs Finais

Após o deploy bem-sucedido:
- **Frontend**: `https://memora.music` (após configurar DNS)
- **Backend**: `https://memora.music/api` (após configurar DNS)
- **Health Check**: `https://memora.music/api/health`

### 11. Comandos Úteis

```bash
# Testar health check
curl https://memora.music/api/health

# Testar API
curl https://memora.music/api/status

# Verificar logs (via Render CLI)
npx render-cli logs memora-music-backend
npx render-cli logs memora-music-frontend
```

---

## ✅ Checklist Final

- [ ] Repositório conectado ao projeto Render
- [ ] Arquivo `render.yaml` detectado e aplicado
- [ ] Variáveis de ambiente configuradas
- [ ] Backend deployado e respondendo em `/api/health`
- [ ] Frontend deployado e acessível
- [ ] Domínio personalizado configurado (opcional)
- [ ] DNS configurado (se usando domínio personalizado)
- [ ] Testes básicos funcionando
- [ ] Monitoramento configurado

**🎉 Seu projeto Memora Music está no ar!**