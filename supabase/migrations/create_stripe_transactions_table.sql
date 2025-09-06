-- Create stripe_transactions table for payment tracking
CREATE TABLE IF NOT EXISTS stripe_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_intent_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL CHECK (amount >= 100), -- Amount in cents, minimum R$ 1.00
    currency TEXT NOT NULL DEFAULT 'brl',
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'processing', 'succeeded', 'failed', 'canceled')),
    payment_method_id TEXT,
    metadata JSONB DEFAULT '{}',
    stripe_payment_intent_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_payment_intent_id ON stripe_transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_user_id ON stripe_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_status ON stripe_transactions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_created_at ON stripe_transactions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE stripe_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON stripe_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transactions (for payment creation)
CREATE POLICY "Users can insert own transactions" ON stripe_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Only service role can update transactions (for webhooks)
CREATE POLICY "Service role can update transactions" ON stripe_transactions
    FOR UPDATE USING (auth.role() = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON stripe_transactions TO authenticated;

-- Grant full access to service role (for webhooks and admin operations)
GRANT ALL ON stripe_transactions TO service_role;

-- Grant permissions to anon role for guest payments (limited)
GRANT INSERT ON stripe_transactions TO anon;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stripe_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_stripe_transactions_updated_at
    BEFORE UPDATE ON stripe_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_stripe_transactions_updated_at();

-- Add comment to table
COMMENT ON TABLE stripe_transactions IS 'Stores Stripe payment transaction data with RLS for user privacy';
COMMENT ON COLUMN stripe_transactions.payment_intent_id IS 'Stripe Payment Intent ID (unique identifier)';
COMMENT ON COLUMN stripe_transactions.amount IS 'Payment amount in cents (e.g., 1499 = R$ 14.99)';
COMMENT ON COLUMN stripe_transactions.metadata IS 'Additional metadata for the transaction';
COMMENT ON COLUMN stripe_transactions.stripe_payment_intent_data IS 'Full Stripe PaymentIntent object for debugging';