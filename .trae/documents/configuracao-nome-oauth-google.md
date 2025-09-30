# Configuração do Nome da Aplicação no OAuth do Google

## 1. Problema Identificado

Atualmente, quando os usuários fazem login com Google OAuth, a janela de autenticação exibe:

**"Você está fazendo login novamente no nvhaylwuvdmsjuwjsfva.supabase.co"**

Em vez de exibir o nome amigável da aplicação:

**"Você está fazendo login novamente no Memora Music"**

Isso acontece porque o Google OAuth está utilizando a URL técnica do Supabase como identificador da aplicação, em vez do nome personalizado do projeto.

## 2. Onde Configurar

A configuração deve ser feita em **dois locais**:

### 2.1 Painel do Supabase
- Acesse: [Supabase Dashboard](https://supabase.com/dashboard)
- Navegue até: **Settings > General**

### 2.2 Google Cloud Console (se necessário)
- Acesse: [Google Cloud Console](https://console.cloud.google.com/)
- Navegue até: **APIs & Services > Credentials**

## 3. Configurações Específicas no Supabase

### 3.1 Nome do Projeto
1. No painel do Supabase, vá em **Settings > General**
2. Localize a seção **"Project Settings"**
3. Altere o campo **"Name"** para: `Memora Music`
4. Clique em **"Update project"**

### 3.2 Site URL
1. Na mesma página, localize **"API Settings"**
2. Configure o **"Site URL"** para: `https://memora.music` (ou o domínio de produção)
3. Para desenvolvimento local: `http://localhost:5173`

### 3.3 Configurações de OAuth
1. Vá em **Authentication > Settings**
2. Na seção **"Site URL"**, confirme que está configurado corretamente
3. Em **"Redirect URLs"**, adicione:
   - `https://memora.music/auth/callback`
   - `http://localhost:5173/auth/callback` (para desenvolvimento)

## 4. Configurações no Google Cloud Console

### 4.1 Nome da Aplicação OAuth
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto correto
3. Vá em **APIs & Services > OAuth consent screen**
4. Edite as configurações:
   - **Application name**: `Memora Music`
   - **Application homepage**: `https://memora.music`
   - **Application privacy policy**: `https://memora.music/privacy`
   - **Application terms of service**: `https://memora.music/terms`

### 4.2 Credenciais OAuth
1. Em **APIs & Services > Credentials**
2. Edite o **OAuth 2.0 Client ID** existente
3. Verifique se os **Authorized redirect URIs** incluem:
   - `https://nvhaylwuvdmsjuwjsfva.supabase.co/auth/v1/callback`
   - URLs adicionais se necessário

## 5. Passos Detalhados para Alteração

### Passo 1: Configurar Supabase
```bash
# 1. Acesse o painel do Supabase
# 2. Settings > General
# 3. Altere o nome do projeto para "Memora Music"
# 4. Atualize a Site URL para o domínio correto
```

### Passo 2: Configurar Google Cloud Console
```bash
# 1. Acesse Google Cloud Console
# 2. OAuth consent screen
# 3. Altere Application name para "Memora Music"
# 4. Salve as alterações
```

### Passo 3: Verificar Variáveis de Ambiente
```bash
# Confirme se as credenciais estão corretas no .env
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
```

## 6. Como Testar

### 6.1 Teste Local
1. Execute a aplicação localmente: `npm run dev`
2. Acesse: `http://localhost:5173`
3. Clique em "Login com Google"
4. Verifique se a janela OAuth exibe "Memora Music"

### 6.2 Teste em Produção
1. Faça deploy das alterações
2. Acesse o domínio de produção
3. Teste o fluxo de login OAuth
4. Confirme o nome correto na janela de autenticação

### 6.3 Comandos de Verificação
```bash
# Verificar se o servidor está rodando
curl http://localhost:5173/health

# Testar endpoint de autenticação
curl http://localhost:5173/auth/google
```

## 7. Tempo de Propagação

### Alterações no Supabase
- **Imediato**: Mudanças no nome do projeto
- **1-5 minutos**: Alterações na Site URL
- **5-15 minutos**: Configurações de OAuth

### Alterações no Google Cloud Console
- **5-30 minutos**: Mudanças no OAuth consent screen
- **Até 1 hora**: Propagação completa em todos os servidores Google
- **Cache do navegador**: Pode ser necessário limpar o cache

## 8. Troubleshooting

### Problema: Nome ainda aparece como URL técnica
**Solução**:
1. Limpe o cache do navegador
2. Teste em modo incógnito
3. Aguarde até 1 hora para propagação completa
4. Verifique se o nome foi salvo corretamente no Google Cloud Console

### Problema: Erro de redirect_uri_mismatch
**Solução**:
1. Verifique se todas as URLs de redirect estão configuradas
2. Confirme se a Site URL no Supabase está correta
3. Verifique se não há espaços ou caracteres extras nas URLs

### Problema: Credenciais inválidas
**Solução**:
1. Regenere as credenciais no Google Cloud Console
2. Atualize as variáveis de ambiente
3. Reinicie a aplicação

## 9. Checklist de Verificação

- [ ] Nome do projeto alterado no Supabase
- [ ] Site URL configurada corretamente
- [ ] Application name alterado no Google Cloud Console
- [ ] Redirect URIs configurados corretamente
- [ ] Variáveis de ambiente atualizadas
- [ ] Teste local realizado com sucesso
- [ ] Teste em produção realizado com sucesso
- [ ] Cache do navegador limpo
- [ ] Aguardado tempo de propagação (1 hora)

## 10. Observações Importantes

1. **Backup**: Anote as configurações atuais antes de fazer alterações
2. **Ambiente**: Configure tanto desenvolvimento quanto produção
3. **Domínio**: Use o domínio final de produção nas configurações
4. **Certificados**: Certifique-se de que o domínio possui SSL válido
5. **Monitoramento**: Monitore logs de erro após as alterações

Após seguir todos esses passos, a janela de autenticação do Google deve exibir "Você está fazendo login novamente no Memora Music" em vez da URL técnica do Supabase.