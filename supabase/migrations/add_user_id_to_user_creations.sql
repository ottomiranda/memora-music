-- Add user_id column to user_creations table
-- This column is needed to track creations for authenticated users

ALTER TABLE public.user_creations 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint to auth.users
ALTER TABLE public.user_creations 
ADD CONSTRAINT fk_user_creations_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add created_at column if it doesn't exist
ALTER TABLE public.user_creations 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment to the column
COMMENT ON COLUMN public.user_creations.user_id IS 'Reference to authenticated user';

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.user_creations TO anon;
GRANT ALL PRIVILEGES ON public.user_creations TO authenticated;