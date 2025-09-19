-- Migration: Implement paywall system with mock payment gateway
-- Created: 2024
-- Description: Adds paywall functionality with free song tracking, mock transactions, and paid song marking

-- Add freeSongsUsed field to user_creations table
ALTER TABLE user_creations ADD COLUMN freeSongsUsed INTEGER DEFAULT 0;

-- Create index for optimizing queries on freeSongsUsed
CREATE INDEX idx_user_creations_free_songs_used ON user_creations(freeSongsUsed);

-- Create mock_transactions table for simulated payments
CREATE TABLE mock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES user_creations(id) ON DELETE CASCADE,
    transactionId VARCHAR(255) UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    paymentMethod VARCHAR(50) NOT NULL DEFAULT 'mock_card',
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for mock_transactions table
CREATE INDEX idx_mock_transactions_user_id ON mock_transactions(userId);
CREATE INDEX idx_mock_transactions_created_at ON mock_transactions(createdAt DESC);
CREATE INDEX idx_mock_transactions_transaction_id ON mock_transactions(transactionId);

-- Enable Row Level Security for mock_transactions
ALTER TABLE mock_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mock_transactions
-- Policy for authenticated users to view their own transactions
CREATE POLICY "Users can view own transactions" ON mock_transactions
    FOR SELECT USING (auth.uid() = userId);

-- Policy for authenticated users to insert their own transactions
CREATE POLICY "Users can insert own transactions" ON mock_transactions
    FOR INSERT WITH CHECK (auth.uid() = userId);

-- Policy for service_role to manage all transactions (for backend operations)
CREATE POLICY "Service role full access transactions" ON mock_transactions
    FOR ALL TO service_role USING (true);

-- Grant permissions to authenticated role for mock_transactions
GRANT ALL PRIVILEGES ON mock_transactions TO authenticated;
GRANT ALL PRIVILEGES ON mock_transactions TO service_role;

-- Create updated_at trigger for mock_transactions
CREATE TRIGGER update_mock_transactions_updated_at BEFORE UPDATE ON mock_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add isPaid field to songs table
ALTER TABLE songs ADD COLUMN isPaid BOOLEAN DEFAULT FALSE;

-- Create index for optimizing queries on isPaid
CREATE INDEX idx_songs_is_paid ON songs(isPaid);

-- Update existing songs to be marked as free (isPaid = FALSE)
UPDATE songs SET isPaid = FALSE WHERE isPaid IS NULL;

-- Add comment to document the new columns
COMMENT ON COLUMN user_creations.freeSongsUsed IS 'Number of free songs already used by the user';
COMMENT ON COLUMN songs.isPaid IS 'Whether this song generation required payment';
COMMENT ON TABLE mock_transactions IS 'Stores simulated payment transactions for paywall system';