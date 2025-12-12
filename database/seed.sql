-- SafeSpace Salone - Demo Seed Data
-- Run this after schema.sql to populate test data

-- =============================================
-- TEST COUNSELORS
-- =============================================

-- Dr. Hope (PIN: 1234)
INSERT INTO users (id, display_name, avatar_id, pin_hash, role, created_at)
VALUES (
  'c1000000-0000-0000-0000-000000000001',
  'Dr. Hope',
  'gentle-sun',
  '$2b$10$xPBQqK9a7RqfB1jZzXMKh.8Q9JZvHpF6q3x9T2Y1V4X5W6Z7A8B9C', -- hash of "1234"
  'counselor',
  NOW() - INTERVAL '30 days'
);

-- Dr. Grace (PIN: 5678)
INSERT INTO users (id, display_name, avatar_id, pin_hash, role, created_at)
VALUES (
  'c2000000-0000-0000-0000-000000000002',
  'Dr. Grace',
  'calm-ocean',
  '$2b$10$yQCRrL0b8SsgC2kAaYNLi.9R0KaWiQG7r4y0U3Z2W5Y6X7A9B0C1D', -- hash of "5678"
  'counselor',
  NOW() - INTERVAL '25 days'
);

-- =============================================
-- TEST PATIENTS
-- =============================================

-- Anonymous patient "Hopeful Heart"
INSERT INTO users (id, display_name, avatar_id, pin_hash, role, created_at)
VALUES (
  'p1000000-0000-0000-0000-000000000001',
  'Hopeful Heart',
  'peaceful-leaf',
  '$2b$10$zRDSsM1c9TthD3lBbZONj.0S1LbXjRH8s5z1V4A3X6Y7Z8B0C2D3E', -- hash of "0000"
  'patient',
  NOW() - INTERVAL '7 days'
);

-- Anonymous patient "Brave Soul"
INSERT INTO users (id, display_name, avatar_id, pin_hash, role, created_at)
VALUES (
  'p2000000-0000-0000-0000-000000000002',
  'Brave Soul',
  'warm-sunset',
  '$2b$10$aSDTtN2d0UuiE4mCcaPOk.1T2McYkSI9t6a2W5B4Y7Z8A9C1D3E4F', -- hash of "1111"
  'patient',
  NOW() - INTERVAL '3 days'
);

-- =============================================
-- TEST CONVERSATIONS
-- =============================================

-- Active conversation: Hopeful Heart with Dr. Hope (anxiety topic)
INSERT INTO conversations (id, patient_id, counselor_id, topic, urgency, status, created_at, updated_at)
VALUES (
  'conv0000-0000-0000-0000-000000000001',
  'p1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'anxiety',
  'normal',
  'active',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 hour'
);

-- Waiting conversation: Brave Soul (no counselor yet, trauma topic)
INSERT INTO conversations (id, patient_id, counselor_id, topic, urgency, status, created_at, updated_at)
VALUES (
  'conv0000-0000-0000-0000-000000000002',
  'p2000000-0000-0000-0000-000000000002',
  NULL,
  'trauma',
  'high',
  'waiting',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
);

-- =============================================
-- TEST MESSAGES (Active conversation)
-- =============================================

-- Day 1 messages
INSERT INTO messages (id, conversation_id, sender_id, type, content, created_at)
VALUES (
  'msg00000-0000-0000-0000-000000000001',
  'conv0000-0000-0000-0000-000000000001',
  'p1000000-0000-0000-0000-000000000001',
  'text',
  'Hello, I''ve been feeling really anxious lately. I don''t know who to talk to.',
  NOW() - INTERVAL '5 days'
);

INSERT INTO messages (id, conversation_id, sender_id, type, content, created_at)
VALUES (
  'msg00000-0000-0000-0000-000000000002',
  'conv0000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'text',
  'Hello, thank you for reaching out. You''re in a safe space here. I''m Dr. Hope, and I''m here to listen. Can you tell me more about what''s been making you feel anxious?',
  NOW() - INTERVAL '5 days' + INTERVAL '5 minutes'
);

