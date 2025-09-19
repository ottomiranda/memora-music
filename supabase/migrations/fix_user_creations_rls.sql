-- Verificar políticas RLS existentes na tabela user_creations
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_creations';

-- Conceder permissões para o role anon (usuários não autenticados)
GRANT SELECT, INSERT, UPDATE ON user_creations TO anon;

-- Conceder permissões para o role authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON user_creations TO authenticated;

-- Política para permitir inserção por usuários anônimos e autenticados
DROP POLICY IF EXISTS "Allow insert for all users" ON user_creations;
CREATE POLICY "Allow insert for all users" ON user_creations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para permitir leitura por usuários anônimos e autenticados
DROP POLICY IF EXISTS "Allow select for all users" ON user_creations;
CREATE POLICY "Allow select for all users" ON user_creations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política para permitir atualização por usuários anônimos e autenticados
DROP POLICY IF EXISTS "Allow update for all users" ON user_creations;
CREATE POLICY "Allow update for all users" ON user_creations
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Verificar políticas após criação
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_creations';