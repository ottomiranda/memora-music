-- Migração: Adicionar coluna device_id à tabela users
-- Data: 2025-01-15
-- Descrição: Adiciona coluna device_id para rastreamento de dispositivos anônimos

-- Adicionar coluna device_id à tabela users
ALTER TABLE users ADD COLUMN device_id TEXT;

-- Criar índice para melhor performance nas consultas por device_id
CREATE INDEX idx_users_device_id ON users(device_id);

-- Adicionar comentário à coluna
COMMENT ON COLUMN users.device_id IS 'Identificador único do dispositivo para usuários anônimos';

-- Verificar se a coluna foi criada com sucesso
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'device_id';