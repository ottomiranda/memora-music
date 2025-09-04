-- Criar usuário de teste para endpoints do paywall
INSERT INTO users (id, email, password_hash, name, freesongsused) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@example.com',
  'test_hash',
  'Test User',
  0
) ON CONFLICT (id) DO NOTHING;

-- Garantir permissões para as tabelas
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON mock_transactions TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON mock_transactions TO anon;