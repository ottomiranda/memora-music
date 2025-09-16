# Guia de Implementação - Templates de Email no Supabase

## Visão Geral

Este guia explica como configurar os templates de email de confirmação personalizados no painel do Supabase para o projeto Memora Music.

## Arquivos Incluídos

- `confirmation-email.html` - Template HTML responsivo com design da marca
- `confirmation-email.txt` - Versão em texto simples (fallback)
- `GUIA_IMPLEMENTACAO_SUPABASE.md` - Este guia de implementação

## Passo a Passo - Configuração no Supabase

### 1. Acesso ao Painel de Autenticação

1. Faça login no [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto Memora Music
3. No menu lateral, clique em **Authentication**
4. Clique na aba **Email Templates**

### 2. Configuração do Template de Confirmação

1. Na seção **Email Templates**, localize **Confirm signup**
2. Clique em **Edit** ao lado de "Confirm signup"

### 3. Configuração do Template HTML

1. **Subject (Assunto):**
   ```
   Confirme seu email - {{.SiteName}}
   ```

2. **Body (HTML):**
   - Copie todo o conteúdo do arquivo `confirmation-email.html`
   - Cole no campo "Body" do template
   - Certifique-se de que as variáveis `{{.ConfirmationURL}}` e `{{.SiteName}}` estão presentes

### 4. Configuração do Template de Texto

1. Marque a opção **"Include plain text version"**
2. **Plain Text Body:**
   - Copie todo o conteúdo do arquivo `confirmation-email.txt`
   - Cole no campo "Plain text body"

### 5. Configurações Avançadas

#### Configurações de Email (Settings > Auth)

1. Vá para **Settings** > **Auth**
2. Configure as seguintes opções:

```
Site URL: https://memoramusic.com (ou seu domínio)
Redirect URLs: 
  - https://memoramusic.com/auth/callback
  - http://localhost:5173/auth/callback (para desenvolvimento)

Email Confirmation: Enabled
Double Confirm Email Changes: Enabled (recomendado)
Secure Email Change: Enabled (recomendado)
```

#### Configurações SMTP (Opcional - Recomendado para Produção)

Para melhor deliverability, configure um provedor SMTP:

1. Vá para **Settings** > **Auth** > **SMTP Settings**
2. Configure com seu provedor (ex: SendGrid, Mailgun, AWS SES):

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [sua-api-key]
SMTP Admin Email: noreply@memoramusic.com
SMTP Sender Name: Memora Music
```

### 6. Teste da Configuração

1. **Teste Local:**
   - Crie uma nova conta no seu ambiente de desenvolvimento
   - Verifique se o email de confirmação é enviado
   - Confirme se o design está correto

2. **Teste de Compatibilidade:**
   - Teste em diferentes clientes de email:
     - Gmail (web e mobile)
     - Outlook (web e desktop)
     - Apple Mail
     - Yahoo Mail

3. **Teste de Responsividade:**
   - Verifique em dispositivos móveis
   - Teste em diferentes tamanhos de tela

## Variáveis Disponíveis

O Supabase fornece as seguintes variáveis para templates:

- `{{.ConfirmationURL}}` - Link de confirmação único
- `{{.SiteName}}` - Nome do site (configurado nas Settings)
- `{{.SiteURL}}` - URL base do site
- `{{.Email}}` - Email do usuário
- `{{.Token}}` - Token de confirmação (se necessário usar separadamente)

## Personalização Adicional

### Modificando Cores da Marca

Para alterar as cores do template, modifique as seguintes classes CSS no arquivo HTML:

```css
.memora-primary { color: #7B3FE4 !important; }    /* Roxo principal */
.memora-secondary { color: #FEC641 !important; }  /* Amarelo secundário */
.memora-coral { color: #FF5A73 !important; }      /* Coral */
.memora-turquoise { color: #3ECFBB !important; }  /* Turquesa */
```

### Adicionando Novos Elementos

Para adicionar novos elementos ao template:

1. Use sempre estrutura de tabelas para compatibilidade
2. Aplique estilos inline para melhor suporte
3. Teste em múltiplos clientes de email
4. Mantenha a versão em texto atualizada

## Troubleshooting

### Problemas Comuns

1. **Email não está sendo enviado:**
   - Verifique se a confirmação por email está habilitada
   - Confirme as configurações de SMTP
   - Verifique os logs no Supabase Dashboard

2. **Design quebrado em alguns clientes:**
   - Verifique se todos os estilos estão inline
   - Teste a estrutura de tabelas
   - Confirme a compatibilidade com Outlook

3. **Links não funcionam:**
   - Verifique se `{{.ConfirmationURL}}` está presente
   - Confirme as configurações de redirect URLs
   - Teste em ambiente de produção

4. **Texto cortado em mobile:**
   - Verifique as media queries
   - Teste em diferentes dispositivos
   - Ajuste o padding e margens

### Logs e Monitoramento

1. **Logs do Supabase:**
   - Vá para **Logs** > **Auth**
   - Monitore tentativas de envio de email
   - Verifique erros de SMTP

2. **Métricas de Email:**
   - Taxa de entrega
   - Taxa de abertura
   - Taxa de cliques no botão de confirmação

## Melhores Práticas

### Deliverability

1. **Configure SPF, DKIM e DMARC** no seu domínio
2. **Use um domínio dedicado** para emails transacionais
3. **Monitore a reputação** do seu IP/domínio
4. **Mantenha listas limpas** removendo emails inválidos

### Design

1. **Mantenha o design simples** e focado na ação
2. **Use call-to-action claro** e visível
3. **Teste em modo escuro** para compatibilidade
4. **Otimize para mobile** (60%+ dos emails são abertos em mobile)

### Segurança

1. **Use HTTPS** em todos os links
2. **Configure rate limiting** para prevenir spam
3. **Monitore tentativas** de confirmação suspeitas
4. **Implemente logs** de auditoria

## Suporte

Para dúvidas ou problemas:

1. **Documentação Oficial:** [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
2. **Comunidade:** [Supabase Discord](https://discord.supabase.com)
3. **Issues:** Abra uma issue no repositório do projeto

---

**Última atualização:** Janeiro 2024  
**Versão:** 1.0  
**Compatibilidade:** Supabase v2.x+