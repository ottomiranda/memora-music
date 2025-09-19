-- Migração 011: Adicionar coluna last_used_ip à tabela user_creations
-- Esta coluna armazenará o último IP usado pelo usuário para verificação de segurança

-- Adicionar coluna last_used_ip à tabela user_creations
ALTER TABLE user_creations ADD COLUMN IF NOT EXISTS last_used_ip TEXT;

-- Criar índice para melhor performance nas consultas por IP
CREATE INDEX IF NOT EXISTS idx_user_creations_last_used_ip ON user_creations(last_used_ip);

-- Criar índice composto para consultas que verificam device_id OU last_used_ip
CREATE INDEX IF NOT EXISTS idx_user_creations_device_ip_security ON user_creations(device_id, last_used_ip);

-- Adicionar comentário à coluna
COMMENT ON COLUMN user_creations.last_used_ip IS 'Último endereço IP usado pelo usuário para verificação de segurança contra abusos';

-- Verificar se a migração foi aplicada corretamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_creations' 
        AND column_name = 'last_used_ip'
    ) THEN
        RAISE NOTICE '✅ Coluna last_used_ip adicionada com sucesso à tabela user_creations';
    ELSE
        RAISE EXCEPTION '❌ Falha ao adicionar coluna last_used_ip à tabela user_creations';
    END IF;
END $$;