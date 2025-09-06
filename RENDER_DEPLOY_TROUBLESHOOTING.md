# Guia de Troubleshooting - Deploy no Render.com

## Problemas Identificados e Soluções

### 1. Erro: "npm error Missing script: 'start'"

**Problema:**
```
npm error Missing script: "start"
```

**Causa:**
O Render.com tenta executar `npm start` por padrão quando não encontra um comando específico, mas o script "start" não estava definido no `package.json`.

**Solução Aplicada:**
Adicionado o script "start" no `package.json`:
```json
{
  "scripts": {
    "start": "npx tsx api/server.ts",
    // ... outros scripts
  }
}
```

### 2. Warning: Bundle Size > 500KB

**Problema:**
```
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking
```

**Causa:**
O bundle JavaScript estava muito grande (582.18 kB), impactando performance de carregamento.

**Solução Aplicada:**
Configurado `manualChunks` no `vite.config.ts` para separar dependências em chunks menores:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'radix-vendor': [
          '@radix-ui/react-dialog',
          '@radix-ui/react-dropdown-menu',
          // ... outros componentes Radix
        ],
        'utils-vendor': [
          'axios', 'date-fns', 'zod', 'zustand', '@tanstack/react-query'
        ],
        'ui-vendor': [
          'lucide-react', 'recharts', 'embla-carousel-react'
        ]
      }
    }
  },
  chunkSizeWarningLimit: 1000
}
```

## Configuração do Render.yaml

O arquivo `render.yaml` está configurado corretamente:

### Backend Service
```yaml
- type: web
  name: memora-music-backend
  env: node
  buildCommand: npm install
  startCommand: npx tsx api/server.ts  # Comando correto
  healthCheckPath: /api/health
```

### Frontend Service
```yaml
- type: static
  name: memora-music-frontend
  env: node
  buildCommand: npm install && npm run build
  staticPublishPath: ./dist
```

## Próximos Passos para Deploy

1. **Commit das Correções:**
   ```bash
   git add .
   git commit -m "fix: adicionar script start e otimizar bundle size para deploy"
   git push origin main
   ```

2. **Disparar Novo Deploy:**
   - Acesse o dashboard do Render.com
   - Vá para o projeto "memora-music"
   - Clique em "Manual Deploy" ou aguarde o deploy automático

3. **Monitorar Logs:**
   - Acompanhe os logs de build e deploy
   - Verifique se não há mais erros de "Missing script"
   - Confirme que o bundle foi otimizado

## Verificações Pós-Deploy

### Backend Health Check
```bash
curl https://memora-music-backend.onrender.com/api/health
```

### Frontend Acessibilidade
- Acesse: `https://memora-music-frontend.onrender.com`
- Verifique se a aplicação carrega corretamente
- Teste funcionalidades principais

### Performance
- Verifique se os chunks estão sendo carregados separadamente
- Monitore tempos de carregamento
- Use DevTools para analisar Network tab

## Troubleshooting Adicional

### Se ainda houver erros de "Missing script":
1. Verifique se o `package.json` foi commitado corretamente
2. Confirme que o Render está usando a branch correta
3. Force um rebuild completo no dashboard

### Se o bundle ainda estiver grande:
1. Analise quais dependências estão causando o problema:
   ```bash
   npm run build -- --analyze
   ```
2. Considere lazy loading para rotas:
   ```typescript
   const LazyComponent = lazy(() => import('./Component'));
   ```

### Logs Úteis para Debug:
- Build logs: Mostram erros de compilação
- Deploy logs: Mostram erros de inicialização
- Runtime logs: Mostram erros em execução

## Contatos e Recursos

- [Render.com Troubleshooting](https://render.com/docs/troubleshooting-deploys)
- [Vite Bundle Optimization](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)

---

**Status:** ✅ Correções aplicadas e prontas para deploy
**Data:** $(date +%Y-%m-%d)
**Responsável:** SOLO Coding Assistant