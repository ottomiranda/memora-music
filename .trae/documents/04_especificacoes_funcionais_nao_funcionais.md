# Especificações Funcionais e Não-Funcionais - Memora Music

## 1. Visão Geral

Este documento define os requisitos funcionais e não-funcionais da plataforma Memora Music, uma aplicação web que utiliza inteligência artificial para criar músicas personalizadas baseadas em informações fornecidas pelo usuário.

## 2. Requisitos Funcionais

### 2.1 Módulo de Criação de Música

#### RF001 - Wizard de Criação
**Descrição**: O sistema deve fornecer um wizard guiado de 4 etapas para criação de música personalizada.

**Critérios de Aceitação**:
- ✅ Deve exibir indicador visual de progresso (1/4, 2/4, 3/4, 4/4)
- ✅ Deve permitir navegação entre etapas (anterior/próximo)
- ✅ Deve validar campos obrigatórios antes de avançar
- ✅ Deve manter estado dos dados entre etapas
- ✅ Deve permitir voltar a etapas anteriores sem perder dados

**Prioridade**: Alta
**Status**: ✅ Implementado

#### RF002 - Coleta de Informações Pessoais (Passo 1)
**Descrição**: O sistema deve coletar informações sobre o destinatário e ocasião.

**Campos Obrigatórios**:
- Ocasião (texto livre, máx. 100 caracteres)
- Nome do destinatário (texto livre, máx. 50 caracteres)
- Relação com o destinatário (texto livre, máx. 50 caracteres)
- Nome do remetente (texto livre, máx. 50 caracteres)

**Campos Opcionais**:
- Hobbies (texto livre, máx. 200 caracteres)
- Qualidades (texto livre, máx. 200 caracteres)
- Traços únicos (texto livre, máx. 200 caracteres)
- Memórias especiais (texto livre, máx. 300 caracteres)

**Critérios de Aceitação**:
- ✅ Deve validar campos obrigatórios
- ✅ Deve exibir mensagens de erro claras
- ✅ Deve permitir caracteres especiais e acentos
- ✅ Deve limitar tamanho dos campos
- ✅ Deve salvar dados automaticamente no estado local

**Prioridade**: Alta
**Status**: ✅ Implementado

#### RF003 - Geração de Letra (Passo 2)
**Descrição**: O sistema deve gerar letra personalizada usando IA baseada nas informações coletadas.

**Critérios de Aceitação**:
- ✅ Deve integrar com OpenAI GPT-4
- ✅ Deve gerar letra em português brasileiro
- ✅ Deve incluir nome do destinatário na letra
- ✅ Deve referenciar ocasião especificada
- ✅ Deve incorporar informações pessoais fornecidas
- ✅ Deve permitir regeneração da letra
- ✅ Deve exibir indicador de carregamento
- ✅ Deve tratar erros de API graciosamente
- ✅ Deve gerar título automático para a música

**Tempo de Resposta**: Máximo 60 segundos
**Prioridade**: Alta
**Status**: ✅ Implementado

#### RF004 - Seleção de Estilo Musical (Passo 3)
**Descrição**: O sistema deve permitir seleção de gênero, emoção e preferência vocal.

**Gêneros Suportados**:
- Internacionais: Rock, Pop, Hip Hop, Jazz, Blues, Country, Eletrônica, Folk, R&B & Soul, Metal, Punk, Easy Listening, Avant-garde
- Brasileiros: MPB, Samba, Bossa Nova, Forró, Sertanejo, Axé, Funk Carioca, Tropicália, Choro

**Emoções Suportadas**:
- Alegre, Romântica, Nostálgica, Energética, Calma, Inspiradora

**Preferências Vocais**:
- Masculina, Feminina, Neutro

**Critérios de Aceitação**:
- ✅ Deve exibir gêneros organizados por categoria
- ✅ Deve mostrar subgêneros dinamicamente
- ✅ Deve validar seleção de todos os campos
- ✅ Deve permitir busca por gênero
- ✅ Deve salvar preferências selecionadas

**Prioridade**: Alta
**Status**: ✅ Implementado

#### RF005 - Geração de Áudio (Passo 4)
**Descrição**: O sistema deve gerar áudio musical usando IA baseado na letra e estilo selecionados.

**Critérios de Aceitação**:
- ✅ Deve integrar com Suno AI API
- ✅ Deve usar modelo V4_5PLUS para qualidade superior
- ✅ Deve gerar múltiplas variações (2 clipes esperados)
- ✅ Deve implementar sistema de polling para status
- ✅ Deve exibir progresso em tempo real
- ✅ Deve permitir preview antes do download
- ✅ Deve gerar áudio em formato MP3
- ✅ Deve incluir metadados (título, artista)

