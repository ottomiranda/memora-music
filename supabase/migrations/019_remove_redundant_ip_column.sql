-- Migração: Remoção da coluna 'ip' redundante da tabela user_creations
-- Data: 2025-01-15
-- Justificativa: A coluna 'ip' não está sendo populada pelo código atual
-- A coluna 'last_used_ip' já cumpre a função de armazenar IPs

-- =====================================================
-- VERIFICAÇÃO PRÉ-MIGRAÇÃO
-- =====================================================

-- Verificar se a coluna ip tem dados importantes
DO $$
DECLARE
    ip_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ip_count FROM user_creations WHERE ip IS NOT NULL;
    
    IF ip_count > 0 THEN
        RAISE NOTICE 'ATENÇÃO: Encontrados % registros com dados na coluna ip', ip_count;
        RAISE NOTICE 'Considere migrar estes dados para last_used_ip antes de prosseguir';
    ELSE
        RAISE NOTICE 'Coluna ip está vazia - seguro para remoção';
    END IF;
END $$;

-- =====================================================
-- BACKUP DE SEGURANÇA (OPCIONAL)
-- =====================================================

-- Criar tabela temporária com backup dos dados (caso necessário rollback)
-- CREATE TABLE user_creations_backup_ip AS 
-- SELECT device_id, ip FROM user_creations WHERE ip IS NOT NULL;

-- =====================================================
-- REMOÇÃO DA COLUNA IP
-- =====================================================

-- Remover possíveis índices na coluna ip
DROP INDEX IF EXISTS idx_user_creations_ip;
DROP INDEX IF EXISTS user_creations_ip_idx;

-- Remover a coluna ip
ALTER TABLE user_creations DROP COLUMN IF EXISTS ip;

-- =====================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- =====================================================

-- Verificar se a coluna foi removida com sucesso
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_creations' 
        AND column_name = 'ip'
    ) THEN
        RAISE EXCEPTION 'ERRO: Coluna ip ainda existe na tabela';
    ELSE
        RAISE NOTICE 'SUCESSO: Coluna ip removida com sucesso';
    END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_creations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE user_creations IS 'Tabela de criações de usuários. Coluna ip removida em 2025-01-15 por redundância com last_used_ip';
COMMENT ON COLUMN user_creations.last_used_ip IS 'IP do usuário (única coluna de IP após remoção da coluna ip redundante)';

-- =====================================================
-- ROLLBACK INSTRUCTIONS (COMENTADO)
-- =====================================================

/*
PARA FAZER ROLLBACK DESTA MIGRAÇÃO:

1. Adicionar novamente a coluna:
ALTER TABLE user_creations ADD COLUMN ip TEXT;

2. Se houver backup, restaurar dados:
UPDATE user_creations 
SET ip = backup.ip 
FROM user_creations_backup_ip backup 
WHERE user_creations.device_id = backup.device_id;

3. Remover tabela de backup:
DROP TABLE IF EXISTS user_creations_backup_ip;
*/