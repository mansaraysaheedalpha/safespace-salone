# SafeSpace Salone - How to Test

## Before You Start

1. Make sure the database is set up:
   - Run `database/schema.sql` in Supabase SQL Editor

2. Start the app:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser (use incognito mode to avoid extension issues)

---

## Testing as a Patient (Get Support)

### Step 1: Landing Page
- Open `http://localhost:3000`
- You should see the SafeSpace Salone welcome page
- Click **"Get Support"** button

### Step 2: Create Account
- You're now on `/signup`
- Pick any avatar you like (click one)
- Enter a display name like "Test User"
- Enter a 4-digit PIN (e.g., 1234)
- Confirm the same PIN
- Click **"Create Safe Space"**

### Step 3: Choose a Topic
- You're now on `/topics`
- You should see "Hi, Test User" at the top
- Click any topic card (e.g., **"Anxiety & Worry"**)
- Select an urgency level (e.g., **"It's bothering me"**)
- Click **"Connect with a Counselor"**

### Step 4: Chat Room (Waiting)
- You're now in the chat at `/chat/[some-id]`
- You should see a message saying you're waiting for a counselor
- Try sending a text message: type "Hello, I need help" and click Send
- Your message should appear on the right side (teal color)

### Step 5: Test Voice Message
- Click the **microphone icon** (next to the text input)
- Allow microphone permission if asked
- Speak for a few seconds
- Click the recording area to stop
- You'll see a preview - click **play** to listen
- Click the **checkmark** to send, or **trash** to delete

**Leave this browser window open. Now open a new incognito window for the counselor.**

---

## Testing as a Counselor (I'm a Counselor)

### Step 1: Create Counselor Account
- Open a NEW incognito window
- Go to `http://localhost:3000`
- Click **"I'm a Counselor"**
- You're now on `/counselor/login`
- Click **"Register as Counselor"** link at the bottom
- You're now on `/counselor/signup`
- Pick any avatar (click one)
- Enter a display name like "Dr. Hope"
- Enter a 4-digit PIN (e.g., 1234)
- Confirm the same PIN
- Click **"Create Account"**

### Step 2: Dashboard
- You're now on `/counselor/dashboard`
- You should see two tabs: **Waiting** and **Active**
- In the **Waiting** tab, you should see the conversation from your patient
- The card shows: patient name, topic (Anxiety), urgency dot, time

### Step 3: Accept Conversation
- Click **"Accept"** on the waiting conversation
- You're now in the chat with the patient

### Step 4: Chat with Patient
- You should see the patient's message(s)
- Type a reply: "Hello, I'm Dr. Hope. How can I help you today?"
- Click Send
- **Check the patient's window** - the message should appear there!

### Step 5: Session Notes
- Click the **notebook icon** in the header (top right)
- A panel slides in from the right
- Type some notes: "Patient reports anxiety symptoms"
- Click **"Save Notes"**
- Close the panel (click X)
- Reopen it - your notes should still be there

### Step 6: Test Voice Message
- Send a voice message as the counselor
- Check if it appears in the patient's window

---

## Testing Real-Time Sync

With both windows open (patient and counselor):

1. **Patient sends message** → Should appear in counselor's chat within 2-3 seconds
2. **Counselor sends message** → Should appear in patient's chat within 2-3 seconds
3. **Either sends voice** → Should sync to the other side

---

## Testing Offline Mode

1. In Chrome DevTools, go to **Network tab**
2. Check **"Offline"** checkbox
3. A yellow banner should appear: "You're offline"
4. Try to send a message (it may fail or queue)
5. Uncheck "Offline"
6. Green banner should briefly show: "Back online!"

---

## Testing 404 Page

1. Go to `http://localhost:3000/some-random-page`
2. You should see a custom 404 page with SafeSpace branding
3. Click **"Go Home"** to return to the landing page

---

## Testing Mobile View

1. Open Chrome DevTools (F12)
2. Click the **device toolbar** icon (or Ctrl+Shift+M)
3. Select **iPhone SE** or set width to **375px**
4. Navigate through the app - everything should fit without horizontal scrolling

---

## Quick Checklist

- [ ] Patient can sign up with avatar and PIN
- [ ] Patient can select topic and urgency
- [ ] Patient can send text messages
- [ ] Patient can send voice messages
- [ ] Counselor can sign up with avatar and PIN
- [ ] Counselor can log in after signing up
- [ ] Counselor sees waiting conversations
- [ ] Counselor can accept and chat
- [ ] Counselor can save session notes
- [ ] Messages sync between patient and counselor
- [ ] Offline banner appears when disconnected
- [ ] 404 page shows for invalid URLs
- [ ] Mobile view looks good at 375px width
