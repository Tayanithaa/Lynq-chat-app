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
  cors: { origin: '*' } // restrict origin in production
});

const uidToSocket = new Map(); // uid -> socket.id

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
  });

  // sender sends message => server relays to other sockets in room
  socket.on('send-message', ({ roomId, message }) => {
    // send to everyone in room except the sender
    socket.to(roomId).emit('receive-message', { fromUid: uid, message, ts: Date.now() });
  });

  socket.on('disconnect', () => {
    uidToSocket.delete(uid);
    console.log(`disconnected: ${uid}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Socket server listening on ${PORT}`));
