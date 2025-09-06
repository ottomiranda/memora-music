# Guia: Conectar Repositório GitHub ao Projeto Render Existente

## Situação
✅ Projeto `memora-music` já criado no Render.com  
✅ Variáveis de ambiente configuradas  
❓ Repositório GitHub ainda não conectado  

## Passo a Passo Detalhado

### 1. Acessar o Dashboard do Render

1. Abra seu navegador
2. Vá para: https://dashboard.render.com
3. Faça login com suas credenciais
4. Você verá a lista de projetos/serviços

### 2. Localizar o Projeto memora-music

1. Na lista de projetos, procure por `memora-music`
2. Clique no nome do projeto para abrir
3. Você verá o status atual do projeto

### 3. Conectar o Repositório

#### Opção A: Se o projeto está vazio (sem repositório)

1. **Clique em "Connect Repository"**
   - Botão geralmente no centro da tela
   - Ou no menu lateral "Settings" > "Repository"

2. **Selecionar Provedor Git**
   - Clique em "GitHub"
   - Se for a primeira vez, você precisará autorizar o Render

3. **Autorizar o Render (se necessário)**
   - Uma janela do GitHub será aberta
   - Clique em "Authorize Render"
   - Confirme sua senha se solicitado

4. **Selecionar Repositório**
   - Lista de repositórios aparecerá
   - Procure pelo repositório do Memora Music
   - Clique em "Connect" ao lado do repositório correto

5. **Configurar Branch**
   - Selecione a branch `main` (ou `master`)
   - Esta será a branch de deploy automático

#### Opção B: Se o projeto já tem um repositório (trocar repositório)

1. **Ir para Settings**
   - Clique em "Settings" no menu do projeto
   - Procure por "Repository" ou "Source Code"

2. **Disconnect Repository Atual**
   - Clique em "Disconnect" ou "Change Repository"
   - Confirme a ação

3. **Conectar Novo Repositório**
   - Siga os passos da Opção A acima

### 4. Configurar Blueprint (render.yaml)

1. **Detectar Blueprint**
   - O Render escaneará o repositório
   - Procurará pelo arquivo `render.yaml`
   - Mostrará uma mensagem: "Blueprint detected"

2. **Aplicar Blueprint**
   - Clique em "Apply Blueprint" ou "Use Blueprint"
   - O Render lerá o `render.yaml`
   - Criará os serviços definidos:
     - `memora-music-backend`
     - `memora-music-frontend`
     - `memora-music-db` (se configurado)

3. **Confirmar Configurações**
   - Revise os serviços que serão criados
   - Verifique se as configurações estão corretas
   - Clique em "Create Services" ou "Deploy"

### 5. Verificar Conexão Bem-sucedida

#### Indicadores de Sucesso:
- ✅ Status: "Repository Connected"
- ✅ Branch: `main` selecionada
- ✅ Último commit visível
- ✅ Serviços criados automaticamente

#### No Dashboard você verá:
```
📁 memora-music
├── 🌐 memora-music-backend (Web Service)
├── 📄 memora-music-frontend (Static Site)
└── 🗄️ memora-music-db (Database)
```

### 6. Configurar Deploy Automático

1. **Webhook Automático**
   - O Render configura automaticamente um webhook no GitHub
   - Cada push na branch `main` disparará um novo deploy

2. **Verificar Webhook (opcional)**
   - Vá para seu repositório no GitHub
   - Settings > Webhooks
   - Deve haver um webhook do Render listado

### 7. Primeiro Deploy

Após conectar o repositório:

1. **Deploy Automático Iniciará**
   - O Render fará o primeiro deploy automaticamente
   - Você verá os logs de build em tempo real

2. **Monitorar Progresso**
   - Clique em cada serviço para ver os logs
   - Status mudará de "Building" → "Deploying" → "Live"

### 8. Troubleshooting da Conexão

#### ❌ Erro: "Repository not found"
**Causa:** Repositório privado ou sem permissão
**Solução:**
1. Verifique se o repositório é público
2. Ou autorize o Render para repositórios privados
3. Vá para GitHub Settings > Applications > Render
4. Conceda acesso ao repositório específico

#### ❌ Erro: "Blueprint not detected"
**Causa:** Arquivo `render.yaml` não encontrado
**Solução:**
1. Verifique se `render.yaml` está na raiz do repositório
2. Confirme que o arquivo foi commitado e pushed
3. Verifique a sintaxe YAML

#### ❌ Erro: "Invalid Blueprint"
**Causa:** Erro de sintaxe no `render.yaml`
**Solução:**
1. Valide a sintaxe YAML online
2. Verifique indentação (use espaços, não tabs)
3. Confirme que todos os campos obrigatórios estão presentes

#### ❌ Erro: "Build failed"
**Causa:** Erro no código ou dependências
**Solução:**
1. Verifique os logs de build
2. Teste o build localmente: `npm install && npm run build`
3. Corrija erros e faça novo push

### 9. Próximos Passos

Após conectar com sucesso:

1. **✅ Verificar Deploy**
   - Aguarde conclusão do primeiro deploy
   - Teste as URLs fornecidas

2. **✅ Configurar Domínio**
   - Configure `memora.music` como domínio personalizado
   - Siga o guia de configuração de DNS

3. **✅ Monitorar**
   - Configure alertas de deploy
   - Monitore logs regularmente

### 10. Comandos Úteis

```bash
# Verificar se render.yaml está correto
cat render.yaml

# Testar build localmente (backend)
cd api && npm install && npm run build

# Testar build localmente (frontend)
npm install && npm run build

# Verificar último commit
git log -1 --oneline

# Forçar novo deploy (push vazio)
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

---

## ✅ Checklist de Conexão

- [ ] Acesso ao dashboard do Render
- [ ] Projeto `memora-music` localizado
- [ ] Repositório GitHub conectado
- [ ] Branch `main` selecionada
- [ ] Blueprint `render.yaml` detectado e aplicado
- [ ] Serviços criados automaticamente
- [ ] Primeiro deploy iniciado
- [ ] Webhook configurado no GitHub
- [ ] Deploy automático funcionando

**🎯 Resultado:** Repositório conectado e deploy automático configurado!

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique a [documentação oficial do Render](https://render.com/docs)
2. Consulte os logs detalhados no dashboard
3. Entre em contato com o suporte do Render
4. Verifique o status do GitHub e Render em suas páginas de status