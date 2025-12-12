# SafeSpace Salone - Testing Guide

This guide covers how to test all functionalities of the SafeSpace Salone application.

## Prerequisites

1. **Database Setup**
   - Run `database/schema.sql` in Supabase SQL Editor
   - Run `database/seed.sql` to add demo data

2. **Environment**
   - Ensure `.env.local` has valid Supabase credentials
   - Run `npm run dev` to start the development server

3. **Browser**
   - Use Chrome/Edge in incognito mode (avoids extension conflicts)
   - Or disable browser extensions like Grammarly that modify the DOM

---

## Test Scenarios

### 1. Landing Page (`/`)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page loads | Navigate to `http://localhost:3000` | Landing page displays with SafeSpace branding |
| CTA button works | Click "Get Started" or main CTA | Redirects to `/signup` |
| Animations work | Observe page load | Smooth fade-in animation |

---

### 2. Patient Signup (`/signup`)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page loads | Navigate to `/signup` | Signup form with avatar picker displays |
| Avatar selection | Click different avatars | Selected avatar highlights with border |
| Display name input | Type a name (e.g., "Hopeful Soul") | Input accepts text, character limit works |
| PIN entry | Enter 4-digit PIN | Each digit appears, auto-advances to next field |
| PIN confirmation | Re-enter same PIN | Matches and enables submit |
| PIN mismatch | Enter different confirmation PIN | Shows error message |
| Form submission | Fill all fields, click "Create Account" | Redirects to `/topics` |
| Persistence | Refresh page after signup | Still logged in (localStorage) |

**Test Data:**
- Display Name: `Test User`
- PIN: `1234`

---

### 3. Topic Selection (`/topics`)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page loads | After signup, land on `/topics` | Shows topic cards in grid |
| User greeting | Check header | Shows "Hi, [username]" with avatar |
| Topic selection | Click "Anxiety & Worry" | Transitions to urgency selection |
| Back navigation | Click "Change topic" | Returns to topic grid |
| Urgency selection | Select "It's bothering me" | Option highlights |
| Submit button | Select topic + urgency | "Connect with a Counselor" button appears |
| Create conversation | Click submit button | Redirects to `/chat/[id]` |

---

### 4. Patient Chat (`/chat/[id]`)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page loads | After creating conversation | Chat interface displays |
| Header info | Check chat header | Shows topic, counselor status |
| Empty state | New conversation | Shows waiting for counselor message |
| Send text message | Type message, click send | Message appears in chat (right-aligned, teal) |
| Message animation | Send a message | Smooth slide-up animation |
| Voice recording | Click mic button | Recording UI appears |
| Record voice | Allow mic, speak, tap stop | Shows playback preview |
| Preview playback | Click play on recorded message | Audio plays back |
| Send voice | Click checkmark | Voice message appears in chat |
| Cancel recording | Click X during recording | Returns to text input |
| Scroll behavior | Send multiple messages | Auto-scrolls to bottom |
| Timestamps | Check message times | Shows relative time (e.g., "2m ago") |

**Note:** Voice messages require microphone permission.

---

### 5. Counselor Login (`/counselor/login`)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page loads | Navigate to `/counselor/login` | Login form displays |
| Empty submission | Click login with empty fields | Shows validation error |
| Wrong credentials | Enter wrong name/PIN | Shows "Invalid credentials" error |
| Correct login | Name: `Dr. Hope`, PIN: `1234` | Redirects to `/counselor/dashboard` |
| Session persistence | Refresh after login | Still logged in |

**Demo Credentials:**
| Name | PIN |
|------|-----|
| Dr. Hope | 1234 |
| Dr. Grace | 5678 |

---

### 6. Counselor Dashboard (`/counselor/dashboard`)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page loads | After counselor login | Dashboard displays |
| Tabs display | Check tab bar | "Waiting" and "Active" tabs visible |
| Waiting count | Check Waiting tab | Shows count badge if conversations exist |
| Conversation cards | View waiting list | Cards show patient avatar, topic, urgency, time |
| Urgency indicator | Check conversation card | Colored dot (green/yellow/red) |
| Accept conversation | Click "Accept" on waiting card | Redirects to counselor chat |
| Active tab | Switch to Active tab | Shows accepted conversations |
| Refresh button | Click refresh icon | Reloads conversation list |
| Empty state | No conversations | Shows appropriate empty message |

---

### 7. Counselor Chat (`/counselor/chat/[id]`)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page loads | Accept a conversation | Chat interface displays |
| Patient info | Check header | Shows patient name, avatar, topic |
| Message history | View chat | Shows existing messages |
| Send message | Type and send | Message appears (right-aligned) |
| Receive message | Patient sends message | Appears left-aligned with animation |
| Session notes | Click notes button | Side panel slides in |
| Save notes | Type notes, click save | Shows "Saved" confirmation |
| Notes persist | Close and reopen panel | Notes are preserved |
| Back to dashboard | Click back arrow | Returns to dashboard |

