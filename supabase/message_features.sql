-- Message Reply & Read Receipt Features
-- Run this in your Supabase SQL Editor

-- 1. Add reply_to_id to messages table for reply feature
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- 2. Add read_at to messages for read receipts
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Create user_presence table for online status
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);

-- Enable RLS on user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Allow all operations on user_presence (you can make this more restrictive later)
CREATE POLICY "Allow all operations on user_presence"
  ON user_presence
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update last_seen timestamp
CREATE OR REPLACE FUNCTION update_user_presence()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS user_presence_updated ON user_presence;
CREATE TRIGGER user_presence_updated
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence();
