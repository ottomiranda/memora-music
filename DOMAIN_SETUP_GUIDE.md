# Guia de Configuração do Domínio Personalizado - memora.music

## Visão Geral
Este guia explica como configurar o domínio personalizado `memora.music` para a plataforma Memora Music no Render.com.

## Pré-requisitos
- Domínio `memora.music` registrado e sob seu controle
- Acesso ao painel de controle DNS do registrador do domínio
- Deploy da aplicação já funcionando no Render.com

## Configuração no Render.com

### 1. Configuração do Backend (API)
O backend já está configurado no `render.yaml` com:
```yaml
domains:
  - memora.music
```

### 2. Passos no Dashboard do Render

#### Para o Backend Service:
1. Acesse o dashboard do Render.com
2. Navegue até o serviço `memora-music-backend`
3. Vá para a aba "Settings" > "Custom Domains"
4. Clique em "Add Custom Domain"
5. Digite: `api.memora.music` (para o backend)
6. Clique em "Save"

#### Para o Frontend Service:
1. Navegue até o serviço `memora-music-frontend`
2. Vá para a aba "Settings" > "Custom Domains"
3. Clique em "Add Custom Domain"
4. Digite: `memora.music` (domínio principal)
5. Digite: `www.memora.music` (subdomínio www)
6. Clique em "Save"

## Configuração DNS

### Registros DNS Necessários

Configure os seguintes registros DNS no seu provedor de domínio:

```
# Para o domínio principal (frontend)
Tipo: CNAME
Nome: @
Valor: [render-frontend-url].onrender.com
TTL: 300

# Para www (frontend)
Tipo: CNAME
Nome: www
Valor: [render-frontend-url].onrender.com
TTL: 300

# Para API (backend)
Tipo: CNAME
Nome: api
Valor: [render-backend-url].onrender.com
TTL: 300
```

### Como Obter as URLs do Render

1. **Frontend URL**: No dashboard do Render, vá até `memora-music-frontend` > "Settings" e copie a URL gerada
2. **Backend URL**: No dashboard do Render, vá até `memora-music-backend` > "Settings" e copie a URL gerada

### Exemplo de Configuração DNS

```
# Substitua pelas URLs reais do seu deploy
Tipo: CNAME | Nome: @ | Valor: memora-music-frontend-abc123.onrender.com
Tipo: CNAME | Nome: www | Valor: memora-music-frontend-abc123.onrender.com
Tipo: CNAME | Nome: api | Valor: memora-music-backend-xyz789.onrender.com
```

## Configuração de Variáveis de Ambiente

### Atualizar URLs no Frontend
Após configurar o domínio, atualize as variáveis de ambiente:

```env
# No serviço frontend
VITE_API_URL=https://api.memora.music

# No serviço backend
FRONTEND_PROD_URL=https://memora.music
```

## Verificação e Testes

### 1. Verificar Propagação DNS
```bash
# Verificar se os registros DNS estão propagados
nslookup memora.music
nslookup www.memora.music
nslookup api.memora.music
```

### 2. Testar Conectividade
```bash
# Testar frontend
curl -I https://memora.music
curl -I https://www.memora.music

# Testar backend
curl -I https://api.memora.music/api/health
```

### 3. Verificar SSL
- O Render.com automaticamente provisiona certificados SSL via Let's Encrypt
- Aguarde alguns minutos após a configuração DNS para o SSL ser ativado
- Verifique se `https://` funciona corretamente

## Troubleshooting

### Problemas Comuns

#### 1. DNS não resolve
- **Causa**: Propagação DNS ainda em andamento
- **Solução**: Aguarde até 24-48 horas para propagação completa
- **Verificação**: Use ferramentas como `dig` ou sites como whatsmydns.net

#### 2. SSL não funciona
- **Causa**: Certificado ainda sendo provisionado
- **Solução**: Aguarde alguns minutos após DNS resolver
- **Verificação**: Acesse https://memora.music e verifique o certificado

#### 3. CORS errors
- **Causa**: URLs não atualizadas nas variáveis de ambiente
- **Solução**: Atualize `VITE_API_URL` e `FRONTEND_PROD_URL`
- **Verificação**: Redeploy após atualizar variáveis

#### 4. 404 errors
- **Causa**: Roteamento SPA não configurado
- **Solução**: Verificar se o Render está servindo `index.html` para todas as rotas
- **Verificação**: Testar navegação direta para rotas internas

### Comandos de Diagnóstico

```bash
# Verificar status DNS
dig memora.music
dig www.memora.music
dig api.memora.music

# Testar conectividade
telnet memora.music 80
telnet memora.music 443

# Verificar certificado SSL
openssl s_client -connect memora.music:443 -servername memora.music
```

## Monitoramento

### Métricas Importantes
- **Uptime**: Monitorar disponibilidade dos domínios
- **SSL**: Verificar validade dos certificados
- **Performance**: Tempo de resposta das APIs
- **DNS**: Tempo de resolução DNS

### Ferramentas Recomendadas
- **UptimeRobot**: Monitoramento de uptime
- **SSL Labs**: Verificação de configuração SSL
- **GTmetrix**: Performance do frontend
- **Pingdom**: Monitoramento global

## Backup e Rollback

### Plano de Rollback
1. Manter registros DNS antigos documentados
2. Ter URLs do Render.com como backup
3. Configurar redirecionamentos temporários se necessário

### Backup de Configuração
```yaml
# Backup das configurações DNS
# Salvar em local seguro:
# - Registros DNS atuais
# - URLs do Render.com
# - Variáveis de ambiente
```

## Custos

### Render.com
- **Domínios personalizados**: Gratuito
- **SSL**: Gratuito (Let's Encrypt)
- **Bandwidth**: Conforme plano escolhido

### Domínio
- **Registro**: Conforme registrador
- **Renovação**: Anual
- **DNS**: Geralmente gratuito

## Próximos Passos

1. ✅ Configurar registros DNS
2. ✅ Adicionar domínios no Render
3. ✅ Atualizar variáveis de ambiente
4. ✅ Testar conectividade
5. ✅ Verificar SSL
6. ✅ Configurar monitoramento

## Suporte

- **Render.com**: https://render.com/docs/custom-domains
- **DNS**: Documentação do seu registrador de domínio
- **SSL**: https://letsencrypt.org/docs/

---

**Nota**: Este guia assume que você tem controle total sobre o domínio `memora.music` e acesso ao painel DNS do registrador.