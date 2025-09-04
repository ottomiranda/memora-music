# Implementação do Paywall com Gateway de Pagamento Simulado

## 1. Visão Geral do Produto

Sistema de monetização para criação de músicas onde a primeira música é gratuita e as subsequentes são pagas. O sistema utiliza um gateway de pagamento simulado para desenvolvimento e testes, garantindo segurança através de validação no back-end.

## 2. Funcionalidades Principais

### 2.1 Papéis de Usuário

| Papel | Método de Registro | Permissões Principais |
|-------|-------------------|----------------------|
| Usuário Autenticado | Email/Google | Pode criar 1 música gratuita, músicas adicionais são pagas |

### 2.2 Módulos de Funcionalidade

Nosso sistema de paywall consiste nas seguintes páginas principais:
1. **Página de Criação**: aviso de custo, fluxo de pagamento simulado
2. **Popup de Pagamento**: interface de pagamento simulado, confirmação de transação
3. **Página de Resultados**: botão "Criar outra música" com verificação de status

### 2.3 Detalhes das Páginas

| Nome da Página | Nome do Módulo | Descrição da Funcionalidade |
|----------------|----------------|-----------------------------|
| Página de Criação | Sistema de Aviso | Exibir toast/notificação sobre custo da segunda música |
| Página de Criação | Verificação de Status | Consultar endpoint para determinar se próxima música é gratuita |
| Popup de Pagamento | Interface de Pagamento | Exibir formulário de pagamento simulado com preço |
| Popup de Pagamento | Confirmação de Transação | Processar pagamento simulado e liberar criação |
| Página de Resultados | Botão Criar Outra | Verificar status do usuário e redirecionar para fluxo apropriado |

## 3. Processo Principal

### Fluxo do Usuário para Segunda Música

1. Usuário clica em "Criar outra música" na página de resultados
2. Sistema verifica status do usuário via API
3. Se não for gratuita, exibe aviso de custo na página de criação
4. Usuário prossegue com o fluxo de criação
5. Antes da geração, sistema exibe popup de pagamento simulado
6. Usuário confirma pagamento simulado
7. Sistema processa pagamento e libera geração da música

```mermaid
graph TD
    A[Página de Resultados] --> B[Clique "Criar Outra"]
    B --> C[Verificar Status API]
    C --> D{É Gratuita?}
    D -->|Sim| E[Fluxo Normal]
    D -->|Não| F[Página Criação + Aviso]
    F --> G[Escolher Gênero]
    G --> H[Popup Pagamento]
    H --> I[Confirmar Pagamento]
    I --> J[Gerar Música]
```

## 4. Design da Interface

### 4.1 Estilo de Design

- Cores primárias: Azul (#3B82F6) e Verde (#10B981) para ações de pagamento
- Cores secundárias: Vermelho (#EF4444) para avisos de custo
- Estilo de botão: Arredondado com gradiente para botões de pagamento
- Fonte: Inter, tamanhos 14px (corpo), 18px (títulos)
- Layout: Modal centralizado para popup de pagamento
- Ícones: Lucide icons para cartão de crédito e verificação

### 4.2 Visão Geral do Design das Páginas

| Nome da Página | Nome do Módulo | Elementos da UI |
|----------------|----------------|----------------|
| Página de Criação | Toast de Aviso | Notificação amarela no topo, ícone de alerta, texto explicativo |
| Popup de Pagamento | Modal de Pagamento | Modal centralizado, fundo escuro, botão verde "Pagar R$ X", ícone de cartão |
| Popup de Pagamento | Loading State | Spinner durante processamento, texto "Processando pagamento..." |

### 4.3 Responsividade

Design mobile-first com adaptação para desktop. Popup de pagamento otimizado para toque em dispositivos móveis.
