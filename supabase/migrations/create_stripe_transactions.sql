-- =====================================================
-- MIGRAÇÃO: Criar tabela stripe_transactions
-- Memora Music - Sistema de pagamentos Stripe
-- =====================================================

-- Criar tabela stripe_transactions
CREATE TABLE IF NOT EXISTS stripe_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_intent_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_id TEXT,
    amount INTEGER NOT NULL, -- valor em centavos
    currency TEXT NOT NULL DEFAULT 'brl',
    status TEXT NOT NULL CHECK (status IN ('created', 'processing', 'succeeded', 'failed', 'canceled')),
    stripe_payment_intent_data JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários para documentação
COMMENT ON TABLE stripe_transactions IS 'Armazena transações do Stripe para controle de pagamentos';
COMMENT ON COLUMN stripe_transactions.payment_intent_id IS 'ID único do Payment Intent no Stripe';
COMMENT ON COLUMN stripe_transactions.user_id IS 'Referência ao usuário autenticado (null para guests)';
COMMENT ON COLUMN stripe_transactions.device_id IS 'ID do dispositivo para usuários não autenticados';
COMMENT ON COLUMN stripe_transactions.amount IS 'Valor da transação em centavos';
COMMENT ON COLUMN stripe_transactions.status IS 'Status da transação: created, processing, succeeded, failed, canceled';
COMMENT ON COLUMN stripe_transactions.stripe_payment_intent_data IS 'Dados completos do Payment Intent retornados pelo Stripe';
COMMENT ON COLUMN stripe_transactions.metadata IS 'Metadados adicionais da transação (voucher_url, expires_at, etc.)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_payment_intent_id ON stripe_transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_user_id ON stripe_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_device_id ON stripe_transactions(device_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_status ON stripe_transactions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_created_at ON stripe_transactions(created_at);

-- Índice composto para consultas de pagamentos pendentes por usuário
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_user_status ON stripe_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_device_status ON stripe_transactions(device_id, status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE stripe_transactions ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários autenticados podem ver suas próprias transações
CREATE POLICY "Users can view own transactions" ON stripe_transactions
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Política RLS: permitir inserção para usuários autenticados e anônimos (via service role)
CREATE POLICY "Allow insert for authenticated and service role" ON stripe_transactions
    FOR INSERT WITH CHECK (true);

-- Política RLS: permitir atualização para service role (webhooks)
CREATE POLICY "Allow update for service role" ON stripe_transactions
    FOR UPDATE USING (true);

-- Conceder permissões básicas
GRANT SELECT ON stripe_transactions TO authenticated;
GRANT ALL PRIVILEGES ON stripe_transactions TO service_role;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_stripe_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stripe_transactions_updated_at
    BEFORE UPDATE ON stripe_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_stripe_transactions_updated_at();