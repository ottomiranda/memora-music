# Configuração de Proteção de Branches

Este documento descreve as configurações de proteção de branches que devem ser aplicadas no repositório GitHub.

## Branch Principal (main)

### Regras de Proteção
- ✅ **Require a pull request before merging**
  - Require approvals: **2**
  - Dismiss stale PR approvals when new commits are pushed
  - Require review from code owners
  - Restrict pushes that create files larger than 100MB

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging
  - Status checks required:
    - `CI / validate (ubuntu-latest, 18.x)`
    - `CI / validate (ubuntu-latest, 20.x)`
    - `Quality / quality-check`
    - `Quality / security-scan`
    - `Quality / build-matrix (ubuntu-latest, 18.x)`
    - `Quality / build-matrix (ubuntu-latest, 20.x)`
    - `Quality / build-matrix (macos-latest, 18.x)`
    - `Quality / build-matrix (windows-latest, 18.x)`

- ✅ **Require conversation resolution before merging**
- ✅ **Require signed commits**
- ✅ **Require linear history**
- ✅ **Include administrators**
- ✅ **Restrict pushes**
  - Pessoas e equipes com acesso de push:
    - Maintainers
    - Admins
- ✅ **Allow force pushes**: Disabled
- ✅ **Allow deletions**: Disabled

## Branch de Desenvolvimento (develop)

### Regras de Proteção
- ✅ **Require a pull request before merging**
  - Require approvals: **1**
  - Dismiss stale PR approvals when new commits are pushed
  - Require review from code owners (opcional)

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging
  - Status checks required:
    - `CI / validate (ubuntu-latest, 18.x)`
    - `Quality / quality-check`
    - `Quality / security-scan`

- ✅ **Require conversation resolution before merging**
- ✅ **Include administrators**
- ✅ **Allow force pushes**: Disabled
- ✅ **Allow deletions**: Disabled

## Branches de Feature

### Padrão de Nomenclatura
- `feature/*`
- `bugfix/*`
- `hotfix/*`
- `release/*`

### Regras
- Devem ser criadas a partir de `develop`
- Devem fazer merge para `develop` via Pull Request
- Não possuem proteção específica
- Podem ser deletadas após merge

## Configuração via GitHub CLI

```bash
# Instalar GitHub CLI se necessário
brew install gh

# Autenticar
gh auth login

# Configurar proteção para branch main
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / validate (ubuntu-latest, 18.x)","CI / validate (ubuntu-latest, 20.x)","Quality / quality-check","Quality / security-scan"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":2,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field required_linear_history=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false

# Configurar proteção para branch develop
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / validate (ubuntu-latest, 18.x)","Quality / quality-check","Quality / security-scan"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## Configuração Manual no GitHub

1. Acesse o repositório no GitHub
2. Vá para **Settings** > **Branches**
3. Clique em **Add rule** para cada branch
4. Configure as regras conforme especificado acima

## Code Owners

Crie o arquivo `.github/CODEOWNERS` para definir revisores automáticos:

```
# Global owners
* @team-leads @senior-devs

# Frontend
/src/ @frontend-team
/public/ @frontend-team

# Backend
/api/ @backend-team
/server/ @backend-team

# Infrastructure
/.github/ @devops-team
/docker/ @devops-team
/scripts/ @devops-team

# Documentation
/docs/ @tech-writers @team-leads
*.md @tech-writers

# Configuration files
package.json @team-leads
tsconfig.json @team-leads
.env.example @team-leads @devops-team
```

## Fluxo de Trabalho Recomendado

### Para Features
1. Criar branch a partir de `develop`
2. Desenvolver a feature
3. Abrir PR para `develop`
4. Passar por code review
5. Merge após aprovação e testes

### Para Releases
1. Criar branch `release/vX.Y.Z` a partir de `develop`
2. Fazer ajustes finais e testes
3. Abrir PR para `main`
4. Passar por review rigoroso
5. Merge após aprovação
6. Criar tag de release
7. Merge de volta para `develop`

### Para Hotfixes
1. Criar branch `hotfix/issue-description` a partir de `main`
2. Implementar correção
3. Abrir PR para `main`
4. Review expedito mas rigoroso
5. Merge após aprovação
6. Merge de volta para `develop`

## Monitoramento

- Configurar notificações para falhas de proteção
- Revisar regularmente as configurações
- Monitorar tentativas de bypass
- Auditar mudanças nas regras de proteção