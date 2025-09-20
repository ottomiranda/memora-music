# 🔍 CHECKLIST DE DIAGNÓSTICO - RENDER.COM

## ⚠️ PROBLEMA IDENTIFICADO
**Rota:** `/api/user/creation-status`  
**Erro:** Retorna "fallback por erro" em produção  
**Causa Suspeita:** Erro PGRST116 (resultado vazio) ou configuração Supabase  

---

## 📋 CHECKLIST DE EXECUÇÃO NO RENDER

### 🔧 PASSO 1: VERIFICAR LOGS DE DEPLOY
- [ ] Acesse o dashboard do Render.com
- [ ] Vá para o serviço da aplicação
- [ ] Clique na aba "Logs"
- [ ] Procure por logs do último deploy
- [ ] **COPIE E COLE:** Qualquer erro durante o build/deploy

### 🌐 PASSO 2: VERIFICAR VARIÁVEIS DE AMBIENTE
- [ ] Vá para "Environment" no dashboard do Render
- [ ] Verifique se estas variáveis estão definidas:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY` 
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **IMPORTANTE:** NÃO copie os valores, apenas confirme se existem
- [ ] **COPIE E COLE:** Lista das variáveis que estão faltando (se houver)

### 📊 PASSO 3: LOGS EM TEMPO REAL
- [ ] Mantenha os logs abertos em tempo real
- [ ] Execute este comando no seu terminal local:
```bash
curl -X POST "https://memora-music.onrender.com/api/user/creation-status" \
  -H "Content-Type: application/json" \
  -d '{"device-id": "test-diagnostic-render-123"}'
```
- [ ] **COPIE E COLE:** Todos os logs que aparecerem após executar o curl

### 🔍 PASSO 4: LOGS ESPECÍFICOS DA ROTA
- [ ] Nos logs do Render, procure por:
  - `[SUPABASE CONFIG]`
  - `[CREATION STATUS ERROR]`
  - `[CREATION STATUS SUCCESS]`
  - Qualquer linha contendo "creation-status"
- [ ] **COPIE E COLE:** Todas as linhas encontradas com esses padrões

### 🚨 PASSO 5: LOGS DE ERRO CRÍTICOS
- [ ] Procure nos logs por:
  - `TypeError`
  - `ReferenceError` 
  - `PGRST116`
  - `Invalid API key`
  - `Connection refused`
  - `timeout`
- [ ] **COPIE E COLE:** Qualquer erro encontrado com stack trace completo

### 🔄 PASSO 6: TESTE COM DIFERENTES PAYLOADS
Execute estes 4 testes e anote os logs para cada um:

**Teste 1 - Device ID Existente:**
```bash
curl -X POST "https://memora-music.onrender.com/api/user/creation-status" \
  -H "Content-Type: application/json" \
  -d '{"device-id": "guest_1234567890123"}'
```
- [ ] **COPIE E COLE:** Logs deste teste

**Teste 2 - Device ID Novo:**
```bash
curl -X POST "https://memora-music.onrender.com/api/user/creation-status" \
  -H "Content-Type: application/json" \
  -d '{"device-id": "novo-device-render-test-456"}'
```
- [ ] **COPIE E COLE:** Logs deste teste

**Teste 3 - Device ID Vazio:**
```bash
curl -X POST "https://memora-music.onrender.com/api/user/creation-status" \
  -H "Content-Type: application/json" \
  -d '{"device-id": ""}'
```
- [ ] **COPIE E COLE:** Logs deste teste

**Teste 4 - Payload Inválido:**
```bash
curl -X POST "https://memora-music.onrender.com/api/user/creation-status" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "payload"}'
```
- [ ] **COPIE E COLE:** Logs deste teste

### 📈 PASSO 7: INFORMAÇÕES DO SISTEMA
- [ ] No dashboard do Render, verifique:
  - Status do serviço (Running/Failed)
  - Última data de deploy
  - Região do servidor
  - Versão do Node.js em uso
- [ ] **COPIE E COLE:** Essas informações

### 🔧 PASSO 8: LOGS DE INICIALIZAÇÃO
- [ ] Procure nos logs por mensagens de startup:
  - `Server running`
  - `Database connected`
  - `Supabase initialized`
  - Qualquer erro durante a inicialização
- [ ] **COPIE E COLE:** Logs de inicialização completos

---

## 📝 TEMPLATE DE RESPOSTA

Quando você trouxer os logs, use este formato:

```
## LOGS DO RENDER - DIAGNÓSTICO

### PASSO 1 - LOGS DE DEPLOY:
[Cole aqui os logs de deploy]

### PASSO 2 - VARIÁVEIS DE AMBIENTE:
[Liste as variáveis que estão faltando, se houver]

### PASSO 3 - LOGS EM TEMPO REAL:
[Cole aqui os logs do teste curl]

### PASSO 4 - LOGS ESPECÍFICOS DA ROTA:
[Cole aqui os logs com padrões específicos]

### PASSO 5 - LOGS DE ERRO CRÍTICOS:
[Cole aqui qualquer erro encontrado]

### PASSO 6 - TESTES COM DIFERENTES PAYLOADS:
**Teste 1:** [logs]
**Teste 2:** [logs]
**Teste 3:** [logs]
**Teste 4:** [logs]

### PASSO 7 - INFORMAÇÕES DO SISTEMA:
[Cole aqui as informações do dashboard]

### PASSO 8 - LOGS DE INICIALIZAÇÃO:
[Cole aqui os logs de startup]
```

---

## 🎯 OBJETIVO

Com esses logs, conseguiremos:
1. ✅ Identificar se o problema é de configuração do Supabase
2. ✅ Verificar se as variáveis de ambiente estão corretas
3. ✅ Entender se há erro na query ou na conexão
4. ✅ Diagnosticar se é problema de RLS/permissões
5. ✅ Criar uma correção precisa e definitiva

**⏱️ Tempo estimado:** 10-15 minutos

**🚀 Próximo passo:** Após trazer os logs, implementaremos a correção baseada no diagnóstico real.