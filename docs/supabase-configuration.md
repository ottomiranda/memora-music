# Configuração e Estabilidade do Supabase

## Resumo

Este documento descreve todas as configurações necessárias para manter a conexão estável com o Supabase no projeto Memora Music.

## Variáveis de Ambiente Obrigatórias

### Arquivo `.env`

```env
# Supabase Configuration
SUPABASE_URL=https://uelfqxpfwzywmxdxegpe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Validação das Variáveis

- **SUPABASE_URL**: URL do projeto Supabase
- **SUPABASE_SERVICE_ROLE_KEY**: Chave com privilégios administrativos (apenas backend)
- **SUPABASE_ANON_KEY**: Chave para operações anônimas (frontend e backend)

## Arquitetura do Cliente Supabase

### Arquivo: `src/lib/supabase-client.js`

#### Características Principais:

1. **Singleton Pattern**: Uma única instância do SupabaseManager
2. **Lazy Loading**: Configurações carregadas apenas quando necessário
3. **Retry Automático**: Mecanismo de retry com backoff exponencial
4. **Dual Client**: Suporte para Service Role e Anon clients
5. **Health Check**: Monitoramento contínuo da conexão

#### Configuração de Retry:

```javascript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};
```

## Estrutura das Tabelas

### Tabelas Principais:

1. **users**: Dados dos usuários
2. **songs**: Informações das músicas geradas
3. **mvp_feedback**: Feedback dos usuários sobre o MVP

### Permissões RLS:

- **Service Role**: Acesso completo a todas as tabelas
- **Anon Role**: Acesso limitado conforme políticas RLS
- **Authenticated Role**: Acesso baseado no usuário autenticado

## Padrões de Uso

### Backend (Service Role):

```javascript
import { getSupabaseServiceClient, executeSupabaseQuery } from '../src/lib/supabase-client.js';

// Uso direto
const client = getSupabaseServiceClient();

// Uso com retry automático
const result = await executeSupabaseQuery(async (client) => {
  return await client.from('user_creations').select('*');
});
```

### Frontend (Anon/Auth):

```javascript
import { getSupabaseAnonClient } from '../src/lib/supabase-client.js';

const client = getSupabaseAnonClient();
```

## Monitoramento e Diagnóstico

### Script de Diagnóstico: `supabase-diagnosis.js`

Execute regularmente para verificar a saúde da conexão:

```bash
node supabase-diagnosis.js
```

#### Testes Realizados:

1. ✅ Variáveis de ambiente
2. ✅ Conexão Service Role
3. ✅ Conexão Anônima
4. ✅ Acesso às tabelas
5. ✅ Operações CRUD
6. ✅ Mecanismo de retry

## Resolução de Problemas Comuns

### 1. Erro "Missing environment variable"

**Causa**: Variáveis de ambiente não carregadas

**Solução**:
- Verificar se o arquivo `.env` existe na raiz do projeto
- Confirmar que `dotenv` está sendo carregado no início da aplicação
- Usar `loadConfig()` antes de acessar configurações

### 2. Erro "Permission denied for table"

**Causa**: Políticas RLS restritivas

**Solução**:
- Usar Service Role para operações administrativas
- Verificar políticas RLS no Supabase Dashboard
- Garantir que o usuário tem as permissões necessárias

### 3. Timeout de Conexão

**Causa**: Problemas de rede ou sobrecarga

**Solução**:
- O mecanismo de retry automático deve resolver
- Verificar logs para identificar padrões
- Considerar aumentar timeouts se necessário

### 4. Importação Circular ou Travamento

**Causa**: Cliente Supabase sendo inicializado antes das variáveis de ambiente

**Solução**:
- Usar lazy loading (implementado)
- Evitar importações no nível do módulo
- Usar funções getter em vez de constantes

## Melhores Práticas

### 1. Segurança

- **NUNCA** expor Service Role Key no frontend
- Usar Anon Key apenas para operações públicas
- Implementar RLS adequadamente
- Validar dados de entrada sempre

### 2. Performance

- Reutilizar instâncias de cliente
- Usar connection pooling quando disponível
- Implementar cache para queries frequentes
- Monitorar métricas de performance

### 3. Confiabilidade

- Sempre usar `executeSupabaseQuery` para operações críticas
- Implementar fallbacks para operações essenciais
- Monitorar logs de erro regularmente
- Executar diagnósticos periodicamente

## Comandos Úteis

```bash
# Executar diagnóstico completo
node supabase-diagnosis.js

# Verificar logs do servidor
npm run server:dev

# Testar conexão específica
node -e "import('./src/lib/supabase-client.js').then(m => m.testSupabaseConnection().then(console.log))"
```

## Contatos e Suporte

- **Projeto Supabase**: memora.music
- **Organização**: otto.souza.miranda@gmail.com Org
- **Ambiente**: Produção

## Changelog

### v1.0.0 (Atual)
- ✅ Implementação inicial do cliente robusto
- ✅ Sistema de retry com backoff exponencial
- ✅ Lazy loading de configurações
- ✅ Dual client (Service Role + Anon)
- ✅ Script de diagnóstico completo
- ✅ Documentação completa

---

**Última atualização**: Janeiro 2025
**Status**: ✅ Todos os sistemas operacionais