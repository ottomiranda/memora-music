# 🚨 PLANO DE RECUPERAÇÃO DE EMERGÊNCIA - SUPABASE

## ⚡ AÇÃO IMEDIATA NECESSÁRIA

**Status**: 🔴 **PERDA TOTAL DE DADOS CONFIRMADA**  
**Prioridade**: **CRÍTICA**  
**Tempo Estimado**: 30-60 minutos

---

## 🎯 OPÇÃO 1: RESTAURAÇÃO VIA BACKUP (PREFERENCIAL)

### **Passo 1: Verificar Backups Disponíveis**

#### Acesso ao Painel Supabase:
1. **Acessar**: [dashboard.supabase.com](https://dashboard.supabase.com)
2. **Selecionar projeto**: memora.music
3. **Navegar**: Settings → Database → Backups

#### Verificar Disponibilidade:
```
✅ Point-in-Time Recovery habilitado?
✅ Backups automáticos disponíveis?
✅ Backup mais recente anterior à perda?
```

### **Passo 2: Restaurar Backup**
```bash
# Se backup disponível:
# 1. No painel: Database → Backups
# 2. Selecionar backup anterior ao reset
# 3. Clicar "Restore"
# 4. Confirmar restauração
```

### **Passo 3: Validar Restauração**
```sql
-- Verificar se tabelas foram restauradas:
SELECT COUNT(*) FROM songs;
SELECT COUNT(*) FROM user_creations;
SELECT COUNT(*) FROM stripe_transactions;
```

---

## 🔧 OPÇÃO 2: RECRIAÇÃO MANUAL (SE NÃO HOUVER BACKUP)

### **Passo 1: Aplicar Migrações Fundamentais**

#### 1.1 Criar Tabela user_creations:
```sql
-- Executar no SQL Editor do Supabase:
-- Copiar conteúdo de: supabase/migrations/001_create_user_creations_table.sql
```

#### 1.2 Criar Tabela songs:
```sql
-- Executar no SQL Editor do Supabase:
-- Copiar conteúdo de: supabase/migrations/002_create_songs_table.sql
```

#### 1.3 Criar Tabela stripe_transactions:
```sql
-- Executar no SQL Editor do Supabase:
-- Copiar conteúdo de: supabase/migrations/create_stripe_transactions.sql
```

#### 1.4 Aplicar Migração 027:
```sql
-- Executar no SQL Editor do Supabase:
-- Copiar conteúdo de: supabase/migrations/027_enforce_single_use_paid_credits.sql
```

### **Passo 2: Verificar Estrutura Criada**
```sql
-- Verificar tabelas criadas:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('songs', 'user_creations', 'stripe_transactions');

-- Verificar políticas RLS:
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('songs', 'user_creations', 'stripe_transactions');
```

### **Passo 3: Testar Funcionalidades Básicas**
```javascript
// Testar inserção na tabela songs:
const { data, error } = await supabase
  .from('songs')
  .insert({
    title: 'Teste de Recuperação',
    lyrics: 'Teste',
    guest_id: 'test-recovery'
  });

console.log('Teste inserção:', { data, error });
```

---

## 🔍 COMANDOS DE VERIFICAÇÃO

### **Script de Diagnóstico Rápido**
```javascript
// Salvar como: verify-recovery.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyRecovery() {
  console.log('🔍 Verificando recuperação...\n');
  
  // Verificar tabelas
  const tables = ['songs', 'user_creations', 'stripe_transactions'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`❌ ${table}: ERRO - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} registros`);
      }
    } catch (err) {
      console.log(`❌ ${table}: INACESSÍVEL - ${err.message}`);
    }
  }
  
  // Testar inserção
  console.log('\n🧪 Testando inserção...');
  const { data, error } = await supabase
    .from('songs')
    .insert({
      title: 'Teste Recuperação',
      lyrics: 'Sistema funcionando',
      guest_id: 'recovery-test-' + Date.now()
    })
    .select();
    
  if (error) {
    console.log('❌ Inserção falhou:', error.message);
  } else {
    console.log('✅ Inserção bem-sucedida:', data[0]?.id);
    
    // Limpar teste
    await supabase.from('songs').delete().eq('id', data[0]?.id);
  }
}

verifyRecovery();
```

### **Executar Verificação**
```bash
node verify-recovery.js
```

---

## 📋 CHECKLIST DE RECUPERAÇÃO

### **Fase 1: Diagnóstico**
- [ ] Acessar painel Supabase
- [ ] Verificar status do projeto
- [ ] Confirmar perda de dados
- [ ] Verificar backups disponíveis

### **Fase 2: Recuperação**
- [ ] **SE BACKUP DISPONÍVEL**: Restaurar backup
- [ ] **SE SEM BACKUP**: Aplicar migrações manualmente
- [ ] Verificar estrutura das tabelas
- [ ] Testar políticas RLS

### **Fase 3: Validação**
- [ ] Executar script de verificação
- [ ] Testar inserção de dados
- [ ] Testar funcionalidades da aplicação
- [ ] Verificar logs de erro

### **Fase 4: Prevenção**
- [ ] Configurar backup automático
- [ ] Documentar processo de migração seguro
- [ ] Criar ambiente de staging
- [ ] Implementar monitoramento

---

## 🚨 CONTATOS DE EMERGÊNCIA

### **Suporte Supabase**
- **Dashboard**: [dashboard.supabase.com](https://dashboard.supabase.com)
- **Documentação**: [supabase.com/docs](https://supabase.com/docs)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

### **Logs Importantes**
```bash
# Verificar logs da aplicação:
tail -f logs/app.log

# Verificar logs do servidor:
npm run server:dev
```

---

## ⏰ CRONOGRAMA DE EXECUÇÃO

| Tempo | Ação | Responsável |
|-------|------|-------------|
| **0-5 min** | Verificar backups no painel | Desenvolvedor |
| **5-15 min** | Restaurar backup OU iniciar recriação | Desenvolvedor |
| **15-30 min** | Aplicar migrações (se necessário) | Desenvolvedor |
| **30-45 min** | Testar funcionalidades | Desenvolvedor |
| **45-60 min** | Configurar prevenção | Desenvolvedor |

---

**⚠️ IMPORTANTE**: Este é um incidente crítico que requer ação imediata. A cada minuto de atraso, aumenta o risco de perda permanente de dados e impacto nos usuários.

**📞 EXECUTAR AGORA**: Iniciar pela Opção 1 (Backup) e, se não disponível, prosseguir imediatamente para Opção 2 (Recriação).