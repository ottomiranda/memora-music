# Guia de Contribuição - Memora Music 🎵

Obrigado por considerar contribuir para o Memora Music! Este guia irá ajudá-lo a entender nosso processo de desenvolvimento e como você pode contribuir efetivamente.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Testes](#testes)
- [Documentação](#documentação)
- [Pull Requests](#pull-requests)
- [Issues](#issues)
- [Revisão de Código](#revisão-de-código)

## 📜 Código de Conduta

Este projeto adere ao [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Ao participar, você deve seguir este código.

## 🤝 Como Contribuir

Existem várias maneiras de contribuir:

### 🐛 Reportar Bugs
- Use o template de [bug report](.github/ISSUE_TEMPLATE/bug_report.md)
- Inclua informações detalhadas sobre o ambiente
- Forneça passos para reproduzir o problema
- Adicione screenshots quando relevante

### 💡 Sugerir Funcionalidades
- Use o template de [feature request](.github/ISSUE_TEMPLATE/feature_request.md)
- Descreva claramente o problema que a funcionalidade resolve
- Inclua mockups ou wireframes quando possível
- Considere o impacto na experiência do usuário

### 📚 Melhorar Documentação
- Use o template de [documentation](.github/ISSUE_TEMPLATE/documentation.md)
- Identifique lacunas na documentação existente
- Proponha melhorias na clareza e organização
- Adicione exemplos práticos

### 💻 Contribuir com Código
- Escolha uma issue existente ou crie uma nova
- Siga o fluxo de desenvolvimento descrito abaixo
- Mantenha os padrões de código estabelecidos
- Inclua testes para suas mudanças

## 🛠️ Configuração do Ambiente

### Pré-requisitos
- Node.js 18+ (recomendado: 20 LTS)
- npm ou pnpm
- Git
- Editor de código (recomendado: VS Code)

### Configuração Inicial

1. **Fork o repositório**
   ```bash
   # No GitHub, clique em "Fork"
   ```

2. **Clone seu fork**
   ```bash
   git clone https://github.com/SEU_USUARIO/memora.music.git
   cd memora.music
   ```

3. **Adicione o repositório original como upstream**
   ```bash
   git remote add upstream https://github.com/USUARIO_ORIGINAL/memora.music.git
   ```

4. **Instale as dependências**
   ```bash
   npm install
   ```

5. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite o .env com suas configurações
   ```

6. **Valide a configuração**
   ```bash
   npm run validate-env
   npm run check
   ```

### Extensões Recomendadas (VS Code)

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

## 🔄 Fluxo de Desenvolvimento

### 1. Sincronizar com o repositório principal
```bash
git checkout develop
git pull upstream develop
```

### 2. Criar uma branch para sua funcionalidade
```bash
# Para funcionalidades
git checkout -b feature/nome-da-funcionalidade

# Para correções
git checkout -b bugfix/nome-do-bug

# Para hotfixes
git checkout -b hotfix/nome-do-hotfix
```

### 3. Desenvolver e testar
```bash
# Executar em modo de desenvolvimento
npm run dev

# Executar testes
npm test

# Verificar qualidade do código
npm run check
```

### 4. Commit suas mudanças
```bash
# Adicionar arquivos
git add .

# Commit seguindo Conventional Commits
git commit -m "feat: adiciona funcionalidade X"
```

### 5. Push e criar Pull Request
```bash
git push origin feature/nome-da-funcionalidade
# Criar PR no GitHub
```

## 📝 Padrões de Código

### Conventional Commits
Usamos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos permitidos:**
- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: mudanças na documentação
- `style`: formatação, sem mudança de lógica
- `refactor`: refatoração de código
- `perf`: melhoria de performance
- `test`: adição ou correção de testes
- `chore`: tarefas de manutenção
- `ci`: mudanças no CI/CD
- `build`: mudanças no sistema de build

**Exemplos:**
```bash
feat(auth): adiciona login com Google
fix(api): corrige erro de validação no endpoint de usuários
docs: atualiza README com instruções de deploy
style: formata código com prettier
refactor(components): extrai lógica comum do PlayerCard
test(utils): adiciona testes para função formatDuration
```

### TypeScript
- Use TypeScript estrito
- Defina tipos explícitos quando necessário
- Evite `any`, prefira `unknown`
- Use interfaces para objetos complexos
- Documente tipos complexos com JSDoc

```typescript
// ✅ Bom
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
  return {
    id: generateId(),
    createdAt: new Date(),
    ...userData,
  };
};

// ❌ Evitar
const createUser = (userData: any) => {
  // ...
};
```

### React
- Use componentes funcionais com hooks
- Mantenha componentes pequenos e focados
- Use TypeScript para props
- Implemente tratamento de erro
- Use memo quando apropriado

```tsx
// ✅ Bom
interface PlayerCardProps {
  track: Track;
  isPlaying: boolean;
  onPlay: (trackId: string) => void;
  className?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  track,
  isPlaying,
  onPlay,
  className,
}) => {
  const handlePlay = useCallback(() => {
    onPlay(track.id);
  }, [track.id, onPlay]);

  return (
    <div className={cn('player-card', className)}>
      {/* conteúdo */}
    </div>
  );
};

export default memo(PlayerCard);
```

### CSS/Tailwind
- Use Tailwind CSS para estilização
- Mantenha classes organizadas
- Use variáveis CSS para valores reutilizáveis
- Implemente design responsivo

```tsx
// ✅ Bom
<div className="
  flex items-center justify-between
  p-4 rounded-lg
  bg-white dark:bg-gray-800
  shadow-sm hover:shadow-md
  transition-shadow duration-200
  sm:p-6 md:p-8
">
```

### Backend/API
- Use middleware para validação
- Implemente tratamento de erro consistente
- Documente endpoints com JSDoc
- Use status codes HTTP apropriados

```typescript
// ✅ Bom
/**
 * GET /api/tracks
 * Retorna lista de tracks do usuário
 */
app.get('/api/tracks', authenticateUser, async (req, res) => {
  try {
    const tracks = await trackService.getUserTracks(req.user.id);
    res.json({ data: tracks, success: true });
  } catch (error) {
    logger.error('Erro ao buscar tracks:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      success: false 
    });
  }
});
```

## 🧪 Testes

### Estrutura de Testes
```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── e2e/           # Testes end-to-end
└── __mocks__/     # Mocks globais
```

### Padrões de Teste

```typescript
// ✅ Bom - Teste unitário
describe('formatDuration', () => {
  it('should format seconds to MM:SS format', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(59)).toBe('0:59');
    expect(formatDuration(0)).toBe('0:00');
  });

  it('should handle invalid input', () => {
    expect(formatDuration(-1)).toBe('0:00');
    expect(formatDuration(NaN)).toBe('0:00');
  });
});

// ✅ Bom - Teste de componente
describe('PlayerCard', () => {
  const mockTrack = {
    id: '1',
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 180,
  };

  it('should render track information', () => {
    render(
      <PlayerCard 
        track={mockTrack} 
        isPlaying={false} 
        onPlay={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('should call onPlay when play button is clicked', () => {
    const mockOnPlay = jest.fn();
    
    render(
      <PlayerCard 
        track={mockTrack} 
        isPlaying={false} 
        onPlay={mockOnPlay} 
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(mockOnPlay).toHaveBeenCalledWith('1');
  });
});
```

### Executar Testes
```bash
# Todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:coverage

# Testes E2E
npm run test:e2e

# Testes específicos
npm test -- PlayerCard
```

## 📚 Documentação

### JSDoc para Funções
```typescript
/**
 * Formata duração em segundos para formato MM:SS
 * @param seconds - Duração em segundos
 * @returns String formatada no formato MM:SS
 * @example
 * formatDuration(125) // "2:05"
 */
const formatDuration = (seconds: number): string => {
  // implementação
};
```

### README de Componentes
Para componentes complexos, crie um README:

```markdown
# PlayerCard Component

## Descrição
Componente para exibir informações de uma música com controles de reprodução.

## Props
| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|----------|
| track | Track | Sim | Dados da música |
| isPlaying | boolean | Sim | Se está tocando |
| onPlay | function | Sim | Callback ao clicar play |

## Exemplo de Uso
```tsx
<PlayerCard
  track={currentTrack}
  isPlaying={isPlaying}
  onPlay={handlePlay}
/>
```
```

## 🔍 Pull Requests

### Checklist do PR
Antes de abrir um PR, verifique:

- [ ] Código segue os padrões estabelecidos
- [ ] Testes passam localmente
- [ ] Testes adicionados para novas funcionalidades
- [ ] Documentação atualizada
- [ ] Commits seguem Conventional Commits
- [ ] Branch está atualizada com develop
- [ ] Não há conflitos de merge

### Template do PR
Use o template em `.github/pull_request_template.md`:

- Descrição clara das mudanças
- Issues relacionadas
- Screenshots (se aplicável)
- Instruções de teste
- Considerações especiais

### Processo de Review
1. **Automated Checks**: CI/CD deve passar
2. **Code Review**: Pelo menos 1 aprovação
3. **Testing**: Reviewer testa as mudanças
4. **Merge**: Squash and merge para main

## 🐛 Issues

### Reportar Bugs
1. Verifique se já existe uma issue similar
2. Use o template de bug report
3. Inclua informações do ambiente
4. Forneça passos para reproduzir
5. Adicione labels apropriadas

### Sugerir Funcionalidades
1. Verifique o roadmap do projeto
2. Use o template de feature request
3. Descreva o problema que resolve
4. Proponha uma solução
5. Considere alternativas

### Labels
- `bug`: Algo não está funcionando
- `enhancement`: Nova funcionalidade
- `documentation`: Melhorias na documentação
- `good first issue`: Boa para iniciantes
- `help wanted`: Ajuda externa bem-vinda
- `priority: high/medium/low`: Prioridade
- `status: in-progress`: Em desenvolvimento

## 👥 Revisão de Código

### Para Revisores
- **Funcionalidade**: O código faz o que deveria?
- **Legibilidade**: O código é claro e bem documentado?
- **Performance**: Há oportunidades de otimização?
- **Segurança**: Há vulnerabilidades potenciais?
- **Testes**: A cobertura é adequada?
- **Padrões**: Segue os padrões do projeto?

### Para Autores
- Responda aos comentários construtivamente
- Faça mudanças solicitadas prontamente
- Explique decisões de design quando necessário
- Mantenha PRs pequenos e focados
- Teste suas mudanças completamente

## 🎯 Dicas para Contribuidores

### Primeiras Contribuições
- Procure issues marcadas como `good first issue`
- Comece com correções pequenas
- Leia o código existente para entender padrões
- Não hesite em fazer perguntas

### Contribuições Efetivas
- Mantenha PRs pequenos e focados
- Escreva mensagens de commit descritivas
- Inclua testes para suas mudanças
- Atualize documentação quando necessário
- Seja paciente durante o processo de review

### Comunicação
- Use linguagem respeitosa e construtiva
- Seja específico em comentários e sugestões
- Explique o "porquê" além do "o quê"
- Reconheça o trabalho dos outros

## 📞 Suporte

Se você tiver dúvidas ou precisar de ajuda:

- **Issues**: Para bugs e funcionalidades
- **Discussions**: Para perguntas gerais
- **Discord**: [Link do servidor] (se aplicável)
- **Email**: [email de contato] (se aplicável)

## 🙏 Reconhecimento

Todos os contribuidores são reconhecidos em nosso [CONTRIBUTORS.md](CONTRIBUTORS.md). Obrigado por fazer o Memora Music melhor!

---

**Lembre-se**: Contribuir para open source é uma jornada de aprendizado. Não tenha medo de cometer erros - todos nós estamos aqui para aprender e crescer juntos! 🚀