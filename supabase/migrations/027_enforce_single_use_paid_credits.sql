-- Migration: Enforce single-use behavior for paid credits
-- Adds bookkeeping columns and helper function to consume credits exactly once per payment

BEGIN;

ALTER TABLE public.stripe_transactions
  ADD COLUMN IF NOT EXISTS available_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_consumed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_stripe_transactions_available_credits
  ON public.stripe_transactions (available_credits);

CREATE OR REPLACE FUNCTION public.consume_paid_credit(transaction_id UUID)
RETURNS TABLE (
  id UUID,
  payment_intent_id TEXT,
  remaining_credits INTEGER,
  credit_consumed_at TIMESTAMPTZ
) AS $$
UPDATE public.stripe_transactions
SET
  available_credits = available_credits - 1,
  credit_consumed_at = CASE
    WHEN available_credits <= 1 THEN NOW()
    ELSE credit_consumed_at
  END,
  updated_at = NOW()
WHERE id = transaction_id
  AND available_credits > 0
RETURNING
  public.stripe_transactions.id,
  public.stripe_transactions.payment_intent_id,
  public.stripe_transactions.available_credits,
  public.stripe_transactions.credit_consumed_at;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.consume_paid_credit(UUID) TO service_role;

COMMENT ON COLUMN public.stripe_transactions.available_credits IS 'Number of remaining paid credits for this transaction (each credit unlocks one song generation)';
COMMENT ON COLUMN public.stripe_transactions.credit_consumed_at IS 'Timestamp when the last available credit was consumed';
COMMENT ON FUNCTION public.consume_paid_credit(UUID) IS 'Atomically consume a single paid credit for the specified transaction';

COMMIT;
