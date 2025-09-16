-- Script para verificar se o usuário mari@marianadoces.com.br existe na tabela auth.users
-- Este script irá mostrar todos os detalhes do usuário se ele existir

SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    confirmation_token,
    confirmation_sent_at,
    raw_user_meta_data,
    raw_app_meta_data,
    deleted_at,
    is_anonymous
FROM auth.users 
WHERE email = 'mari@marianadoces.com.br';

-- Também vamos verificar se há algum usuário com email similar
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    deleted_at
FROM auth.users 
WHERE email ILIKE '%mari%' OR email ILIKE '%mariana%';

-- Verificar todos os usuários criados nas últimas 24 horas
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    deleted_at
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Verificar usuários com confirmation_token pendente
SELECT 
    id,
    email,
    confirmation_token,
    confirmation_sent_at,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE confirmation_token IS NOT NULL 
  AND email_confirmed_at IS NULL
ORDER BY created_at DESC;