INSERT INTO messages (id, conversation_id, sender_id, type, content, created_at)
VALUES (
  'msg00000-0000-0000-0000-000000000003',
  'conv0000-0000-0000-0000-000000000001',
  'p1000000-0000-0000-0000-000000000001',
  'text',
  'It''s work mostly. I feel like I can never do enough, and my mind races at night. I haven''t been sleeping well.',
  NOW() - INTERVAL '5 days' + INTERVAL '10 minutes'
);

INSERT INTO messages (id, conversation_id, sender_id, type, content, created_at)
VALUES (
  'msg00000-0000-0000-0000-000000000004',
  'conv0000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'text',
  'I understand. Work-related anxiety is very common, and the sleep issues you''re experiencing are often connected. When our minds are worried, it''s hard to find rest. Have you tried any relaxation techniques before bed?',
  NOW() - INTERVAL '5 days' + INTERVAL '15 minutes'
);

-- Day 2 messages
INSERT INTO messages (id, conversation_id, sender_id, type, content, created_at)
VALUES (
  'msg00000-0000-0000-0000-000000000005',
  'conv0000-0000-0000-0000-000000000001',
  'p1000000-0000-0000-0000-000000000001',
  'text',
  'I tried deep breathing but my mind just keeps going. Sometimes I feel like my heart is racing even when I''m just sitting.',
  NOW() - INTERVAL '4 days'
);

INSERT INTO messages (id, conversation_id, sender_id, type, content, created_at)
VALUES (
  'msg00000-0000-0000-0000-000000000006',
  'conv0000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'text',
  'What you''re describing sounds like physical symptoms of anxiety - the racing heart is your body''s stress response. This is very treatable. Let me share a grounding technique that many people find helpful: the 5-4-3-2-1 method.',
  NOW() - INTERVAL '4 days' + INTERVAL '30 minutes'
);

INSERT INTO messages (id, conversation_id, sender_id, type, content, created_at)
VALUES (
  'msg00000-0000-0000-0000-000000000007',
  'conv0000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'text',
  'When you feel anxious, name: 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This helps bring your mind back to the present moment.',
  NOW() - INTERVAL '4 days' + INTERVAL '31 minutes'
);

-- Recent messages
INSERT INTO messages (id, conversation_id, sender_id, type, content, created_at)
VALUES (
  'msg00000-0000-0000-0000-000000000008',
  'conv0000-0000-0000-0000-000000000001',
  'p1000000-0000-0000-0000-000000000001',
  'text',
  'I tried the 5-4-3-2-1 technique yesterday when I felt panic coming. It actually helped! Thank you.',
  NOW() - INTERVAL '1 hour'
);

INSERT INTO messages (id, conversation_id, sender_id, type, content, created_at)
VALUES (
  'msg00000-0000-0000-0000-000000000009',
  'conv0000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'text',
  'That''s wonderful progress! I''m so proud of you for trying it. Remember, healing isn''t linear - some days will be harder than others, and that''s okay. I''m here whenever you need to talk. 💚',
  NOW() - INTERVAL '45 minutes'
);

-- =============================================
-- TEST MESSAGES (Waiting conversation)
-- =============================================

INSERT INTO messages (id, conversation_id, sender_id, type, content, created_at)
VALUES (
  'msg00000-0000-0000-0000-000000000010',
  'conv0000-0000-0000-0000-000000000002',
  'p2000000-0000-0000-0000-000000000002',
  'text',
  'I need to talk to someone. Something happened to me and I don''t know how to process it.',
  NOW() - INTERVAL '2 hours'
);

-- =============================================
-- HELPFUL QUERIES FOR TESTING
-- =============================================

-- View all users:
-- SELECT id, display_name, role, avatar_id FROM users;

-- View conversations with patient/counselor names:
-- SELECT c.id, c.topic, c.urgency, c.status,
--        p.display_name as patient,
--        co.display_name as counselor
-- FROM conversations c
-- JOIN users p ON c.patient_id = p.id
-- LEFT JOIN users co ON c.counselor_id = co.id;

-- View messages in a conversation:
-- SELECT m.content, u.display_name as sender, m.created_at
-- FROM messages m
-- JOIN users u ON m.sender_id = u.id
-- WHERE m.conversation_id = 'conv0000-0000-0000-0000-000000000001'
-- ORDER BY m.created_at;
