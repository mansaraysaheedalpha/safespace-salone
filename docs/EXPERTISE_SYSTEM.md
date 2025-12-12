# Counselor Expertise System - Implementation Plan

## Overview
This document outlines the implementation plan for a topic-based expertise routing system that matches patients with counselors based on their areas of expertise.

## Core Features

### 1. Expertise Categories
Define categories that match the existing patient topics:

| Category ID | Category Name | Description |
|-------------|---------------|-------------|
| `anxiety` | Anxiety & Stress | Managing worry, panic, and stress |
| `depression` | Depression | Dealing with sadness, hopelessness |
| `relationships` | Relationships | Family, romantic, social issues |
| `trauma` | Trauma & PTSD | Processing traumatic experiences |
| `addiction` | Addiction | Substance abuse, behavioral addictions |
| `grief` | Grief & Loss | Coping with death, loss, change |
| `self-esteem` | Self-Esteem | Confidence, self-worth issues |
| `anger` | Anger Management | Controlling anger, frustration |
| `sleep` | Sleep Issues | Insomnia, sleep disorders |
| `work` | Work & Career | Job stress, career decisions |
| `medical` | Medical Advice | Health-related concerns (requires medical professional) |
| `general` | General Support | General mental health support |

### 2. Database Schema Changes

#### New Table: `counselor_expertise`
```sql
CREATE TABLE counselor_expertise (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expertise TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(counselor_id, expertise)
);

CREATE INDEX idx_counselor_expertise_counselor ON counselor_expertise(counselor_id);
CREATE INDEX idx_counselor_expertise_expertise ON counselor_expertise(expertise);
```

#### Modify `conversations` table
Add column to track routing status:
```sql
ALTER TABLE conversations ADD COLUMN assigned_counselor_only BOOLEAN DEFAULT FALSE;
```

### 3. Implementation Tasks

#### Phase 1: Database & Types ✅
- [ ] Create `counselor_expertise` table migration
- [ ] Add `assigned_counselor_only` column to conversations
- [ ] Update TypeScript types

#### Phase 2: Counselor Signup Flow
- [ ] Create expertise selection component
- [ ] Update counselor signup page to include expertise selection
- [ ] Update counselor signup API to save expertise
- [ ] Add minimum 1 expertise validation

#### Phase 3: Conversation Routing
- [ ] Update conversations API to filter by matching expertise
- [ ] Modify counselor dashboard to only show matching conversations
- [ ] When counselor accepts, mark `assigned_counselor_only = true`
- [ ] Only assigned counselor sees the conversation after acceptance

#### Phase 4: Patient Controls
- [ ] Add "Request New Counselor" option in chat
- [ ] Create API endpoint to reset conversation assignment
- [ ] When reset, `assigned_counselor_only = false` and `counselor_id = null`
- [ ] Notify patient that conversation is back in queue

### 4. Routing Logic

```
Patient creates conversation with topic X
    ↓
System matches topic X to expertise category
    ↓
Conversation visible to ALL counselors with matching expertise
    ↓
First counselor accepts → assigned_counselor_only = true
    ↓
Only assigned counselor can see/respond
    ↓
[If patient unsatisfied]
    ↓
Patient clicks "Request New Counselor"
    ↓
counselor_id = null, assigned_counselor_only = false
    ↓
Back to step: visible to all matching counselors
```

### 5. Topic-to-Expertise Mapping

Map existing topics to expertise categories:

```typescript
const TOPIC_TO_EXPERTISE: Record<string, string> = {
  // Existing topics from topics page
  "anxiety": "anxiety",
  "depression": "depression",
  "relationships": "relationships",
  "family": "relationships",
  "trauma": "trauma",
  "addiction": "addiction",
  "grief": "grief",
  "self-esteem": "self-esteem",
  "anger": "anger",
  "sleep": "sleep",
  "work": "work",
  "health": "medical",
  "other": "general"
}
```

### 6. UI Changes Summary

#### Counselor Signup Page
- Add multi-select expertise picker after avatar selection
- Show expertise categories with descriptions
- Require at least 1 selection

#### Counselor Dashboard
- "Waiting" tab only shows conversations matching counselor's expertise
- Badge showing expertise match on each conversation card

#### Patient Chat Page
- Add menu option "Request New Counselor"
- Confirmation dialog explaining the action
- Success message when request is processed

### 7. File Changes Required

| File | Changes |
|------|---------|
| `supabase/migrations/xxx_expertise.sql` | New migration |
| `src/lib/constants/expertise.ts` | Expertise definitions |
| `src/components/expertise-selector.tsx` | New component |
| `src/app/counselor/signup/page.tsx` | Add expertise step |
| `src/app/api/auth/counselor-signup/route.ts` | Save expertise |
| `src/app/api/counselor/conversations/route.ts` | Filter by expertise |
| `src/app/counselor/dashboard/page.tsx` | Show expertise info |
| `src/components/chat/chat-header.tsx` | Add menu for patient |
| `src/app/api/conversations/[id]/reset/route.ts` | New API |

---

## Implementation Progress

### Current Status: All Phases Complete

### Completed:
- [x] Planning document created
- [x] Create expertise constants file (`src/lib/constants/expertise.ts`)
- [x] Database migration (`supabase/migrations/20241215_counselor_expertise.sql`)
- [x] Expertise selector component (`src/components/expertise-selector.tsx`)
- [x] Update counselor signup page with expertise selection
- [x] Update counselor signup API to save expertise
- [x] Update conversations API to filter by expertise
- [x] Update counselor dashboard to show expertise info
- [x] Add "Request New Counselor" feature for patients
- [x] Reset conversation API (`src/app/api/conversations/[id]/reset/route.ts`)

### Pending:
- [ ] Run database migration in Supabase
- [ ] Deploy to production
