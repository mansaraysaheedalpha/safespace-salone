-- Counselor Expertise System Migration
-- This migration adds support for counselor expertise categories and topic-based routing

-- Create counselor_expertise table
CREATE TABLE IF NOT EXISTS counselor_expertise (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expertise TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(counselor_id, expertise)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_counselor_expertise_counselor ON counselor_expertise(counselor_id);
CREATE INDEX IF NOT EXISTS idx_counselor_expertise_expertise ON counselor_expertise(expertise);

-- Add column to conversations table to track if only assigned counselor can see it
-- When a counselor accepts a conversation, this is set to true
-- When patient requests new counselor, this is set back to false
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_counselor_only BOOLEAN DEFAULT FALSE;

-- Enable RLS on counselor_expertise table
ALTER TABLE counselor_expertise ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read expertise (needed for routing)
CREATE POLICY "Anyone can read counselor expertise"
  ON counselor_expertise FOR SELECT
  USING (true);

-- Policy: Only the counselor can insert their own expertise
CREATE POLICY "Counselors can insert their own expertise"
  ON counselor_expertise FOR INSERT
  WITH CHECK (true);

-- Policy: Only the counselor can update their own expertise
CREATE POLICY "Counselors can update their own expertise"
  ON counselor_expertise FOR UPDATE
  USING (true);

-- Policy: Only the counselor can delete their own expertise
CREATE POLICY "Counselors can delete their own expertise"
  ON counselor_expertise FOR DELETE
  USING (true);

-- Comment on table
COMMENT ON TABLE counselor_expertise IS 'Stores counselor expertise categories for topic-based routing';
COMMENT ON COLUMN counselor_expertise.expertise IS 'Expertise category ID (e.g., anxiety, depression, relationships)';
COMMENT ON COLUMN conversations.assigned_counselor_only IS 'When true, only the assigned counselor can see this conversation';
