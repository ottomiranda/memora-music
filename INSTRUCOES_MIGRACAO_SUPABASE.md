# 🔧 Instruções para Migração da Coluna `last_used_ip`

## 📋 Passo 1: Verificar se a Migração já foi Aplicada

1. Acesse o **Console do Supabase** (https://supabase.com/dashboard)
2. Selecione seu projeto **Memora Music**
3. Vá para **SQL Editor** no menu lateral
4. Execute o script de verificação:

```sql
-- Copie e cole este código no SQL Editor:
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'last_used_ip';
```

### ✅ Se retornar resultado:
- A coluna **já existe** - migração aplicada com sucesso!
- Pule para o **Passo 3** (Verificação Final)

### ❌ Se não retornar nenhum resultado:
- A coluna **não existe** - continue para o **Passo 2**

---

## 🚀 Passo 2: Aplicar a Migração (se necessário)

Se a verificação do Passo 1 não retornou resultados, execute este script:

```sql
-- MIGRAÇÃO: Adicionar coluna last_used_ip à tabela users
-- Copie e cole este código completo no SQL Editor:

-- Adicionar coluna last_used_ip à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_used_ip TEXT;

-- Criar índice para melhor performance nas consultas por IP
CREATE INDEX IF NOT EXISTS idx_users_last_used_ip ON users(last_used_ip);

-- Criar índice composto para consultas que verificam device_id OU last_used_ip
CREATE INDEX IF NOT EXISTS idx_users_device_ip_security ON users(device_id, last_used_ip);

-- Adicionar comentário à coluna
COMMENT ON COLUMN users.last_used_ip IS 'Último endereço IP usado pelo usuário para verificação de segurança contra abusos';

-- Verificar se a migração foi aplicada corretamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_used_ip'
    ) THEN
        RAISE NOTICE '✅ Coluna last_used_ip adicionada com sucesso à tabela users';
    ELSE
        RAISE EXCEPTION '❌ Falha ao adicionar coluna last_used_ip à tabela users';
    END IF;
END $$;
```

### 📝 Resultado Esperado:
- Mensagem: `✅ Coluna last_used_ip adicionada com sucesso à tabela users`
- Se aparecer erro, verifique se a tabela `users` existe

---

## 🔍 Passo 3: Verificação Final

Após aplicar a migração, execute este script para confirmar:

```sql
-- Verificar estrutura completa da migração
SELECT 
    'Coluna' as tipo,
    column_name as nome,
    data_type as detalhes
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'last_used_ip'

UNION ALL

SELECT 
    'Índice' as tipo,
    indexname as nome,
    indexdef as detalhes
FROM pg_indexes 
WHERE tablename = 'users' 
    AND (indexname LIKE '%last_used_ip%' OR indexname LIKE '%device_ip_security%');
```

### ✅ Resultado Esperado:
```
tipo    | nome                           | detalhes
--------|--------------------------------|------------------
Coluna  | last_used_ip                   | text
Índice  | idx_users_last_used_ip         | CREATE INDEX...
Índice  | idx_users_device_ip_security   | CREATE INDEX...
```

---

## 🎯 Próximos Passos

Após confirmar que a migração foi aplicada com sucesso:

1. **Reinicie o backend** (se ainda não fez):
   ```bash
   # No terminal do projeto
   npm run server:dev
   ```

2. **Teste o sistema de segurança**:
   - Abra uma janela anônima
   - Tente gerar uma música
   - Verifique se o `device_id` e `last_used_ip` são salvos no Supabase

3. **Monitore os logs** para confirmar que não há erros

---

## 🚨 Troubleshooting

### Erro: "relation 'users' does not exist"
- Verifique se você está no projeto correto do Supabase
- Confirme se a tabela `users` foi criada anteriormente

### Erro: "permission denied"
- Verifique se você tem permissões de administrador no projeto
- Tente fazer logout/login no console do Supabase

### Migração não aplicou
- Execute os comandos um por vez
- Verifique se não há erros de sintaxe
- Confirme se está usando o SQL Editor correto

---

## 📞 Suporte

Se encontrar problemas:
1. Copie a mensagem de erro completa
2. Informe qual passo estava executando
3. Verifique se todas as migrações anteriores foram aplicadas

**Status do Sistema**: Após esta migração, o sistema de segurança por IP estará 100% funcional! 🎉