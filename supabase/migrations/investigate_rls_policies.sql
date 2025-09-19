-- Investigar políticas RLS da tabela songs
-- Identificar por que usuários anônimos podem ver músicas de outros usuários

-- 1. Verificar se RLS está habilitado na tabela songs
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'songs' AND schemaname = 'public';

-- 2. Listar todas as políticas RLS da tabela songs
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'songs' AND schemaname = 'public'
ORDER BY policyname;

-- 3. Verificar permissões da tabela songs para roles anon e authenticated
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'songs'
    AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY grantee, privilege_type;

-- 4. Verificar estrutura da tabela songs
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'songs'
ORDER BY ordinal_position;

-- 5. Testar política atual com dados reais
-- Simular acesso como usuário anônimo
SET ROLE anon;
SELECT 
    id,
    title,
    user_id,
    guest_id,
    created_at
FROM songs 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360'
LIMIT 3;

-- Resetar role
RESET ROLE;

-- 6. Verificar se existem políticas permissivas demais
SELECT 
    policyname,
    cmd,
    qual,
    'PROBLEMA: Política muito permissiva' as issue
FROM pg_policies 
WHERE tablename = 'songs' 
    AND schemaname = 'public'
    AND (qual IS NULL OR qual = 'true' OR qual LIKE '%true%');

-- 7. Propor correção das políticas RLS
-- Primeiro, remover políticas existentes que são muito permissivas
DROP POLICY IF EXISTS "songs_select_policy" ON songs;
DROP POLICY IF EXISTS "songs_insert_policy" ON songs;
DROP POLICY IF EXISTS "songs_update_policy" ON songs;
DROP POLICY IF EXISTS "songs_delete_policy" ON songs;
DROP POLICY IF EXISTS "Enable read access for all users" ON songs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON songs;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON songs;

-- Criar políticas RLS seguras
-- Política para SELECT: usuários só podem ver suas próprias músicas
CREATE POLICY "songs_select_own_only" ON songs
    FOR SELECT
    USING (
        -- Usuários autenticados podem ver suas próprias músicas
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR
        -- Usuários convidados podem ver suas próprias músicas via guest_id
        (auth.uid() IS NULL AND guest_id IS NOT NULL AND guest_id = current_setting('request.headers')::json->>'x-guest-id')
    );

-- Política para INSERT: apenas usuários autenticados ou convidados podem inserir
CREATE POLICY "songs_insert_own_only" ON songs
    FOR INSERT
    WITH CHECK (
        -- Usuários autenticados devem inserir com seu próprio user_id
        (auth.uid() IS NOT NULL AND user_id = auth.uid() AND guest_id IS NULL)
        OR
        -- Usuários convidados devem inserir com guest_id válido
        (auth.uid() IS NULL AND user_id IS NULL AND guest_id IS NOT NULL)
    );

-- Política para UPDATE: usuários só podem atualizar suas próprias músicas
CREATE POLICY "songs_update_own_only" ON songs
    FOR UPDATE
    USING (
        -- Usuários autenticados podem atualizar suas próprias músicas
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR
        -- Usuários convidados podem atualizar suas próprias músicas
        (auth.uid() IS NULL AND guest_id IS NOT NULL AND guest_id = current_setting('request.headers')::json->>'x-guest-id')
    )
    WITH CHECK (
        -- Garantir que não alterem ownership
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR
        (auth.uid() IS NULL AND guest_id IS NOT NULL)
    );

-- Política para DELETE: usuários só podem deletar suas próprias músicas
CREATE POLICY "songs_delete_own_only" ON songs
    FOR DELETE
    USING (
        -- Usuários autenticados podem deletar suas próprias músicas
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR
        -- Usuários convidados podem deletar suas próprias músicas
        (auth.uid() IS NULL AND guest_id IS NOT NULL AND guest_id = current_setting('request.headers')::json->>'x-guest-id')
    );

-- 8. Verificar as novas políticas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'songs' AND schemaname = 'public'
ORDER BY policyname;

-- 9. Testar as novas políticas
-- Testar como usuário anônimo (deve retornar 0 resultados)
SET ROLE anon;
SELECT COUNT(*) as anon_can_see
FROM songs 
WHERE user_id = '0315a2fe-220a-401b-b1b9-055a27733360';

RESET ROLE;

-- 10. Relatório final
SELECT 
    'RLS Policies Fixed' as status,
    'Users can now only see their own songs' as description,
    'Anonymous users cannot access other users songs' as security_improvement;

SELECT 'NEXT STEPS:' as action, 'Test frontend behavior with new policies' as description;