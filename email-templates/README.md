# Templates de Email - Memora Music

Este diretório contém os templates de email de confirmação para autenticação do Supabase, desenvolvidos especificamente para o projeto Memora Music.

## Arquivos Incluídos

- `confirmation-email.html` - Template HTML simplificado e otimizado para Supabase
- `confirmation-email.txt` - Versão em texto simples para máxima compatibilidade
- `README.md` - Este guia de implementação

## Características do Template

### Design
- **Identidade Visual**: Cores e gradientes da marca Memora Music
- **Responsivo**: Funciona em dispositivos móveis e desktop
- **Compatibilidade**: Otimizado para clientes de email e Supabase
- **Acessibilidade**: Texto alternativo e estrutura semântica

### Tecnologia
- **HTML Básico**: Estrutura de tabelas para máxima compatibilidade
- **CSS Inline**: Estilos incorporados para evitar conflitos
- **Variáveis Supabase**: Integração nativa com sistema de autenticação

## Implementação no Supabase

### ⚠️ IMPORTANTE: Use a Versão Simplificada

Devido a limitações do Supabase com CSS complexo, use **APENAS** o arquivo `confirmation-email.html` simplificado que foi criado. A versão anterior com CSS avançado pode causar tela em branco.

### Passo 1: Configurar Templates de Email
1. Acesse o painel do Supabase
2. Vá para Authentication > Email Templates
3. Selecione "Confirm signup"
4. **IMPORTANTE**: Cole o conteúdo do arquivo `confirmation-email.html` (versão simplificada)
5. **Alternativa**: Use o arquivo `confirmation-email.txt` para máxima compatibilidade
6. Salve as alterações

### Passo 2: Testar o Template
1. Após colar o HTML, clique em "Preview" no Supabase
2. Verifique se o email é exibido corretamente
3. Se aparecer tela em branco, use a versão em texto (`confirmation-email.txt`)

### Passo 3: Configurar SMTP (Opcional)
Para melhor deliverability, configure um provedor SMTP:
1. Vá para Authentication > Settings
2. Configure SMTP settings com seu provedor preferido
3. Teste o envio de emails

### Passo 4: Personalizar Variáveis
O template usa as seguintes variáveis do Supabase:
- `{{.SiteName}}`: Nome do seu site/aplicação
- `{{.ConfirmationURL}}`: URL de confirmação gerada automaticamente

Essas variáveis são substituídas automaticamente pelo Supabase.

## Solução de Problemas

### Tela em Branco no Supabase
Se o template HTML causar tela em branco:
1. Use a versão em texto simples (`confirmation-email.txt`)
2. Verifique se não há caracteres especiais no HTML
3. Certifique-se de que está usando apenas CSS inline básico

### Template Não Funciona
- Verifique se as variáveis `{{.SiteName}}` e `{{.ConfirmationURL}}` estão corretas
- Teste com a versão em texto primeiro
- Confirme que o SMTP está configurado corretamente

### Problemas de Renderização
- Use sempre a versão HTML simplificada
- Evite CSS complexo, media queries e comentários condicionais
- Teste em diferentes clientes de email

## Personalização

### Cores da Marca
As cores utilizadas seguem a identidade visual do Memora Music:
- **Primária**: #7B3FE4 (Roxo)
- **Gradiente**: #7B3FE4 → #9B5FE8
- **Texto Principal**: #101010 (Preto)
- **Texto Secundário**: #7A7A7A (Cinza)
- **Fundo**: #f4f4f4 (Cinza Claro)

### Modificações
Para personalizar o template:
1. Mantenha a estrutura de tabelas HTML
2. Use apenas CSS inline
3. Teste sempre no Supabase antes de implementar
4. Mantenha fallbacks de texto para links

## Compatibilidade

### Clientes de Email Testados
- Gmail
- Outlook
- Apple Mail
- Thunderbird
- Clientes móveis

### Sistemas Suportados
- Supabase Auth
- Sistemas de email padrão
- Provedores SMTP

## Manutenção

### Atualizações
- Sempre teste mudanças no ambiente de desenvolvimento
- Mantenha backup dos templates funcionais
- Documente alterações significativas

### Monitoramento
- Acompanhe taxas de entrega
- Monitore feedback de usuários
- Verifique logs de erro do Supabase

---

**Desenvolvido para Memora Music**  
*Template otimizado para Supabase Auth*