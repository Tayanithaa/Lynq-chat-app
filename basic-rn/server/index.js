// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const cors = require('cors');
const serviceAccount = require('./serviceAccountKey.json'); // download from Firebase console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'] // add websocket first for RN
});

const uidToSocket = new Map(); // uid -> socket.id
const roomMessages = new Map(); // roomId -> [{ fromUid, message, ts }]
const uidRooms = new Map(); // uid -> Set(roomId)
const MAX_MESSAGES_PER_ROOM = 100;

// verify firebase id token on handshake
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('auth-required'));
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    socket.uid = decoded.uid;
    return next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return next(new Error('invalid-token'));
  }
});

io.on('connection', (socket) => {
  const uid = socket.uid;
  uidToSocket.set(uid, socket.id);
  console.log(`connected: ${uid}`);

  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId);
    console.log(`${uid} joined ${roomId}`);
    // optionally auto send recent history to this socket
    const history = roomMessages.get(roomId) || [];
    socket.emit('room-history', { roomId, messages: history });
    let set = uidRooms.get(uid);
    if (!set) {
      set = new Set();
      uidRooms.set(uid, set);
    }
    set.add(roomId);
  });

  // sender sends message => server relays to other sockets in room
  socket.on('send-message', ({ roomId, message }) => {
    const ts = Date.now();
    const payload = { fromUid: uid, message, ts };
    // store history
    let list = roomMessages.get(roomId);
    if (!list) {
      list = [];
      roomMessages.set(roomId, list);
    }
    list.push(payload);
    if (list.length > MAX_MESSAGES_PER_ROOM) list.splice(0, list.length - MAX_MESSAGES_PER_ROOM);
    // relay
    socket.to(roomId).emit('receive-message', payload);
    // optionally echo back ack to sender (RN clients often want confirmation)
    socket.emit('message-sent', { roomId, ts });
  });

  // fetch history via socket (client emits 'fetch-history', receives 'room-history')
  socket.on('fetch-history', ({ roomId }) => {
    const history = roomMessages.get(roomId) || [];
    socket.emit('room-history', { roomId, messages: history });
  });

  // direct user-to-user message (outside rooms)
  socket.on('send-direct-message', ({ toUid, message }) => {
    const toSocketId = uidToSocket.get(toUid);
    const ts = Date.now();
    if (toSocketId) {
      io.to(toSocketId).emit('receive-direct-message', { fromUid: uid, message, ts });
      socket.emit('direct-message-sent', { toUid, ts });
    } else {
      socket.emit('direct-message-failed', { toUid, reason: 'offline' });
    }
  });

  // typing indicator (optional)
  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('typing', { fromUid: uid, isTyping });
  });

  socket.on('ping', () => {
    socket.emit('pong', { ts: Date.now() });
  });

  socket.on('disconnect', () => {
    uidToSocket.delete(uid);
    uidRooms.delete(uid);
    console.log(`disconnected: ${uid}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Socket server listening on ${PORT}`));

// REST: health check
app.get('/health', (_req, res) => res.json({ ok: true, time: Date.now() }));

// REST: room history fetch (alternative to socket event)
app.get('/rooms/:roomId/history', (req, res) => {
  const history = roomMessages.get(req.params.roomId) || [];
  res.json(history);
});

app.get('/debug/connections', (_req, res) => {
  const result = [];
  for (const [uid, socketId] of uidToSocket.entries()) {
    const rooms = Array.from(uidRooms.get(uid) || []);
    result.push({ uid, socketId, rooms });
  }
  res.json({ connections: result, count: result.length });
});

// === Test endpoints / usage reference (replace localhost with LAN IP for device) ===
// Health:            GET http://localhost:3000/health
// Room history:      GET http://localhost:3000/rooms/<roomId>/history
// Connections debug: GET http://localhost:3000/debug/connections
//
// Socket events (emit):
// join-room            { roomId }
// send-message         { roomId, message }
// fetch-history        { roomId }
// send-direct-message  { toUid, message }
// typing               { roomId, isTyping }
// ping                 (no payload)
//
// Socket events (listen):
// room-history, receive-message, message-sent,
// receive-direct-message, direct-message-sent, direct-message-failed,
// typing, pong
// ===============================================================
