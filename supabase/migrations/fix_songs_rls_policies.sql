-- Script para corrigir as políticas RLS da tabela songs
-- Problema: usuários anônimos conseguem ver músicas de outros usuários

-- 1. Verificar se RLS está habilitado na tabela songs
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'songs';

-- 2. Listar políticas existentes na tabela songs
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'songs';

-- 3. Verificar permissões atuais para roles anon e authenticated
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'songs' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 4. Remover políticas existentes que podem estar incorretas
DROP POLICY IF EXISTS "Users can view their own songs" ON songs;
DROP POLICY IF EXISTS "Users can insert their own songs" ON songs;
DROP POLICY IF EXISTS "Users can update their own songs" ON songs;
DROP POLICY IF EXISTS "Users can delete their own songs" ON songs;
DROP POLICY IF EXISTS "Public songs are viewable by everyone" ON songs;
DROP POLICY IF EXISTS "Enable read access for all users" ON songs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON songs;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON songs;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON songs;

-- 5. Garantir que RLS está habilitado
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- 6. Revogar todas as permissões existentes para anon e authenticated
REVOKE ALL PRIVILEGES ON songs FROM anon;
REVOKE ALL PRIVILEGES ON songs FROM authenticated;

-- 7. Criar políticas RLS corretas

-- Política para usuários autenticados verem apenas suas próprias músicas
CREATE POLICY "authenticated_users_own_songs" ON songs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para usuários autenticados criarem músicas
CREATE POLICY "authenticated_users_insert_songs" ON songs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários autenticados atualizarem suas próprias músicas
CREATE POLICY "authenticated_users_update_own_songs" ON songs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários autenticados excluírem suas próprias músicas
CREATE POLICY "authenticated_users_delete_own_songs" ON songs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Conceder apenas as permissões necessárias

-- Usuários autenticados podem fazer SELECT, INSERT, UPDATE, DELETE
GRANT SELECT, INSERT, UPDATE, DELETE ON songs TO authenticated;

-- Usuários anônimos NÃO devem ter nenhuma permissão na tabela songs
-- (não concedemos nenhuma permissão para anon)

-- 9. Verificar as novas políticas
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'songs';

-- 10. Verificar as novas permissões
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'songs' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 11. Teste final - esta query deve retornar 0 linhas quando executada com role anon
-- SELECT COUNT(*) as total_songs_visible_to_anon FROM songs;

COMMIT;