---

### 8. Real-time Messaging

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Setup | Open patient chat in one browser, counselor chat in another | Both chats open |
| Patient to counselor | Send message as patient | Appears in counselor chat within seconds |
| Counselor to patient | Send message as counselor | Appears in patient chat within seconds |
| Voice message sync | Send voice as patient | Voice message appears for counselor |

**Tip:** Use two browser windows or incognito + regular mode.

---

### 9. Offline Support

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Go offline | Disable network (DevTools > Network > Offline) | Yellow "You're offline" banner appears |
| Send while offline | Try to send a message | Message queued (or error shown) |
| Come back online | Re-enable network | Green "Back online!" banner briefly shows |
| Indicator disappears | Wait 2 seconds | Banner fades away |

---

### 10. PWA Features

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Manifest loads | DevTools > Application > Manifest | Shows app name, icons, theme color |
| Install prompt | Wait 3 seconds on any page | Install banner may appear (if supported) |
| Add to home screen | Click install (Chrome: address bar icon) | App installs as PWA |
| Standalone mode | Open installed PWA | No browser chrome, standalone window |
| Icons display | Check installed app icon | Shield + heart icon displays |

---

### 11. 404 Page

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Invalid route | Navigate to `/invalid-page` | Custom 404 page displays |
| Branding | Check 404 page | Shield icon, SafeSpace message |
| Navigation | Click "Go Home" | Redirects to `/` |
| Start chat link | Click "Start a Chat" | Redirects to `/topics` |

---

### 12. Mobile Responsiveness

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Mobile view | DevTools > Toggle device toolbar > iPhone SE (375px) | All pages fit without horizontal scroll |
| Touch targets | Check buttons/inputs | Minimum 44px tap targets |
| Chat input | View chat on mobile | Input stays at bottom, keyboard-friendly |
| Topic cards | View topics on mobile | 2-column grid, readable text |
| Modals/panels | Open session notes on mobile | Full-width, usable |

---

### 13. Loading States

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Chat loading | Navigate to chat | Message skeleton shows while loading |
| Dashboard loading | Navigate to dashboard | Conversation skeletons display |
| Topics loading | Navigate to topics | Topic card skeletons briefly show |

---

### 14. Error Handling

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Invalid conversation | Go to `/chat/invalid-id` | Error message or redirect |
| API failure | Disconnect Supabase | Error fallback UI displays |
| Form errors | Submit invalid data | Inline error messages |

---

## Quick Test Checklist

### Happy Path Flow

1. [ ] Open app at `localhost:3000`
2. [ ] Click "Get Started" → Signup page
3. [ ] Pick avatar, enter name "Test User", PIN "1234"
4. [ ] Select "Anxiety" topic, "Normal" urgency
5. [ ] Arrive at chat, send "Hello, I need help"
6. [ ] Open new incognito window → `/counselor/login`
7. [ ] Login as "Dr. Hope" / "1234"
8. [ ] See waiting conversation, click "Accept"
9. [ ] Send reply "Hello, I'm here to help"
10. [ ] Verify message appears in patient's chat
11. [ ] Open session notes, add "Patient seems anxious"
12. [ ] Test voice message (both directions)
13. [ ] Test offline indicator (toggle network)
14. [ ] Test mobile view (375px width)
15. [ ] Test 404 page (`/nonexistent`)

---

## Troubleshooting

### Hydration Errors
- **Cause:** Browser extensions (Grammarly, etc.) modifying DOM
- **Fix:** Test in incognito mode or disable extensions

### Database Errors
- **Cause:** Missing tables or RLS policies
- **Fix:** Run `schema.sql` again, ensure RLS is disabled for demo

### Voice Recording Not Working
- **Cause:** No microphone permission
- **Fix:** Allow microphone in browser prompt

### Messages Not Syncing
- **Cause:** Supabase realtime not configured
- **Fix:** Check Supabase dashboard for realtime settings

### PWA Not Installing
- **Cause:** Not served over HTTPS (localhost is exception)
- **Fix:** Deploy to Vercel or use `localhost`

---

## Test Accounts Summary

| Role | Name | PIN | Login URL |
|------|------|-----|-----------|
| Counselor | Dr. Hope | 1234 | `/counselor/login` |
| Counselor | Dr. Grace | 5678 | `/counselor/login` |
| Patient | (Create new) | Any 4 digits | `/signup` |

---

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 90+ | Supported | Full PWA support |
| Firefox 90+ | Supported | Limited PWA support |
| Safari 15+ | Supported | PWA install from share menu |
| Edge 90+ | Supported | Full PWA support |
| Mobile Chrome | Supported | Best PWA experience |
| Mobile Safari | Supported | Add to Home Screen |

---

*Last updated: December 2024*
