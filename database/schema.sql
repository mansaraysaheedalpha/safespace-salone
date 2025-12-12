-- SafeSpace Salone Database Schema
-- ================================
-- Run this script in your Supabase project's SQL Editor:
-- 1. Go to your Supabase dashboard
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Create a new query and paste this entire script
-- 4. Click "Run" to execute

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- TABLES
-- ================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  avatar_id TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'counselor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice')),
  content TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================
-- INDEXES
-- ================================

-- Index for faster message lookups by conversation
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Index for faster conversation lookups by patient
CREATE INDEX idx_conversations_patient_id ON conversations(patient_id);

-- Index for faster conversation lookups by counselor
CREATE INDEX idx_conversations_counselor_id ON conversations(counselor_id);

-- Index for faster message ordering
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at);

-- ================================
-- ROW LEVEL SECURITY
-- ================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ================================
-- RLS POLICIES - Users
-- ================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Allow inserting new users (for registration)
CREATE POLICY "Allow user registration"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Counselors can view patient profiles for their conversations
CREATE POLICY "Counselors can view patients in their conversations"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.counselor_id = auth.uid()
      AND conversations.patient_id = users.id
    )
  );

-- Patients can view counselor profiles for their conversations
CREATE POLICY "Patients can view counselors in their conversations"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.patient_id = auth.uid()
      AND conversations.counselor_id = users.id
    )
  );

-- ================================
-- RLS POLICIES - Conversations
-- ================================

-- Patients can read their own conversations
CREATE POLICY "Patients can read own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = patient_id);

-- Counselors can read conversations assigned to them
CREATE POLICY "Counselors can read assigned conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = counselor_id);

-- Counselors can read unassigned conversations (to pick up new ones)
CREATE POLICY "Counselors can read unassigned conversations"
  ON conversations FOR SELECT
  USING (
    counselor_id IS NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'counselor'
    )
  );

-- Patients can create conversations
CREATE POLICY "Patients can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Counselors can update conversations (to assign themselves or close)
CREATE POLICY "Counselors can update conversations"
  ON conversations FOR UPDATE
  USING (
    auth.uid() = counselor_id
    OR (
      counselor_id IS NULL
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'counselor'
      )
    )
  );

-- Patients can update their own conversations (to close them)
CREATE POLICY "Patients can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = patient_id);

-- ================================
-- RLS POLICIES - Messages
-- ================================

-- Users can read messages in their conversations
CREATE POLICY "Users can read messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.patient_id = auth.uid() OR conversations.counselor_id = auth.uid())
    )
  );

-- Users can insert messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.patient_id = auth.uid() OR conversations.counselor_id = auth.uid())
    )
  );

-- ================================
-- STORAGE BUCKET (for voice notes)
-- ================================

-- Note: Run this separately or via Supabase dashboard
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('voice-notes', 'voice-notes', false);

-- Storage policy for voice notes (run in SQL editor after creating bucket)
-- CREATE POLICY "Users can upload voice notes"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'voice-notes'
--     AND auth.role() = 'authenticated'
--   );

-- CREATE POLICY "Users can read voice notes in their conversations"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'voice-notes'
--     AND auth.role() = 'authenticated'
--   );