**Tempo de Geração**: 2-5 minutos
**Prioridade**: Alta
**Status**: ✅ Implementado

### 2.2 Módulo de Reprodução e Download

#### RF006 - Player de Áudio
**Descrição**: O sistema deve fornecer player integrado para prévia das músicas.

**Critérios de Aceitação**:
- ✅ Deve reproduzir arquivos MP3
- ✅ Deve ter controles play/pause
- ✅ Deve exibir duração total e tempo atual
- ✅ Deve ter controle de volume
- ✅ Deve ser responsivo (mobile/desktop)
- ✅ Deve suportar múltiplos players simultâneos

**Prioridade**: Alta
**Status**: ✅ Implementado

#### RF007 - Download de Música
**Descrição**: O sistema deve permitir download das músicas geradas.

**Critérios de Aceitação**:
- ✅ Deve gerar link de download direto
- ✅ Deve manter qualidade original do áudio
- ✅ Deve incluir nome de arquivo descritivo
- ✅ Deve funcionar em todos os navegadores principais
- ✅ Deve permitir downloads múltiplos

**Prioridade**: Alta
**Status**: ✅ Implementado

### 2.3 Módulo de Feedback

#### RF008 - Coleta de Feedback MVP
**Descrição**: O sistema deve coletar feedback dos usuários para validação do produto.

**Dados Coletados**:
- Dificuldade de uso (escala 1-5)
- Recomendaria para outros (sim/não)
- Disposição a pagar (faixas de preço)

**Critérios de Aceitação**:
- ✅ Deve exibir formulário após criação da música
- ✅ Deve validar todos os campos
- ✅ Deve salvar no banco de dados Supabase
- ✅ Deve confirmar envio com sucesso
- ✅ Deve permitir pular feedback (opcional)

**Prioridade**: Média
**Status**: ✅ Implementado

### 2.4 Módulo de Navegação

#### RF009 - Navegação Principal
**Descrição**: O sistema deve fornecer navegação clara entre páginas.

**Páginas Principais**:
- Home (página inicial)
- Criar (wizard de criação)
- Sobre (informações do projeto)

**Critérios de Aceitação**:
- ✅ Deve ter header fixo com navegação
- ✅ Deve destacar página atual
- ✅ Deve ser responsivo
- ✅ Deve incluir logo da marca
- ✅ Deve ter footer com informações adicionais

**Prioridade**: Média
**Status**: ✅ Implementado

### 2.5 Requisitos Futuros (Não Implementados)

#### RF010 - Sistema de Autenticação
**Descrição**: Permitir registro e login de usuários.
**Prioridade**: Baixa
**Status**: 📋 Planejado

#### RF011 - Histórico de Músicas
**Descrição**: Salvar músicas criadas por usuário logado.
**Prioridade**: Baixa
**Status**: 📋 Planejado

#### RF012 - Compartilhamento Social
**Descrição**: Permitir compartilhar músicas em redes sociais.
**Prioridade**: Baixa
**Status**: 📋 Planejado

#### RF013 - Sistema de Pagamentos
**Descrição**: Integrar gateway de pagamento para monetização.
**Prioridade**: Alta (pós-MVP)
**Status**: 📋 Planejado

## 3. Requisitos Não-Funcionais

### 3.1 Performance

#### RNF001 - Tempo de Resposta da Interface
**Descrição**: A interface deve ser responsiva e fluida.

**Critérios**:
- ✅ Carregamento inicial da página: < 3 segundos
- ✅ Navegação entre etapas: < 500ms
- ✅ Validação de formulários: < 200ms
- ✅ Atualização de estado: < 100ms

**Medição**: Lighthouse Performance Score > 90
**Status**: ✅ Atendido

#### RNF002 - Tempo de Geração de Conteúdo
**Descrição**: APIs de IA devem responder dentro de limites aceitáveis.

**Critérios**:
- ✅ Geração de letra: < 60 segundos
- ✅ Início da geração de áudio: < 30 segundos
- ✅ Geração completa de áudio: < 5 minutos
- ✅ Verificação de status: < 5 segundos

**Status**: ✅ Atendido

#### RNF003 - Throughput
**Descrição**: Sistema deve suportar múltiplos usuários simultâneos.

**Critérios**:
- 🔄 Usuários simultâneos: 50+ (fase MVP)
- 🔄 Requisições por minuto: 500+
- 🔄 Geração simultânea: 10+ músicas

**Status**: 🔄 Em validação

### 3.2 Escalabilidade

