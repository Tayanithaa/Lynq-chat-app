# Testing Real-Time Messaging - Debug Guide

## Issue Description
When two users are logged in and click on each other to chat, messages should appear instantly on both devices. Currently this may not be working.

## What We Fixed

### 1. Added Message Filtering in `useMessages` Hook
**Problem**: The Socket.IO listener was adding ALL messages to state, not just messages for the current conversation.

**Solution**: Added conversation filtering in the `handleIncoming` function:
```typescript
const isForThisChat = 
  (msg.senderId === currentUser && msg.receiverId === otherUserId) ||
  (msg.senderId === otherUserId && msg.receiverId === currentUser);

if (!isForThisChat) {
  console.log('⏭️ Message not for this conversation, skipping');
  return;
}
```

### 2. Backend Already Correct
The server correctly:
- ✅ Emits to both sender and receiver via `io.to(socketId).emit('new-message')`
- ✅ Tracks presence with username → socketId mapping
- ✅ Supports both global `message` and targeted `new-message` events

## How to Test

### Quick Test (Automated)
```powershell
node test-two-way-messaging.js
```

Should show:
```
✅ Test 1 PASSED: User2 received 1 message(s)
✅ Test 2 PASSED: User1 received 1 message(s)
✅ Test 3 PASSED
```

### Manual Test (Two Devices)

#### Setup
1. Make sure server is running:
   ```powershell
   node simple-server.js
   ```

2. Start the app:
   ```powershell
   npx expo start
   ```

#### Test Steps

**On Device 1:**
1. Open the app
2. Login as "user1" (or any username)
3. Go to "Online" tab
4. Wait to see user2 appear

**On Device 2:**
1. Open the app  
2. Login as "user2" (different username)
3. Go to "Online" tab
4. You should see "user1" in the list
5. **Tap on "user1" to open chat**

**Both Devices:**
1. Device 1: Type "Hello from user1" and send
2. Device 2: **Should instantly see the message appear**
3. Device 2: Type "Hi from user2!" and send
4. Device 1: **Should instantly see the message appear**

### What to Look For

#### ✅ Working Correctly:
- Messages appear **immediately** without refreshing
- Each user only sees messages in their current conversation
- Online status shows green dot
- No delay or need to manually refresh

#### ❌ Problems:
- Messages don't appear until page refresh
- Messages from other conversations appear
- "No receiver selected" error
- Socket connection errors

## Debugging

### Check Server Logs
When messages are sent, you should see:
```
📨 Message ID: 1762269332729
👤 From: user1
👤 To: user2
🔐 Is Encrypted: NO
```

### Check Browser/App Console
You should see:
```
🔌 Socket connected: [socket-id]
📤 Sending encrypted message from user1 to user2: "Hello"
📨 Received message via Socket.io: {...}
✅ Adding new message to state: [message-id]
```

### Common Issues

#### Issue: "Not for this conversation" 
**Meaning**: The message filtering is working - user is in a different chat

#### Issue: Socket not connecting
**Solution**: Check that EXPO_PUBLIC_SOCKET_URL is set correctly in .env

#### Issue: Messages not appearing
**Check**:
1. Is server running? (`node simple-server.js`)
2. Are both users logged in?
3. Are they in the correct chat screen? (chatId should match the other username)
4. Check console for Socket.IO errors

## Expected Behavior

### User Flow:
1. User1 logs in → joins presence (Socket emits 'join')
2. User2 logs in → joins presence (Socket emits 'join')
3. User1 sees User2 in Online tab
4. User1 taps User2 → opens chat screen with `chatId="user2"`
5. User1's `useMessages("user2")` hook:
   - Connects to Socket.IO
   - Filters messages: `(user1 ↔ user2)` only
   - Listens for `new-message` events
6. User1 sends message:
   - POST to `/api/messages/test`
   - Server emits `new-message` to both user1 and user2 sockets
7. Both devices receive Socket event:
   - User1: Sees delivery confirmation
   - User2: Message appears instantly in chat

## Architecture

```
Device 1 (user1)                    Server                     Device 2 (user2)
     │                                 │                              │
     │──── Login (user1) ────────────>│                              │
     │<─── Socket connect ─────────────│                              │
     │──── emit('join', 'user1') ────>│                              │
     │                                 │<──── Login (user2) ──────────│
     │                                 │───── Socket connect ────────>│
     │                                 │<─── emit('join', 'user2') ───│
     │                                 │                              │
     │<─── users-online: [user1, user2] ──────────────────────────>│
     │                                 │                              │
     │ (Opens chat with user2)         │         (Opens chat with user1)
     │ useMessages("user2")            │            useMessages("user1")
     │                                 │                              │
     │──── POST /api/messages/test ──>│                              │
     │     (user1 → user2: "Hello")    │                              │
     │                                 │──── emit('new-message') ────>│
     │<─── emit('new-message') ────────│         (user1 → user2)      │
     │     (confirmation)              │                              │
     │                                 │         ✅ Message appears!   │
```

## Summary

The fix ensures that:
1. ✅ Each chat screen only shows messages for that specific conversation
2. ✅ Socket.IO delivers messages instantly to both parties
3. ✅ No duplicate messages
4. ✅ Proper filtering by senderId and receiverId

**Status**: Should now be working! Test with two devices to confirm.
