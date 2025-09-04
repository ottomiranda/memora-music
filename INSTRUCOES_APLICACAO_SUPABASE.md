# 🎵 Instruções para Aplicar Migração no Supabase

## ❌ Problema Identificado
O script anterior continha comandos `RAISE NOTICE` que não são suportados no SQL Editor do Supabase, causando erro de sintaxe.

## ✅ Solução
Criamos um script SQL limpo e compatível: `supabase_migration_clean.sql`

## 📋 Passo a Passo

### 1. Acessar o SQL Editor
1. Abra seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **SQL Editor** no menu lateral
3. Clique em **New Query**

### 2. Verificar se a Coluna Já Existe
Copie e execute esta query primeiro:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'last_used_ip';
```

**Resultado esperado:**
- ✅ **Se retornar dados**: A coluna já existe, pule para o passo 4
- ❌ **Se não retornar nada**: Continue para o passo 3

### 3. Aplicar a Migração
Se a coluna não existir, execute este script:

```sql
-- Adicionar coluna last_used_ip
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_used_ip TEXT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_last_used_ip 
ON users(last_used_ip);

CREATE INDEX IF NOT EXISTS idx_users_device_ip_security 
ON users(device_id, last_used_ip);
```

### 4. Verificar a Aplicação
Execute esta query para confirmar que tudo foi aplicado:

```sql
-- Verificar coluna
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'last_used_ip';

-- Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
    AND (indexname LIKE '%last_used_ip%' OR indexname LIKE '%device_ip%');
```

### 5. Teste Final
Verifique a estrutura completa da tabela:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;
```

## ✅ Resultado Esperado
Após a migração, a tabela `users` deve ter:
- ✅ Coluna `last_used_ip` (TEXT, nullable)
- ✅ Índice `idx_users_last_used_ip`
- ✅ Índice `idx_users_device_ip_security`

## 🚨 Troubleshooting

### Erro: "relation 'users' does not exist"
- Verifique se você está no projeto correto
- Confirme se a tabela `users` foi criada

### Erro: "permission denied"
- Verifique se você tem permissões de administrador no projeto
- Tente fazer logout/login no Supabase

### Erro: "index already exists"
- Normal se executar o script múltiplas vezes
- O `IF NOT EXISTS` previne erros de duplicação

## 🎯 Próximos Passos
Após aplicar a migração:
1. ✅ Testar o endpoint `/api/generate-preview`
2. ✅ Verificar se o sistema de IP está funcionando
3. ✅ Validar a segurança contra abusos

---

**📝 Nota:** Este script é seguro para executar múltiplas vezes graças aos comandos `IF NOT EXISTS`.