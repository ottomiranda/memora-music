# Problema de Verificação de Email - Redirecionamento para Localhost

## 🔍 Diagnóstico do Problema

Você está enfrentando um problema comum com a verificação de email do Supabase em ambiente de desenvolvimento. O erro que você recebeu:

```
http://localhost:5173/auth/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

Indica **dois problemas principais**:

### 1. **Conflito de Portas**
- Seu projeto roda na porta **5173** (Vite)
- O Supabase está configurado para redirecionar para **localhost:3000** (padrão Next.js)
- Isso causa o redirecionamento incorreto

### 2. **Expiração Rápida do Link**
- Links de verificação de email têm tempo de vida limitado
- Em desenvolvimento, pode expirar antes do teste

## 🛠️ Soluções

### Solução 1: Configurar URLs de Redirecionamento no Painel Supabase

1. **Acesse o Dashboard do Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Configure as URLs de Redirecionamento:**
   - Navegue para: `Authentication` → `URL Configuration`
   - **Site URL:** Mantenha sua URL de produção
   - **Redirect URLs:** Adicione as seguintes URLs:
     ```
     http://localhost:5173/**
     http://localhost:5173/auth/callback
     https://sua-url-de-producao.com/**
     ```

### Solução 2: Atualizar Configuração Local

Seu código já está correto usando `window.location.origin`, mas vamos garantir:

```typescript
// Em authStore.ts - já implementado corretamente
const { error } = await supabase.auth.resendConfirmationEmail(email, {
  emailRedirectTo: `${window.location.origin}/auth/callback`
});
```

### Solução 3: Configuração de Desenvolvimento vs Produção

**Para Desenvolvimento:**
- URLs permitidas: `http://localhost:5173/**`
- Site URL pode permanecer como produção

**Para Produção:**
- URLs permitidas: `https://sua-url-de-producao.com/**`
- Site URL: `https://sua-url-de-producao.com`

## 🧪 Como Testar Corretamente

### Em Desenvolvimento:

1. **Certifique-se que as URLs estão configuradas no Supabase Dashboard**
2. **Teste o fluxo completo:**
   ```bash
   # Terminal 1 - Backend
   npm run server:dev
   
   # Terminal 2 - Frontend  
   npm run client:dev
   ```
3. **Registre um novo usuário ou reenvie email de confirmação**
4. **Verifique o email IMEDIATAMENTE** (não espere muito tempo)

### Em Produção:
- O problema não deve ocorrer se as URLs estiverem configuradas corretamente
- O redirecionamento funcionará automaticamente

## 🔧 Configurações Necessárias no Painel Supabase

### URLs de Redirecionamento Recomendadas:

```
# Para desenvolvimento
http://localhost:5173/**
http://localhost:5173/auth/callback

# Para produção (substitua pela sua URL)
https://sua-url-de-producao.com/**
https://sua-url-de-producao.com/auth/callback

# Para preview/staging (se aplicável)
https://*-seu-usuario.vercel.app/**
```

### Site URL:
- Mantenha como sua URL de produção principal
- Exemplo: `https://sua-url-de-producao.com`

## ⚡ Solução Rápida

**Para resolver imediatamente:**

1. Acesse o Dashboard do Supabase
2. Vá em `Authentication` → `URL Configuration`
3. Adicione `http://localhost:5173/**` nas Redirect URLs
4. Salve as configurações
5. Teste novamente o fluxo de verificação

## 🚨 Pontos Importantes

- **Links de email expiram rapidamente** - teste imediatamente após receber
- **Wildcards são suportados** - use `/**` para cobrir todas as rotas
- **Não é necessário testar em produção** - o problema é de configuração
- **Mantenha URLs de desenvolvimento e produção** configuradas simultaneamente

## 📋 Checklist de Verificação

- [ ] URLs de redirecionamento configuradas no Supabase Dashboard
- [ ] `http://localhost:5173/**` adicionado às Redirect URLs
- [ ] Código usando `window.location.origin` (já implementado)
- [ ] Servidores frontend e backend rodando
- [ ] Teste do link de email feito imediatamente após recebimento

---

**Resultado Esperado:** Após essas configurações, o link de verificação deve redirecionar corretamente para `http://localhost:5173/auth/callback` em desenvolvimento e funcionar normalmente em produção.