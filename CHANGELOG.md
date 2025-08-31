# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Configuração completa de CI/CD com GitHub Actions
- Ambientes separados para desenvolvimento e produção
- Templates para issues e pull requests
- Configuração de segurança com Dependabot e CodeQL
- Scripts de validação de ambiente
- Deploy automatizado removido (Vercel integration removed)
- Proteção de branches e políticas de review
- Documentação abrangente do projeto
- Guia de contribuição detalhado

### Changed
- Estrutura do projeto organizada para suportar CI/CD
- Configuração do servidor Express otimizada para segurança
- Package.json atualizado com scripts de qualidade

### Security
- Implementação de cabeçalhos de segurança HTTP
- Configuração de CORS para APIs
- Política de segurança documentada
- Análise automática de vulnerabilidades

## [0.1.0] - 2024-01-XX

### Added
- Configuração inicial do projeto
- Estrutura base do frontend com React + Vite
- Estrutura base do backend com Express.js
- Integração com Supabase
- Configuração do Tailwind CSS
- Configuração básica do TypeScript

### Infrastructure
- Configuração inicial do servidor Express
- Estrutura de pastas organizada
- Configuração de desenvolvimento local

---

## Tipos de Mudanças

- `Added` para novas funcionalidades
- `Changed` para mudanças em funcionalidades existentes
- `Deprecated` para funcionalidades que serão removidas
- `Removed` para funcionalidades removidas
- `Fixed` para correções de bugs
- `Security` para correções de vulnerabilidades
- `Infrastructure` para mudanças na infraestrutura
- `Documentation` para mudanças na documentação

## Versionamento

Este projeto usa [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs compatíveis

## Links

- [Unreleased]: https://github.com/usuario/memora.music/compare/v0.1.0...HEAD
- [0.1.0]: https://github.com/usuario/memora.music/releases/tag/v0.1.0