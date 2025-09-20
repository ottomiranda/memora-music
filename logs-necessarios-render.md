# 📋 LOGS ESPECÍFICOS NECESSÁRIOS DO RENDER

## 🎯 OBJETIVO
Este documento detalha exatamente quais logs precisamos do Render.com para diagnosticar o erro na rota `/api/user/creation-status` que está retornando "fallback por erro" em produção.

---

## 🔍 LOGS CRÍTICOS PARA ANÁLISE

### 1. 🚨 LOGS DE ERRO DA ROTA
**Padrões para procurar:**
```
[CREATION STATUS ERROR]
[SUPABASE CONFIG]
PGRST116
TypeError
ReferenceError
Invalid API key
Connection refused
timeout
```

**O que esperamos encontrar:**
- Detalhes do erro PGRST116 (se for esse o problema)
- Problemas de configuração do Supabase
- Erros de conexão com o banco
- Problemas de autenticação

### 2. 🔧 LOGS DE CONFIGURAÇÃO
**Padrões para procurar:**
```
[SUPABASE CONFIG] Configuração válida
[SUPABASE CONFIG] ERRO
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
```

**O que esperamos encontrar:**
- Se as variáveis de ambiente estão sendo carregadas
- Se a configuração do Supabase está válida
- Mensagens de erro na inicialização do cliente Supabase

### 3. 📊 LOGS DE QUERY DO BANCO
**Padrões para procurar:**
```
SELECT * FROM user_creations
WHERE device_id
.single()
PostgREST
supabase-js
```

**O que esperamos encontrar:**
- A query exata sendo executada
- Resposta do Supabase (vazia, erro, sucesso)
- Tempo de resposta da query
- Detalhes do erro PGRST116 se houver

### 4. 🌐 LOGS DE REQUEST/RESPONSE
**Padrões para procurar:**
```
POST /api/user/creation-status
device-id
Content-Type: application/json
Status: 200
Status: 500
```

**O que esperamos encontrar:**
- Payload recebido na requisição
- Headers da requisição
- Resposta enviada ao cliente
- Status code retornado

### 5. 🔄 LOGS DE INICIALIZAÇÃO
**Padrões para procurar:**
```
Server running
Database connected
Supabase initialized
Environment variables loaded
NODE_ENV
```

**O que esperamos encontrar:**
- Se o servidor iniciou corretamente
- Se as variáveis de ambiente foram carregadas
- Se há erros durante o startup

---

## 📝 LOGS ESPECÍFICOS POR CENÁRIO

### Cenário A: Erro de Configuração
**Se o problema for configuração do Supabase:**
```
[SUPABASE CONFIG] ERRO: URL inválida
[SUPABASE CONFIG] ERRO: Service role key inválida
[SUPABASE CONFIG] ERRO: Anon key inválida
Invalid API key
Unauthorized
```

### Cenário B: Erro de Permissão RLS
**Se o problema for RLS/permissões:**
```
PGRST116
permission denied for table user_creations
RLS policy
Row Level Security
insufficient_privilege
```

### Cenário C: Erro de Query
**Se o problema for na query:**
```
.single() error
Multiple rows returned
No rows returned
PGRST116: The result contains 0 rows
supabase-js error
```

### Cenário D: Erro de Conexão
**Se o problema for conectividade:**
```
Connection refused
Timeout
Network error
DNS resolution failed
SSL error
```

---

## 🔍 COMO COLETAR OS LOGS

### Método 1: Logs em Tempo Real
1. Abra o dashboard do Render
2. Vá para "Logs" do serviço
3. Execute os testes curl do checklist
4. Copie todos os logs que aparecerem

### Método 2: Busca por Padrões
1. Use Ctrl+F nos logs do Render
2. Procure pelos padrões listados acima
3. Copie o contexto completo (5 linhas antes e depois)

### Método 3: Logs Históricos
1. Vá para logs das últimas 24 horas
2. Procure por requisições para `/api/user/creation-status`
3. Copie toda a sequência de logs relacionada

---

## 📊 FORMATO IDEAL DE RESPOSTA

```
## LOGS COLETADOS DO RENDER

### TIMESTAMP: [data/hora]
### REQUEST: POST /api/user/creation-status
### PAYLOAD: {"device-id": "test-123"}

[LOG COMPLETO DA REQUISIÇÃO]
2025-01-15T10:30:15.123Z [INFO] POST /api/user/creation-status
2025-01-15T10:30:15.124Z [DEBUG] Payload recebido: {"device-id": "test-123"}
2025-01-15T10:30:15.125Z [SUPABASE CONFIG] Configuração válida: true
2025-01-15T10:30:15.126Z [DEBUG] Executando query: SELECT * FROM user_creations WHERE device_id = $1
2025-01-15T10:30:15.150Z [ERROR] PGRST116: The result contains 0 rows
2025-01-15T10:30:15.151Z [CREATION STATUS ERROR] Erro ao buscar status: {...}
2025-01-15T10:30:15.152Z [INFO] Retornando fallback por erro
[/LOG COMPLETO]
```

---

## ⚡ PRIORIDADE DOS LOGS

### 🔴 ALTA PRIORIDADE (CRÍTICOS)
1. Logs com `[CREATION STATUS ERROR]`
2. Logs com `PGRST116`
3. Logs com `[SUPABASE CONFIG]`
4. Qualquer stack trace de erro

### 🟡 MÉDIA PRIORIDADE (IMPORTANTES)
1. Logs de inicialização do servidor
2. Logs de variáveis de ambiente
3. Logs de conexão com Supabase

### 🟢 BAIXA PRIORIDADE (CONTEXTO)
1. Logs de requisições bem-sucedidas
2. Logs de debug gerais
3. Logs de outras rotas

---

## 🎯 RESULTADO ESPERADO

Com esses logs, conseguiremos:

✅ **Identificar a causa raiz** do erro "fallback por erro"  
✅ **Confirmar se é PGRST116** (resultado vazio) ou outro erro  
✅ **Verificar configuração** do Supabase em produção  
✅ **Validar permissões** e políticas RLS  
✅ **Implementar correção** precisa e definitiva  

**⏱️ Tempo para análise:** 5-10 minutos após receber os logs  
**🚀 Próximo passo:** Correção imediata baseada no diagnóstico real