-- Migration: Create songs table with auto-save support
-- Created: 2024
-- Description: Creates songs table with support for authenticated users and guests

CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    lyrics TEXT,
    prompt TEXT,
    genre VARCHAR(100),
    mood VARCHAR(100),
    audio_url_option1 TEXT,
    audio_url_option2 TEXT,
    suno_task_id VARCHAR(255),
    generation_status VARCHAR(50) DEFAULT 'completed' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint to ensure either user_id or guest_id is present
    CONSTRAINT check_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_id IS NULL) OR 
        (user_id IS NULL AND guest_id IS NOT NULL)
    )
);

-- Indexes for performance optimization
CREATE INDEX idx_songs_user_id ON songs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_songs_guest_id ON songs(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX idx_songs_created_at ON songs(created_at DESC);
CREATE INDEX idx_songs_suno_task_id ON songs(suno_task_id) WHERE suno_task_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy for authenticated users to view their own songs
CREATE POLICY "Users can view own songs" ON songs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own songs
CREATE POLICY "Users can insert own songs" ON songs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for service_role to manage all songs (for backend operations)
CREATE POLICY "Service role full access" ON songs
    FOR ALL TO service_role USING (true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON songs TO anon;
GRANT ALL PRIVILEGES ON songs TO authenticated;
GRANT ALL PRIVILEGES ON songs TO service_role;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();