#### RNF004 - Escalabilidade Horizontal
**Descrição**: Arquitetura deve permitir escalonamento.

**Critérios**:
- ✅ Frontend: Servido via CDN (Vercel)
- ✅ Backend: Stateless (pode ser replicado)
- ❌ Banco de dados: PostgreSQL (Supabase)
- ❌ Cache: Em memória (limitação atual)

**Limitações Atuais**:
- Tarefas de geração armazenadas em memória
- Sem load balancer implementado

**Status**: 🔄 Parcialmente atendido

#### RNF005 - Crescimento de Dados
**Descrição**: Sistema deve suportar crescimento de volume de dados.

**Critérios**:
- ✅ Banco de dados: Supabase (escalável)
- ❌ Armazenamento de arquivos: Não implementado
- ❌ Logs: Não persistidos

**Status**: 🔄 Parcialmente atendido

### 3.3 Disponibilidade

#### RNF006 - Uptime
**Descrição**: Sistema deve estar disponível na maior parte do tempo.

**Critérios**:
- 🎯 Uptime objetivo: 99.5% (MVP)
- 🎯 Uptime futuro: 99.9%
- ✅ Monitoramento: Logs de aplicação
- ❌ Alertas: Não implementados

**Status**: 🔄 Em monitoramento

#### RNF007 - Recuperação de Falhas
**Descrição**: Sistema deve se recuperar graciosamente de falhas.

**Critérios**:
- ✅ Retry automático em APIs externas
- ✅ Tratamento de erros com mensagens amigáveis
- ✅ Fallbacks para funcionalidades críticas
- ❌ Backup automático de dados

**Status**: 🔄 Parcialmente atendido

### 3.4 Segurança

#### RNF008 - Proteção de Dados
**Descrição**: Dados dos usuários devem ser protegidos.

**Critérios**:
- ✅ HTTPS obrigatório
- ✅ Validação de entrada (sanitização)
- ✅ Não armazenamento de dados pessoais
- ✅ Chaves de API como variáveis de ambiente
- ❌ Rate limiting não implementado

**Status**: 🔄 Parcialmente atendido

#### RNF009 - Privacidade
**Descrição**: Privacidade dos usuários deve ser respeitada.

**Critérios**:
- ✅ Não coleta de dados pessoais identificáveis
- ✅ Processamento temporário de informações
- ✅ Não compartilhamento com terceiros
- ❌ Política de privacidade não implementada

**Status**: 🔄 Parcialmente atendido

### 3.5 Usabilidade

#### RNF010 - Experiência do Usuário
**Descrição**: Interface deve ser intuitiva e fácil de usar.

**Critérios**:
- ✅ Design responsivo (mobile-first)
- ✅ Navegação intuitiva
- ✅ Feedback visual para ações
- ✅ Mensagens de erro claras
- ✅ Indicadores de progresso
- ✅ Acessibilidade básica

**Medição**: SUS Score > 70 (System Usability Scale)
**Status**: ✅ Atendido

#### RNF011 - Acessibilidade
**Descrição**: Sistema deve ser acessível a usuários com deficiências.

**Critérios**:
- ✅ Contraste adequado (WCAG AA)
- ✅ Navegação por teclado
- ✅ Labels semânticos
- ✅ Alt text em imagens
- 🔄 Screen reader compatibility

**Padrão**: WCAG 2.1 AA
**Status**: 🔄 Parcialmente atendido

### 3.6 Compatibilidade

#### RNF012 - Navegadores Suportados
**Descrição**: Sistema deve funcionar nos principais navegadores.

**Navegadores Suportados**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ Internet Explorer (não suportado)

**Status**: ✅ Atendido

#### RNF013 - Dispositivos Suportados
**Descrição**: Sistema deve funcionar em diferentes dispositivos.

**Dispositivos**:
- ✅ Desktop (1920x1080+)
- ✅ Tablet (768x1024+)
- ✅ Mobile (375x667+)
- ✅ Touch screen support

**Status**: ✅ Atendido

### 3.7 Manutenibilidade

#### RNF014 - Qualidade do Código
**Descrição**: Código deve ser limpo e bem estruturado.

**Critérios**:
- ✅ TypeScript para tipagem estática
- ✅ ESLint para padronização
- ✅ Componentes reutilizáveis
- ✅ Separação de responsabilidades
- ✅ Documentação inline
- ❌ Testes automatizados não implementados

**Status**: 🔄 Parcialmente atendido

#### RNF015 - Monitoramento
**Descrição**: Sistema deve fornecer logs e métricas.

**Critérios**:
- ✅ Logs estruturados no backend
- ✅ Tratamento de erros detalhado
- ❌ Métricas de performance não coletadas
- ❌ Dashboard de monitoramento não implementado

