-- Verificar políticas RLS existentes na tabela songs
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'songs';

-- Desabilitar RLS temporariamente para teste (CUIDADO: apenas para debug)
-- ALTER TABLE songs DISABLE ROW LEVEL SECURITY;

-- Ou criar uma política mais permissiva para inserção
-- Política para permitir inserção por usuários anônimos e autenticados
DROP POLICY IF EXISTS "Allow insert for all users" ON songs;
CREATE POLICY "Allow insert for all users" ON songs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para permitir leitura por usuários anônimos e autenticados
DROP POLICY IF EXISTS "Allow select for all users" ON songs;
CREATE POLICY "Allow select for all users" ON songs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política para permitir atualização por usuários autenticados
DROP POLICY IF EXISTS "Allow update for authenticated users" ON songs;
CREATE POLICY "Allow update for authenticated users" ON songs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verificar políticas após criação
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'songs';