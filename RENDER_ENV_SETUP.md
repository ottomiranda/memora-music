# Configuração de Variáveis de Ambiente no Render

## Variáveis Obrigatórias

Para que o deploy funcione corretamente, você precisa configurar as seguintes variáveis de ambiente no painel do Render:

### 1. Grupo supabase-config

Crie um grupo de variáveis chamado `supabase-config` com:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de service role do Supabase

### 2. Variáveis Automáticas

Estas são configuradas automaticamente pelo render.yaml:

- `NODE_ENV`: production (já configurado)
- `NEXTAUTH_SECRET`: gerado automaticamente
- `NEXTAUTH_URL`: https://memora-music.onrender.com
- `NEXT_PUBLIC_APP_URL`: https://memora-music.onrender.com

### 3. Variáveis Opcionais

Configure conforme necessário:

- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: Para login com Google
- `GITHUB_ID` e `GITHUB_SECRET`: Para login com GitHub
- `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET`: Para integração Spotify
- `SENTRY_DSN`: Para monitoramento de erros
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Para Google Analytics

## Como Configurar no Render

1. Acesse o dashboard do Render
2. Vá em "Environment Groups" no menu lateral
3. Crie o grupo `supabase-config`
4. Adicione as variáveis do Supabase
5. Faça o redeploy do serviço

## Verificação

Após configurar, o script `validate-env.js` não deve mais apresentar erros de variáveis obrigatórias faltando.

## Troubleshooting

- Se ainda houver erros de variáveis faltando, verifique se o grupo `supabase-config` foi criado corretamente
- Certifique-se de que as variáveis têm os nomes exatos mostrados acima
- Após alterar variáveis, sempre faça um redeploy manual