**Status**: 🔄 Parcialmente atendido

### 3.8 Portabilidade

#### RNF016 - Deploy e Infraestrutura
**Descrição**: Sistema deve ser facilmente deployável.

**Critérios**:
- ✅ Deploy automatizado (Vercel)
- ✅ Variáveis de ambiente configuráveis
- ✅ Sem dependências de sistema específico
- ✅ Containerização possível (Docker)

**Status**: ✅ Atendido

## 4. Restrições e Limitações

### 4.1 Limitações Técnicas Atuais

#### Dependências Externas
- **OpenAI API**: Dependência crítica para geração de letras
- **Suno AI API**: Dependência crítica para geração de áudio
- **Supabase**: Dependência para persistência de dados

#### Limitações de Arquitetura
- **Armazenamento em memória**: Tarefas perdidas em restart do servidor
- **Sem autenticação**: Não há controle de acesso ou histórico
- **Sem rate limiting**: Vulnerável a abuso

#### Limitações de Funcionalidade
- **Idioma único**: Apenas português brasileiro
- **Formatos limitados**: Apenas MP3 para áudio
- **Sem edição**: Não é possível editar letras geradas

### 4.2 Restrições de Negócio

#### Custos de API
- OpenAI: ~$0.02-0.06 por música
- Suno AI: ~$0.10-0.20 por música
- Total: ~$0.12-0.26 por música

#### Limites de Uso
- Suno AI: 500 gerações/mês (plano atual)
- OpenAI: $100/mês de crédito

### 4.3 Restrições Regulatórias

#### Direitos Autorais
- Músicas geradas são consideradas obras derivadas
- Uso comercial requer licenciamento adequado
- Responsabilidade do usuário final

#### Privacidade
- LGPD: Não coleta dados pessoais identificáveis
- GDPR: Aplicável para usuários europeus
- Política de privacidade necessária para produção

## 5. Critérios de Aceitação Globais

### 5.1 Funcionalidade
- ✅ Todas as funcionalidades principais implementadas
- ✅ Fluxo completo de criação funcional
- ✅ Integração com APIs externas estável
- ✅ Tratamento de erros adequado

### 5.2 Performance
- ✅ Tempos de resposta dentro dos limites
- 🔄 Suporte a múltiplos usuários simultâneos
- ✅ Interface responsiva e fluida

### 5.3 Qualidade
- ✅ Código limpo e bem estruturado
- ✅ Interface intuitiva e acessível
- ❌ Testes automatizados (pendente)
- 🔄 Documentação completa

### 5.4 Segurança
- ✅ Proteção básica implementada
- ❌ Rate limiting (pendente)
- ❌ Auditoria de segurança (pendente)

## 6. Plano de Evolução

### 6.1 Próximas Iterações

#### Versão 1.1 (Pós-MVP)
- Implementar sistema de autenticação
- Adicionar histórico de músicas
- Implementar rate limiting
- Adicionar testes automatizados

#### Versão 1.2
- Sistema de pagamentos
- Múltiplos idiomas
- Edição de letras
- Compartilhamento social

#### Versão 2.0
- Aplicativo mobile
- API pública
- Dashboard administrativo
- Analytics avançado

### 6.2 Melhorias de Infraestrutura

#### Curto Prazo
- Migrar armazenamento de tarefas para Redis
- Implementar monitoramento com Sentry
- Adicionar CI/CD com GitHub Actions

#### Médio Prazo
- Implementar CDN para arquivos de áudio
- Adicionar load balancer
- Implementar backup automatizado

#### Longo Prazo
- Migrar para arquitetura de microserviços
- Implementar Kubernetes
- Adicionar machine learning próprio

## 7. Métricas de Sucesso

### 7.1 Métricas Técnicas
- **Uptime**: > 99.5%
- **Tempo de resposta médio**: < 2s
- **Taxa de erro**: < 1%
- **Performance Score**: > 90

### 7.2 Métricas de Produto
- **Taxa de conclusão do fluxo**: > 80%
- **Satisfação do usuário**: > 4.0/5.0
- **Taxa de recomendação**: > 70%
- **Tempo médio de criação**: < 5 minutos

### 7.3 Métricas de Negócio
- **Usuários ativos mensais**: 1000+ (6 meses)
- **Músicas criadas por mês**: 500+ (6 meses)
- **Taxa de conversão para pagante**: > 5% (pós-monetização)

Este documento serve como referência para desenvolvimento, testes e validação da plataforma Memora Music, garantindo que todos os requisitos sejam atendidos de forma consistente e mensurável.