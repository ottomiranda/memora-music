-- Função para buscar usuários por email ou nome (necessária pois auth.users não é acessível via REST API)
CREATE OR REPLACE FUNCTION get_users_by_email_or_name(search_term TEXT)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  raw_user_meta_data JSONB,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    u.created_at
  FROM auth.users u
  WHERE 
    u.email ILIKE '%' || search_term || '%' OR
    u.raw_user_meta_data->>'full_name' ILIKE '%' || search_term || '%'
  ORDER BY u.created_at DESC;
END;
$$;

-- Conceder permissões para as roles necessárias
GRANT EXECUTE ON FUNCTION get_users_by_email_or_name(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_users_by_email_or_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_email_or_name(TEXT) TO service_role;