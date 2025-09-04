# Guia de Migração: Adicionar Colunas device_id e last_used_ip

## Problema Identificado
O erro "Unable to find snippet with ID" indica que o Supabase está tentando encontrar um snippet que não existe no projeto. Isso pode acontecer quando:
- O SQL contém referências a snippets antigos
- Há cache no navegador
- O SQL Editor está com problemas temporários

## Soluções Alternativas

### Opção 1: SQL Editor (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Clique em "SQL Editor" no menu lateral
   - Clique em "New query"

3. **Execute o SQL limpo**
   ```sql
   -- Adicionar coluna device_id à tabela users
   ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id TEXT;
   
   -- Adicionar coluna last_used_ip à tabela users (NOVA - Para segurança avançada)
   ALTER TABLE users ADD COLUMN IF NOT EXISTS last_used_ip TEXT;
   
   -- Criar índices para melhor performance
   CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);
   CREATE INDEX IF NOT EXISTS idx_users_last_used_ip ON users(last_used_ip);
   CREATE INDEX IF NOT EXISTS idx_users_device_ip_security ON users(device_id, last_used_ip);
   
   -- Adicionar comentários às colunas
   COMMENT ON COLUMN users.device_id IS 'Identificador único do dispositivo para usuários anônimos';
   COMMENT ON COLUMN users.last_used_ip IS 'Último endereço IP usado pelo usuário para verificação de segurança contra abusos';
   ```

4. **Verificar se funcionou**
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'device_id';
   ```

### Opção 2: Table Editor (Mais Simples)

1. **Acesse o Table Editor**
   - Vá para "Table Editor" no menu lateral
   - Selecione a tabela "users"

2. **Adicionar nova coluna**
   - Clique no botão "+" ou "Add column"
   - Nome: `device_id`
   - Tipo: `text`
   - Nullable: ✅ (marcado)
   - Default value: (deixe vazio)

3. **Salvar alterações**
   - Clique em "Save"

4. **Criar índice manualmente**
   - Vá para "SQL Editor"
   - Execute: `CREATE INDEX idx_users_device_id ON users(device_id);`

### Opção 3: Script Node.js (Para Desenvolvedores)

1. **Criar script de migração**
   ```javascript
   // scripts/add-device-id-column.js
   const { createClient } = require('@supabase/supabase-js');
   require('dotenv').config();
   
   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY
   );
   
   async function addDeviceIdColumn() {
     try {
       console.log('Adicionando coluna device_id...');
       
       // Adicionar coluna
       const { error: alterError } = await supabase.rpc('exec_sql', {
         sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id TEXT;'
       });
       
       if (alterError) throw alterError;
       
       // Criar índice
       const { error: indexError } = await supabase.rpc('exec_sql', {
         sql: 'CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);'
       });
       
       if (indexError) throw indexError;
       
       console.log('✅ Coluna device_id adicionada com sucesso!');
       
       // Verificar
       const { data, error } = await supabase
         .from('information_schema.columns')
         .select('column_name, data_type, is_nullable')
         .eq('table_name', 'users')
         .eq('column_name', 'device_id');
       
       if (error) throw error;
       
       console.log('Verificação:', data);
       
     } catch (error) {
       console.error('❌ Erro:', error.message);
     }
   }
   
   addDeviceIdColumn();
   ```

2. **Executar o script**
   ```bash
   node scripts/add-device-id-column.js
   ```

### Opção 4: Via API REST (Avançado)

```bash
# Usando curl
curl -X POST 'https://your-project.supabase.co/rest/v1/rpc/exec_sql' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id TEXT;"
  }'
```

## Troubleshooting

### Se ainda der erro de snippet:
1. **Limpe o cache do navegador**
   - Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
   - Ou use modo incógnito

2. **Tente outro navegador**
   - Chrome, Firefox, Safari, etc.

3. **Aguarde alguns minutos**
   - Às vezes é um problema temporário do Supabase

### Se der erro de permissão:
1. **Verifique se está usando SERVICE_ROLE_KEY**
   - Não use ANON_KEY para operações DDL

2. **Confirme as credenciais**
   - URL do projeto correto
   - Chave de serviço válida

### Se a coluna já existir:
```sql
-- Verificar se já existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'device_id';

-- Se existir, apenas criar o índice
CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);
```

## Validação Final

Após aplicar qualquer uma das opções, execute esta query para confirmar:

```sql
-- Verificar estrutura da tabela
\d users;

-- Ou usar information_schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname LIKE '%device_id%';
```

## Próximos Passos

Após adicionar a coluna com sucesso:

1. **Testar a aplicação**
   - Verificar se o frontend está enviando X-Device-ID
   - Confirmar se o backend está salvando device_id

2. **Monitorar logs**
   - Verificar se não há erros relacionados à nova coluna

3. **Validar funcionalidade**
   - Testar com usuários anônimos
   - Testar com usuários logados

---

**Nota**: Se nenhuma das opções funcionar, pode ser necessário contatar o suporte do Supabase ou verificar se há problemas na conta/projeto.