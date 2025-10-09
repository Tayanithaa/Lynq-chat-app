import { Server } from 'socket.io';import { Server, Socket } from 'socket.io';import { Server } from 'socket.io';



let io: Server | null = null;import { EncryptionService } from '../utils/encryption';import { EncryptionService } from '../utils/encryption';



export const initSocket = (serverIO: Server) => {

  io = serverIO;

  let io: Server | null = null;let io: Server | null = null;

  io.on('connection', (socket) => {

    console.log('Client connected:', socket.id);



    socket.on('join-room', (data) => {const onlineUsers = new Map<string, string>();// Online users tracking

      const { roomId } = data;

      socket.join(roomId);const userSockets = new Map<string, string>();const onlineUsers = new Map<string, string>(); // userId -> socketId

      console.log(`Socket joined room: ${roomId}`);

    });const userSockets = new Map<string, string>(); // socketId -> userId



    socket.on('send-message', (data) => {declare module 'socket.io' {

      const { roomId, message, senderId, receiverId } = data;

      socket.to(roomId).emit('receive-message', {  interface Socket {declare module 'socket.io' {

        message,

        senderId,    userId?: string;  interface Socket {

        receiverId,

        timestamp: new Date().toISOString(),  }    userId?: string;

      });

    });}  }



    socket.on('disconnect', () => {}

      console.log('Client disconnected:', socket.id);

    });export const initSocket = (serverIO: Server) => {

  });

  io = serverIO;export const initSocket = (serverIO: Server) => {

  return io;

};    io = serverIO;



export const getIO = () => {  io.engine.on("connection_error", (err) => {  

  if (!io) {

    throw new Error("Socket.io not initialized");    console.log("Socket connection error:", err.req);  // Configure for mobile app support

  }

  return io;    console.log("Error code:", err.code);  io.engine.on("connection_error", (err) => {

};
    console.log("Error message:", err.message);    console.log("Socket connection error:", err.req);

  });    console.log("Error code:", err.code);

    console.log("Error message:", err.message);

  io.on('connection', (socket: Socket) => {  });

    console.log('Client connected:', socket.id);

  io.on('connection', (socket) => {

    socket.on('user-online', (data) => {    console.log('Client connected:', socket.id);

      const { userId } = data;    console.log('Transport:', socket.conn.transport.name);

      socket.userId = userId;

      onlineUsers.set(userId, socket.id);    // Handle user coming online

      userSockets.set(socket.id, userId);    socket.on('user-online', (data) => {

      socket.join(`user-${userId}`);      const { userId } = data;

      console.log(`User ${userId} came online`);      socket.userId = userId;

            onlineUsers.set(userId, socket.id);

      socket.broadcast.emit('user-status-changed', {      userSockets.set(socket.id, userId);

        userId,      socket.join(`user-${userId}`);

        status: 'online',      console.log(`User ${userId} came online`);

        timestamp: new Date().toISOString()      

      });      // Broadcast online status to contacts

    });      socket.broadcast.emit('user-status-changed', {

        userId,

    socket.on('join-room', (data) => {        status: 'online',

      const { roomId } = data;        timestamp: new Date().toISOString()

      socket.join(roomId);      });

      console.log(`Socket ${socket.id} joined room ${roomId}`);    });

      socket.emit('room-joined', { roomId, success: true });

    });    // Handle joining chat rooms

    socket.on('join-room', (data) => {

    socket.on('send-message', (data) => {      const { roomId } = data;

      try {      socket.join(roomId);

        const { roomId, message, senderId, receiverId, messageType = 'text' } = data;      console.log(`Socket ${socket.id} joined room ${roomId}`);

              

        let encryptedContent;      // Send room history if available

        if (message && typeof message === 'string') {      socket.emit('room-joined', { roomId, success: true });

          encryptedContent = EncryptionService.encryptMessage(message);    });

        }

    // Handle sending messages with encryption

        const messageData = {    socket.on('send-message', (data) => {

          id: Date.now().toString(),      try {

          senderId,        const { roomId, message, senderId, receiverId, messageType = 'text' } = data;

          receiverId,        

          roomId,        // Encrypt message before broadcasting

          message: message,        let encryptedContent;

          encryptedContent,        if (message && typeof message === 'string') {

          messageType,          encryptedContent = EncryptionService.encryptMessage(message);

          timestamp: new Date().toISOString(),        }

          isDelivered: false,

          isRead: false        const messageData = {

        };          id: Date.now().toString(),

          senderId,

        socket.to(roomId).emit('receive-message', messageData);          receiverId,

                  roomId,

        if (receiverId && onlineUsers.has(receiverId)) {          message: message, // Send plain text for real-time display

          messageData.isDelivered = true;          encryptedContent, // Send encrypted for storage

          socket.emit('message-delivered', { messageId: messageData.id });          messageType,

        }          timestamp: new Date().toISOString(),

          isDelivered: false,

        console.log(`📤 Message sent to room ${roomId}`);          isRead: false

      } catch (error) {        };

        console.error('Error handling send-message:', error);

        socket.emit('message-error', { error: 'Failed to send message' });        // Send to room

      }        socket.to(roomId).emit('receive-message', messageData);

    });        

        // Mark as delivered if receiver is online

    socket.on('typing-start', (data) => {        if (receiverId && onlineUsers.has(receiverId)) {

      const { roomId, userId } = data;          messageData.isDelivered = true;

      socket.to(roomId).emit('user-typing', { userId, isTyping: true });          socket.emit('message-delivered', { messageId: messageData.id });

    });        }



    socket.on('typing-stop', (data) => {        console.log(`📤 Message sent to room ${roomId}`);

      const { roomId, userId } = data;      } catch (error) {

      socket.to(roomId).emit('user-typing', { userId, isTyping: false });        console.error('Error handling send-message:', error);

    });        socket.emit('message-error', { error: 'Failed to send message' });

      }

    socket.on('message-read', (data) => {    });

      const { messageId, roomId, userId } = data;

      socket.to(roomId).emit('message-read-receipt', { messageId, readBy: userId });    // Handle typing indicators

    });    socket.on('typing-start', (data) => {

      const { roomId, userId } = data;

    socket.on('initiate-call', (callData) => {      socket.to(roomId).emit('user-typing', { userId, isTyping: true });

      console.log('📞 Call initiated:', callData);    });

      const { receiverId } = callData;

          socket.on('typing-stop', (data) => {

      if (onlineUsers.has(receiverId)) {      const { roomId, userId } = data;

        const receiverSocketId = onlineUsers.get(receiverId);      socket.to(roomId).emit('user-typing', { userId, isTyping: false });

        io?.to(receiverSocketId!).emit('incoming-call', {    });

          ...callData,

          callerId: userSockets.get(socket.id)    // Handle message read receipts

        });    socket.on('message-read', (data) => {

      } else {      const { messageId, roomId, userId } = data;

        socket.emit('call-failed', { reason: 'User offline' });      socket.to(roomId).emit('message-read-receipt', { messageId, readBy: userId });

      }    });

    });

    // Handle calling features with enhanced WebRTC support

    socket.on('accept-call', (callData) => {    socket.on('initiate-call', (callData) => {

      console.log('📞 Call accepted:', callData);      console.log('📞 Call initiated:', callData);

      const { callerId } = callData;      const { receiverId, callType, offer } = callData;

            

      if (onlineUsers.has(callerId)) {      if (onlineUsers.has(receiverId)) {

        const callerSocketId = onlineUsers.get(callerId);        const receiverSocketId = onlineUsers.get(receiverId);

        io?.to(callerSocketId!).emit('call-accepted', {        io?.to(receiverSocketId!).emit('incoming-call', {

          ...callData,          ...callData,

          acceptedBy: userSockets.get(socket.id)          callerId: userSockets.get(socket.id)

        });        });

      }      } else {

    });        socket.emit('call-failed', { reason: 'User offline' });

      }

    socket.on('decline-call', (callData) => {    });

      console.log('📞 Call declined:', callData);

      const { callerId } = callData;    socket.on('accept-call', (callData) => {

            console.log('📞 Call accepted:', callData);

      if (onlineUsers.has(callerId)) {      const { callerId, answer } = callData;

        const callerSocketId = onlineUsers.get(callerId);      

        io?.to(callerSocketId!).emit('call-declined', {      if (onlineUsers.has(callerId)) {

          declinedBy: userSockets.get(socket.id)        const callerSocketId = onlineUsers.get(callerId);

        });        io?.to(callerSocketId!).emit('call-accepted', {

      }          ...callData,

    });          acceptedBy: userSockets.get(socket.id)

        });

    socket.on('end-call', (callData) => {      }

      console.log('📞 Call ended:', callData);    });

      const { otherUserId } = callData;

          socket.on('decline-call', (callData) => {

      if (onlineUsers.has(otherUserId)) {      console.log('📞 Call declined:', callData);

        const otherSocketId = onlineUsers.get(otherUserId);      const { callerId } = callData;

        io?.to(otherSocketId!).emit('call-ended', {      

          endedBy: userSockets.get(socket.id)      if (onlineUsers.has(callerId)) {

        });        const callerSocketId = onlineUsers.get(callerId);

      }        io?.to(callerSocketId!).emit('call-declined', {

    });          declinedBy: userSockets.get(socket.id)

        });

    socket.on('ice-candidate', (data) => {      }

      const { candidate, targetUserId } = data;    });

      if (onlineUsers.has(targetUserId)) {

        const targetSocketId = onlineUsers.get(targetUserId);    socket.on('end-call', (callData) => {

        io?.to(targetSocketId!).emit('ice-candidate', {      console.log('📞 Call ended:', callData);

          candidate,      const { otherUserId } = callData;

          fromUserId: userSockets.get(socket.id)      

        });      if (onlineUsers.has(otherUserId)) {

      }        const otherSocketId = onlineUsers.get(otherUserId);

    });        io?.to(otherSocketId!).emit('call-ended', {

          endedBy: userSockets.get(socket.id)

    socket.on('send-media', (data) => {        });

      try {      }

        const { roomId, mediaUrl, mediaType, senderId, receiverId, metadata } = data;    });

        

        let encryptedMetadata;    // WebRTC signaling

        if (metadata) {    socket.on('ice-candidate', (data) => {

          encryptedMetadata = EncryptionService.encryptMediaData(metadata);      const { candidate, targetUserId } = data;

        }      if (onlineUsers.has(targetUserId)) {

        const targetSocketId = onlineUsers.get(targetUserId);

        const mediaMessage = {        io?.to(targetSocketId!).emit('ice-candidate', {

          id: Date.now().toString(),          candidate,

          senderId,          fromUserId: userSockets.get(socket.id)

          receiverId,        });

          roomId,      }

          mediaUrl,    });

          mediaType,

          encryptedMetadata,    // Handle media messages

          messageType: 'media',    socket.on('send-media', (data) => {

          timestamp: new Date().toISOString()      try {

        };        const { roomId, mediaUrl, mediaType, senderId, receiverId, metadata } = data;

        

        socket.to(roomId).emit('receive-media', mediaMessage);        // Encrypt media metadata

        console.log(`📎 Media message sent to room ${roomId}`);        let encryptedMetadata;

      } catch (error) {        if (metadata) {

        console.error('Error handling send-media:', error);          encryptedMetadata = EncryptionService.encryptMediaData(metadata);

        socket.emit('media-error', { error: 'Failed to send media' });        }

      }

    });        const mediaMessage = {

          id: Date.now().toString(),

    socket.on('disconnect', () => {          senderId,

      const userId = userSockets.get(socket.id);          receiverId,

      if (userId) {          roomId,

        onlineUsers.delete(userId);          mediaUrl,

        userSockets.delete(socket.id);          mediaType,

                  encryptedMetadata,

        socket.broadcast.emit('user-status-changed', {          messageType: 'media',

          userId,          timestamp: new Date().toISOString()

          status: 'offline',        };

          timestamp: new Date().toISOString()

        });        socket.to(roomId).emit('receive-media', mediaMessage);

                console.log(`📎 Media message sent to room ${roomId}`);

        console.log(`User ${userId} went offline`);      } catch (error) {

      }        console.error('Error handling send-media:', error);

      console.log(`Client disconnected: ${socket.id}`);        socket.emit('media-error', { error: 'Failed to send media' });

    });      }

  });    });



  return io;    // Handle file sharing

};    socket.on('send-file', (data) => {

      const { roomId, fileName, fileSize, fileType, senderId, receiverId } = data;

export const getIO = () => {      

  if (!io) {      const fileMessage = {

    throw new Error("Socket.io not initialized");        id: Date.now().toString(),

  }        senderId,

  return io;        receiverId,

};        roomId,

        fileName,

export const getOnlineUsers = () => {        fileSize,

  return Array.from(onlineUsers.keys());        fileType,

};        messageType: 'file',

        timestamp: new Date().toISOString()

export const isUserOnline = (userId: string) => {      };

  return onlineUsers.has(userId);

};      socket.to(roomId).emit('receive-file', fileMessage);
      console.log(`📄 File message sent to room ${roomId}: ${fileName}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = userSockets.get(socket.id);
      if (userId) {
        onlineUsers.delete(userId);
        userSockets.delete(socket.id);
        
        // Broadcast offline status
        socket.broadcast.emit('user-status-changed', {
          userId,
          status: 'offline',
          timestamp: new Date().toISOString()
        });
        
        console.log(`User ${userId} went offline`);
      }
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

export const isUserOnline = (userId: string) => {
  return onlineUsers.has(userId);
};

// Helper functions for mobile app support
export const emitToAll = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};

export const emitToRoom = (room: string, event: string, data: any) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};