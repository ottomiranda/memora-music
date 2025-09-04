# Integração Manual com Supabase

Este documento descreve como configurar e usar a integração com Supabase usando accessToken manual quando as ferramentas automáticas do TRAE IDE não estão disponíveis.

## 🔑 Como Obter o AccessToken Manual

### Passo 1: Acessar o Console do Supabase
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione seu projeto

### Passo 2: Obter o Service Role Key
1. No painel lateral, clique em **Settings**
2. Clique em **API**
3. Na seção **Project API keys**, localize o **service_role**
4. Clique no ícone de "olho" para revelar a chave
5. Copie a chave completa (ela começa com `eyJ...`)

⚠️ **IMPORTANTE**: O service_role key tem privilégios administrativos. Nunca o exponha publicamente ou o commite no Git.

## 🛠️ Scripts Disponíveis

### 1. Aplicar Migrações Manualmente

```bash
# Aplicar a migração da coluna device_id
node scripts/supabase-manual-migration.js supabase/migrations/010_add_device_id_column.sql YOUR_SERVICE_ROLE_KEY
```

### 2. Verificar Estrutura do Banco

```bash
# Verificar se a coluna device_id foi adicionada
node scripts/verify-device-id-column.js YOUR_SERVICE_ROLE_KEY

# Ou usando variável de ambiente
node scripts/verify-device-id-column.js
```

## 📋 Checklist de Configuração

### ✅ Pré-requisitos
- [ ] Projeto Supabase criado e configurado
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Service role key obtido do console

### ✅ Configuração do Banco de Dados
- [ ] Aplicar migração da coluna `device_id`:
  ```bash
  node scripts/supabase-manual-migration.js supabase/migrations/010_add_device_id_column.sql YOUR_SERVICE_ROLE_KEY
  ```
- [ ] Verificar se a coluna foi criada:
  ```bash
  node scripts/verify-device-id-column.js YOUR_SERVICE_ROLE_KEY
  ```
- [ ] Confirmar que o índice foi criado na coluna `device_id`

### ✅ Configuração de Permissões
- [ ] Verificar permissões da tabela `users`:
  ```sql
  SELECT grantee, table_name, privilege_type 
  FROM information_schema.role_table_grants 
  WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND grantee IN ('anon', 'authenticated') 
  ORDER BY table_name, grantee;
  ```
- [ ] Se necessário, conceder permissões:
  ```sql
  -- Para usuários não autenticados (leitura básica)
  GRANT SELECT ON users TO anon;
  
  -- Para usuários autenticados (acesso completo)
  GRANT ALL PRIVILEGES ON users TO authenticated;
  ```

### ✅ Teste de Conectividade
- [ ] Testar conexão básica:
  ```bash
  node scripts/test-supabase-connection.js
  ```
- [ ] Verificar se as APIs estão respondendo
- [ ] Confirmar que o device fingerprinting está funcionando

## 🔧 Variáveis de Ambiente Necessárias

Certifique-se que seu arquivo `.env` contém:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Public keys for frontend
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 🚨 Troubleshooting

### Erro: "permission denied for table users"

**Causa**: Falta de permissões para a role `anon` ou `authenticated`.

**Solução**:
1. Execute no SQL Editor do Supabase:
   ```sql
   -- Para usuários anônimos
   GRANT SELECT ON users TO anon;
   
   -- Para usuários autenticados
   GRANT ALL PRIVILEGES ON users TO authenticated;
   ```

### Erro: "accessToken is required"

**Causa**: As ferramentas do TRAE IDE não conseguem acessar o accessToken automaticamente.

**Solução**: Use os scripts manuais fornecidos com seu service_role_key.

### Erro: "Column 'device_id' does not exist"

**Causa**: A migração da coluna `device_id` não foi aplicada.

**Solução**:
1. Execute a migração manual:
   ```bash
   node scripts/supabase-manual-migration.js supabase/migrations/010_add_device_id_column.sql YOUR_SERVICE_ROLE_KEY
   ```
2. Verifique se foi aplicada:
   ```bash
   node scripts/verify-device-id-column.js YOUR_SERVICE_ROLE_KEY
   ```

### Erro de Conexão HTTP

**Causa**: URL do Supabase incorreta ou projeto inacessível.

**Solução**:
1. Verifique se `SUPABASE_URL` está correto no `.env`
2. Confirme que o projeto está ativo no console do Supabase
3. Teste a conectividade básica

## 📊 Monitoramento

### Verificar Logs do Supabase
1. Acesse o console do Supabase
2. Vá para **Logs** no painel lateral
3. Monitore logs de API e Database para erros

### Verificar Métricas de Uso
1. No console, vá para **Reports**
2. Monitore:
   - API requests
   - Database connections
   - Storage usage

## 🔄 Próximos Passos

Após configurar a integração manual:

1. **Testar o Device Fingerprinting**:
   - Abrir a aplicação no navegador
   - Verificar se o `deviceId` está sendo gerado
   - Confirmar que está sendo enviado nos headers das requisições

2. **Testar Persistência de Autenticação**:
   - Fazer login na aplicação
   - Recarregar a página
   - Verificar se o usuário permanece logado

3. **Testar Limites por Device**:
   - Usar a aplicação sem fazer login
   - Verificar se os limites estão sendo aplicados por `device_id`
   - Fazer login e verificar se os limites mudam para `user_id`

4. **Monitorar Performance**:
   - Verificar logs de erro
   - Monitorar tempo de resposta das APIs
   - Confirmar que não há vazamentos de memória

## 📞 Suporte

Se encontrar problemas não cobertos neste guia:

1. Verifique os logs do console do navegador
2. Execute os scripts de verificação
3. Consulte a documentação oficial do Supabase
4. Verifique se todas as variáveis de ambiente estão configuradas corretamente