const io = require('socket.io-client');

const socket = io('http://localhost:3004', { transports: ['websocket'] });

socket.on('connect', () => {
  console.log('Connected socket id', socket.id);
  socket.emit('join', 'test-debug');
});

socket.on('message', (msg) => {
  console.log('Message event received:', msg);
  socket.disconnect();
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('connect_error', (err) => {
  console.error('Socket connect_error', err.message);
  process.exit(1);
});
