-- Migration: Create user_creations table
-- Description: Creates the user_creations table with proper structure and constraints
-- Date: 2024-01-15

-- Create the user_creations table
CREATE TABLE IF NOT EXISTS public.user_creations (
    device_id TEXT NOT NULL PRIMARY KEY,
    ip TEXT,
    creations INTEGER NOT NULL DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique index on device_id (already enforced by PRIMARY KEY, but explicit for clarity)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_creations_device_id ON public.user_creations(device_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_creations_user_id ON public.user_creations(user_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_user_creations_created_at ON public.user_creations(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_creations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for anonymous users to read their own records based on device_id
CREATE POLICY "Allow anon users to read their own creations" ON public.user_creations
    FOR SELECT
    TO anon
    USING (device_id = current_setting('request.headers')::json->>'x-device-id');

-- Policy for authenticated users to read their own records
CREATE POLICY "Allow authenticated users to read their own creations" ON public.user_creations
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR device_id = current_setting('request.headers')::json->>'x-device-id');

-- Policy for anonymous users to insert/update their own records
CREATE POLICY "Allow anon users to manage their own creations" ON public.user_creations
    FOR ALL
    TO anon
    USING (device_id = current_setting('request.headers')::json->>'x-device-id')
    WITH CHECK (device_id = current_setting('request.headers')::json->>'x-device-id');

-- Policy for authenticated users to insert/update their own records
CREATE POLICY "Allow authenticated users to manage their own creations" ON public.user_creations
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid() OR device_id = current_setting('request.headers')::json->>'x-device-id')
    WITH CHECK (user_id = auth.uid() OR device_id = current_setting('request.headers')::json->>'x-device-id');

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON public.user_creations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_creations TO authenticated;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_user_creations_updated_at' 
        AND event_object_table = 'user_creations'
    ) THEN
        CREATE TRIGGER update_user_creations_updated_at
            BEFORE UPDATE ON public.user_creations
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Add comment to the table
COMMENT ON TABLE public.user_creations IS 'Tracks user creation counts by device_id and user_id for paywall functionality';
COMMENT ON COLUMN public.user_creations.device_id IS 'Unique device identifier (guest_id or user_id as string)';
COMMENT ON COLUMN public.user_creations.ip IS 'IP address of the user for additional tracking';
COMMENT ON COLUMN public.user_creations.creations IS 'Number of songs created by this device/user';
COMMENT ON COLUMN public.user_creations.user_id IS 'Reference to authenticated user (null for guest users)';