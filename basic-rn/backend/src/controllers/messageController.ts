import { Request, Response } from "express";import { Request, Response } from "express";import { Request, Response } from "express";import { Request, Response } from "express";

import { db } from "../config/firebase";

import { getIO } from "../socket/index";import { db } from "../config/firebase";

import { EncryptionService } from "../utils/encryption";

import { getIO } from "../socket/index";import { db } from "../config/firebase";import { db } from "../config/firebase";

// In-memory storage as fallback when Firebase is disabled

let messagesStore: any[] = [];import { EncryptionService } from "../utils/encryption";



export interface MessageData {import { getIO } from "../socket/index";import { getIO } from "../socket/index";

  id?: string;

  text?: string;// In-memory storage as fallback when Firebase is disabled

  senderId: string;

  receiverId?: string;let messagesStore: any[] = [];import { EncryptionService } from "../utils/encryption";import { EncryptionService } from "../utils/encryption";

  roomId: string;

  timestamp: string;

  messageType: 'text' | 'image' | 'audio' | 'video' | 'file';

  mediaUrl?: string;export interface MessageData {

  mediaMetadata?: any;

  encryptedContent?: {  id?: string;

    encrypted: string;

    iv: string;  text?: string;// In-memory storage as fallback when Firebase is disabled// In-memory storage as fallback when Firebase is disabled

  };

  isDelivered: boolean;  senderId: string;

  isRead: boolean;

  isTyping?: boolean;  receiverId?: string;let messagesStore: any[] = [];let messagesStore: any[] = [];

}

  roomId: string;

export const sendMessage = async (req: Request, res: Response) => {

  try {  timestamp: string;

    const { text, senderId, receiverId, roomId, messageType = 'text', mediaUrl, mediaMetadata } = req.body;

  messageType: 'text' | 'image' | 'audio' | 'video' | 'file';

    if (!senderId) {

      return res.status(400).json({   mediaUrl?: string;export interface MessageData {export interface MessageData {

        success: false,

        error: "Missing required field: senderId"   mediaMetadata?: any;

      });

    }  encryptedContent?: {  id?: string;  id?: string;



    // Use roomId or create one from senderId and receiverId    encrypted: string;

    const finalRoomId = roomId || [senderId, receiverId].sort().join('-');

    iv: string;  text?: string;  text?: string;

    // Encrypt the message content

    let encryptedContent;  };

    if (text) {

      encryptedContent = EncryptionService.encryptMessage(text);  isDelivered: boolean;  senderId: string;  senderId: string;

    }

  isRead: boolean;

    // Encrypt media metadata if present

    let encryptedMediaMetadata;  isTyping?: boolean;  receiverId?: string;  receiverId?: string;

    if (mediaMetadata) {

      encryptedMediaMetadata = EncryptionService.encryptMediaData(mediaMetadata);}

    }

  roomId: string;  roomId: string;

    const messageData: MessageData = {

      senderId,export const sendMessage = async (req: Request, res: Response) => {

      receiverId,

      roomId: finalRoomId,  try {  timestamp: string;  timestamp: string;

      timestamp: new Date().toISOString(),

      messageType,    const { text, senderId, receiverId, roomId, messageType = 'text', mediaUrl, mediaMetadata } = req.body;

      mediaUrl,

      encryptedContent,  messageType: 'text' | 'image' | 'audio' | 'video' | 'file';  messageType: 'text' | 'image' | 'audio' | 'video' | 'file';

      mediaMetadata: encryptedMediaMetadata,

      isDelivered: false,    if (!senderId) {

      isRead: false,

    };      return res.status(400).json({   mediaUrl?: string;  mediaUrl?: string;



    if (db) {        success: false,

      // Use Firebase if available

      const docRef = await db.collection("messages").add(messageData);        error: "Missing required field: senderId"   mediaMetadata?: any;  mediaMetadata?: any;

      console.log(`📤 Encrypted message sent to Firebase: ${docRef.id}`);

      const messageToReturn = {       });

        ...messageData, 

        id: docRef.id,    }  encryptedContent?: {  encryptedContent?: {

        text: text, // Include decrypted text for immediate display

        encrypted: true

      };

    // Use roomId or create one from senderId and receiverId    encrypted: string;    encrypted: string;

      // Emit real-time update to connected clients

      try {    const finalRoomId = roomId || [senderId, receiverId].sort().join('-');

        const io = getIO();

        if (io) {    iv: string;    iv: string;

          io.to(finalRoomId).emit("receive-message", messageToReturn);

        }    // Encrypt the message content

      } catch (emitErr) {

        console.warn("⚠️ Failed to emit socket message:", emitErr);    let encryptedContent;  };  };

      }

    if (text) {

      res.json({

        success: true,      encryptedContent = EncryptionService.encryptMessage(text);  isDelivered: boolean;  isDelivered: boolean;

        message: messageToReturn,

      });    }

    } else {

      // Use in-memory storage as fallback  isRead: boolean;  isRead: boolean;

      const newMessage = {

        id: Date.now().toString(),    // Encrypt media metadata if present

        ...messageData,

        text: text,    let encryptedMediaMetadata;  isTyping?: boolean;  isTyping?: boolean;

        encrypted: true

      };    if (mediaMetadata) {

      messagesStore.push(newMessage);

      encryptedMediaMetadata = EncryptionService.encryptMediaData(mediaMetadata);}}

      console.log(`📤 Message stored in memory (${messagesStore.length} total)`);

    }

      // Emit real-time update

      try {

        const io = getIO();

        if (io) {    const messageData: MessageData = {

          io.to(finalRoomId).emit("receive-message", newMessage);

        }      senderId,export const sendMessage = async (req: Request, res: Response) => {export const sendMessage = async (req: Request, res: Response) => {

      } catch (emitErr) {

        console.warn("⚠️ Failed to emit socket message:", emitErr);      receiverId,

      }

      roomId: finalRoomId,  try {  try {

      res.json({

        success: true,      timestamp: new Date().toISOString(),

        message: newMessage,

        note: "Stored in memory (Firebase disabled)"      messageType,    const { text, senderId, receiverId, roomId, messageType = 'text', mediaUrl, mediaMetadata } = req.body;    const { text, senderId, receiverId } = req.body;

      });

    }      mediaUrl,

  } catch (error) {

    console.error("❌ Send message error:", error);      encryptedContent,

    res.status(500).json({ 

      success: false,      mediaMetadata: encryptedMediaMetadata,

      error: "Failed to send message" 

    });      isDelivered: false,    if (!senderId) {    if (!text || !senderId || !receiverId) {

  }

};      isRead: false,



export const getMessages = async (req: Request, res: Response) => {    };      return res.status(400).json({       return res.status(400).json({ 

  try {

    const { roomId } = req.params;



    if (db) {    if (db) {        success: false,        success: false,

      let query = db.collection("messages").orderBy("timestamp", "asc");

            // Use Firebase if available

      if (roomId) {

        query = db.collection("messages").where("roomId", "==", roomId).orderBy("timestamp", "asc");      const docRef = await db.collection("messages").add(messageData);        error: "Missing required field: senderId"         error: "Missing required fields: text, senderId, receiverId" 

      }

      console.log(`📤 Encrypted message sent to Firebase: ${docRef.id}`);

      const snapshot = await query.limit(100).get();

      const messageToReturn = {       });      });

      const messages: any[] = [];

      snapshot.forEach((doc: any) => {        ...messageData, 

        const data = doc.data();

                id: docRef.id,    }    }

        // Decrypt message content

        try {        text: text, // Include decrypted text for immediate display

          if (data.encryptedContent) {

            data.text = EncryptionService.decryptMessage(data.encryptedContent);        encrypted: true

          }

                };

          if (data.mediaMetadata) {

            data.mediaMetadata = EncryptionService.decryptMediaData(data.mediaMetadata);    // Use roomId or create one from senderId and receiverId    const newMessage = {

          }

        } catch (decryptionError) {      // Emit real-time update to connected clients

          console.error('Decryption error for message:', doc.id, decryptionError);

          data.text = '[Unable to decrypt message]';      try {    const finalRoomId = roomId || [senderId, receiverId].sort().join('-');      id: Date.now().toString(),

        }

        const io = getIO();

        messages.push({ id: doc.id, ...data });

      });        if (io) {      text,



      console.log(`📋 Retrieved messages from Firebase: ${messages.length}`);          io.to(finalRoomId).emit("receive-message", messageToReturn);

      res.json({ 

        success: true,        }    // Encrypt the message content      senderId,

        messages,

        count: messages.length,      } catch (emitErr) {

        encrypted: true

      });        console.warn("⚠️ Failed to emit socket message:", emitErr);    let encryptedContent;      receiverId,

    } else {

      // Use in-memory storage as fallback      }

      let filteredMessages = messagesStore;

          if (text) {      timestamp: new Date().toISOString(),

      if (roomId) {

        filteredMessages = messagesStore.filter(msg => msg.roomId === roomId);      res.json({

      }

        success: true,      encryptedContent = EncryptionService.encryptMessage(text);      createdAt: new Date(),

      console.log(`📋 Retrieved messages from memory: ${filteredMessages.length}`);

      res.json({        message: messageToReturn,

        success: true,

        messages: filteredMessages,      });    }    };

        count: filteredMessages.length,

        note: "Using in-memory storage - Firebase disabled",    } else {

        encrypted: true

      });      // Use in-memory storage as fallback

    }

  } catch (err) {      const newMessage = {

    console.error("❌ Get messages error:", err);

    res.status(500).json({         id: Date.now().toString(),    // Encrypt media metadata if present    if (db) {

      success: false,

      error: "Failed to retrieve messages"         ...messageData,

    });

  }        text: text,    let encryptedMediaMetadata;      // Use Firebase if available

};

        encrypted: true

export const markMessageAsRead = async (req: Request, res: Response) => {

  try {      };    if (mediaMetadata) {      const docRef = await db.collection("messages").add(newMessage);

    const { messageId } = req.params;

      messagesStore.push(newMessage);

    if (db) {

      await db.collection('messages').doc(messageId).update({      encryptedMediaMetadata = EncryptionService.encryptMediaData(mediaMetadata);      console.log(`📤 Message sent to Firebase: ${docRef.id}`);

        isRead: true,

        readAt: new Date().toISOString()      console.log(`📤 Message stored in memory (${messagesStore.length} total)`);

      });

    }      const messageToReturn = { ...newMessage, id: docRef.id };

      res.json({

        success: true,      // Emit real-time update

        messageId,

        status: 'read'      try {

      });

    } else {        const io = getIO();

      // In-memory fallback

      const messageIndex = messagesStore.findIndex(msg => msg.id === messageId);        if (io) {    const messageData: MessageData = {      // Emit real-time update to connected clients

      if (messageIndex !== -1) {

        messagesStore[messageIndex].isRead = true;          io.to(finalRoomId).emit("receive-message", newMessage);

        messagesStore[messageIndex].readAt = new Date().toISOString();

      }        }      senderId,      try {



      res.json({      } catch (emitErr) {

        success: true,

        messageId,        console.warn("⚠️ Failed to emit socket message:", emitErr);      receiverId,        const io = getIO();

        status: 'read',

        note: 'Development mode'      }

      });

    }      roomId: finalRoomId,        if (io) {

  } catch (error) {

    console.error('Mark message as read error:', error);      res.json({

    res.status(500).json({ error: 'Failed to mark message as read' });

  }        success: true,      timestamp: new Date().toISOString(),          io.emit("message", messageToReturn);

};

        message: newMessage,

export const getMessageHistory = async (req: Request, res: Response) => {

  try {        note: "Stored in memory (Firebase disabled)"      messageType,        }

    const { userId, otherUserId } = req.params;

    const limit = parseInt(req.query.limit as string) || 50;      });



    // Create consistent room ID    }      mediaUrl,      } catch (emitErr) {

    const roomId = [userId, otherUserId].sort().join('-');

  } catch (error) {

    if (db) {

      const messagesSnapshot = await db    console.error("❌ Send message error:", error);      encryptedContent,        console.warn("⚠️ Failed to emit socket message:", emitErr);

        .collection('messages')

        .where('roomId', '==', roomId)    res.status(500).json({ 

        .orderBy('timestamp', 'desc')

        .limit(limit)      success: false,      mediaMetadata: encryptedMediaMetadata,      }

        .get();

      error: "Failed to send message" 

      const messages = messagesSnapshot.docs.map(doc => {

        const data = doc.data() as MessageData;    });      isDelivered: false,

        

        // Decrypt content  }

        try {

          if (data.encryptedContent) {};      isRead: false,      res.json({

            data.text = EncryptionService.decryptMessage(data.encryptedContent);

          }

          if (data.mediaMetadata) {

            data.mediaMetadata = EncryptionService.decryptMediaData(data.mediaMetadata);export const getMessages = async (req: Request, res: Response) => {    };        success: true,

          }

        } catch (error) {  try {

          data.text = '[Unable to decrypt]';

        }    const { roomId } = req.params;        message: messageToReturn,



        return { id: doc.id, ...data };

      }).reverse();

    if (db) {    if (db) {      });

      res.json({

        success: true,      let query = db.collection("messages").orderBy("timestamp", "asc");

        messages,

        roomId,            // Use Firebase if available    } else {

        encrypted: true

      });      if (roomId) {

    } else {

      // In-memory fallback        query = db.collection("messages").where("roomId", "==", roomId).orderBy("timestamp", "asc");      const docRef = await db.collection("messages").add(messageData);      // Use in-memory storage as fallback

      const messages = messagesStore

        .filter(msg => msg.roomId === roomId)      }

        .slice(-limit)

        .reverse();      console.log(`📤 Encrypted message sent to Firebase: ${docRef.id}`);      messagesStore.push(newMessage);



      res.json({      const snapshot = await query.limit(100).get();

        success: true,

        messages,      const messageToReturn = {       console.log(`📤 Message stored in memory: ${newMessage.id}`);

        roomId,

        note: 'Development mode',      const messages: any[] = [];

        encrypted: true

      });      snapshot.forEach((doc: any) => {        ...messageData,       // Emit real-time update to connected clients

    }

  } catch (error) {        const data = doc.data();

    console.error('Get message history error:', error);

    res.status(500).json({ error: 'Failed to get message history' });                id: docRef.id,      try {

  }

};        // Decrypt message content

        try {        text: text, // Include decrypted text for immediate display        const io = getIO();

          if (data.encryptedContent) {

            data.text = EncryptionService.decryptMessage(data.encryptedContent);        encrypted: true        if (io) {

          }

                };          io.emit("message", newMessage);

          if (data.mediaMetadata) {

            data.mediaMetadata = EncryptionService.decryptMediaData(data.mediaMetadata);        }

          }

        } catch (decryptionError) {      // Emit real-time update to connected clients      } catch (emitErr) {

          console.error('Decryption error for message:', doc.id, decryptionError);

          data.text = '[Unable to decrypt message]';      try {        console.warn("⚠️ Failed to emit socket message:", emitErr);

        }

        const io = getIO();      }

        messages.push({ id: doc.id, ...data });

      });        if (io) {



      console.log(`📋 Retrieved messages from Firebase: ${messages.length}`);          io.to(finalRoomId).emit("receive-message", messageToReturn);      res.json({

      res.json({ 

        success: true,        }        success: true,

        messages,

        count: messages.length,      } catch (emitErr) {        message: newMessage,

        encrypted: true

      });        console.warn("⚠️ Failed to emit socket message:", emitErr);        note: "Using in-memory storage - Firebase Admin disabled",

    } else {

      // Use in-memory storage as fallback      }      });

      let filteredMessages = messagesStore;

          }

      if (roomId) {

        filteredMessages = messagesStore.filter(msg => msg.roomId === roomId);      res.json({  } catch (err) {

      }

        success: true,    console.error("❌ Send message error:", err);

      console.log(`📋 Retrieved messages from memory: ${filteredMessages.length}`);

      res.json({        message: messageToReturn,    res.status(500).json({ 

        success: true,

        messages: filteredMessages,      });      success: false,

        count: filteredMessages.length,

        note: "Using in-memory storage - Firebase disabled",    } else {      error: "Failed to send message" 

        encrypted: true

      });      // Use in-memory storage as fallback    });

    }

  } catch (err) {      const newMessage = {  }

    console.error("❌ Get messages error:", err);

    res.status(500).json({         id: Date.now().toString(),};

      success: false,

      error: "Failed to retrieve messages"         ...messageData,

    });

  }        text: text,export const getMessages = async (req: Request, res: Response) => {

};

        encrypted: true  try {

export const markMessageAsRead = async (req: Request, res: Response) => {

  try {      };    if (db) {

    const { messageId } = req.params;

      messagesStore.push(newMessage);      // Use Firebase if available

    if (db) {

      await db.collection('messages').doc(messageId).update({      const snapshot = await db

        isRead: true,

        readAt: new Date().toISOString()      console.log(`📤 Message stored in memory (${messagesStore.length} total)`);        .collection("messages")

      });

        .orderBy("createdAt", "asc")

      res.json({

        success: true,      // Emit real-time update        .get();

        messageId,

        status: 'read'      try {

      });

    } else {        const io = getIO();      const messages: any[] = [];

      // In-memory fallback

      const messageIndex = messagesStore.findIndex(msg => msg.id === messageId);        if (io) {      snapshot.forEach((doc: any) =>

      if (messageIndex !== -1) {

        messagesStore[messageIndex].isRead = true;          io.to(finalRoomId).emit("receive-message", newMessage);        messages.push({ id: doc.id, ...doc.data() })

        messagesStore[messageIndex].readAt = new Date().toISOString();

      }        }      );



      res.json({      } catch (emitErr) {

        success: true,

        messageId,        console.warn("⚠️ Failed to emit socket message:", emitErr);      console.log(`📋 Retrieved messages from Firebase: ${messages.length}`);

        status: 'read',

        note: 'Development mode'      }      res.json({ 

      });

    }        success: true,

  } catch (error) {

    console.error('Mark message as read error:', error);      res.json({        messages,

    res.status(500).json({ error: 'Failed to mark message as read' });

  }        success: true,        count: messages.length

};

        message: newMessage,      });

export const getMessageHistory = async (req: Request, res: Response) => {

  try {        note: "Stored in memory (Firebase disabled)"    } else {

    const { userId, otherUserId } = req.params;

    const limit = parseInt(req.query.limit as string) || 50;      });      // Use in-memory storage as fallback



    // Create consistent room ID    }      console.log(`📋 Retrieved messages from memory: ${messagesStore.length}`);

    const roomId = [userId, otherUserId].sort().join('-');

  } catch (error) {      res.json({ 

    if (db) {

      const messagesSnapshot = await db    console.error("❌ Send message error:", error);        success: true,

        .collection('messages')

        .where('roomId', '==', roomId)    res.status(500).json({         messages: messagesStore,

        .orderBy('timestamp', 'desc')

        .limit(limit)      success: false,        count: messagesStore.length,

        .get();

      error: "Failed to send message"         note: "Using in-memory storage - Firebase Admin disabled"

      const messages = messagesSnapshot.docs.map(doc => {

        const data = doc.data() as MessageData;    });      });

        

        // Decrypt content  }    }

        try {

          if (data.encryptedContent) {};  } catch (err) {

            data.text = EncryptionService.decryptMessage(data.encryptedContent);

          }    console.error("❌ Get messages error:", err);

          if (data.mediaMetadata) {

            data.mediaMetadata = EncryptionService.decryptMediaData(data.mediaMetadata);export const getMessages = async (req: Request, res: Response) => {    res.status(500).json({ 

          }

        } catch (error) {  try {      success: false,

          data.text = '[Unable to decrypt]';

        }    const { roomId } = req.params;      error: "Failed to fetch messages" 



        return { id: doc.id, ...data };    const userId = (req as any).user?.uid || 'dev-user';    });

      }).reverse();

  }

      res.json({

        success: true,    if (db) {};

        messages,

        roomId,      let query = db.collection("messages").orderBy("timestamp", "asc");

        encrypted: true      

      });      if (roomId) {

    } else {        query = db.collection("messages").where("roomId", "==", roomId).orderBy("timestamp", "asc");

      // In-memory fallback      }

      const messages = messagesStore

        .filter(msg => msg.roomId === roomId)      const snapshot = await query.limit(100).get();

        .slice(-limit)

        .reverse();      const messages: any[] = [];

      snapshot.forEach((doc: any) => {

      res.json({        const data = doc.data();

        success: true,        

        messages,        // Decrypt message content

        roomId,        try {

        note: 'Development mode',          if (data.encryptedContent) {

        encrypted: true            data.text = EncryptionService.decryptMessage(data.encryptedContent);

      });          }

    }          

  } catch (error) {          if (data.mediaMetadata) {

    console.error('Get message history error:', error);            data.mediaMetadata = EncryptionService.decryptMediaData(data.mediaMetadata);

    res.status(500).json({ error: 'Failed to get message history' });          }

  }        } catch (decryptionError) {

};          console.error('Decryption error for message:', doc.id, decryptionError);
          data.text = '[Unable to decrypt message]';
        }

        messages.push({ id: doc.id, ...data });
      });

      console.log(`📋 Retrieved messages from Firebase: ${messages.length}`);
      res.json({ 
        success: true,
        messages,
        count: messages.length,
        encrypted: true
      });
    } else {
      // Use in-memory storage as fallback
      let filteredMessages = messagesStore;
      
      if (roomId) {
        filteredMessages = messagesStore.filter(msg => msg.roomId === roomId);
      }

      console.log(`📋 Retrieved messages from memory: ${filteredMessages.length}`);
      res.json({
        success: true,
        messages: filteredMessages,
        count: filteredMessages.length,
        note: "Using in-memory storage - Firebase disabled",
        encrypted: true
      });
    }
  } catch (err) {
    console.error("❌ Get messages error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to retrieve messages" 
    });
  }
};

export const markMessageAsRead = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = (req as any).user?.uid || 'dev-user';

    if (db) {
      await db.collection('messages').doc(messageId).update({
        isRead: true,
        readAt: new Date().toISOString()
      });

      res.json({
        success: true,
        messageId,
        status: 'read'
      });
    } else {
      // In-memory fallback
      const messageIndex = messagesStore.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        messagesStore[messageIndex].isRead = true;
        messagesStore[messageIndex].readAt = new Date().toISOString();
      }

      res.json({
        success: true,
        messageId,
        status: 'read',
        note: 'Development mode'
      });
    }
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

export const getMessageHistory = async (req: Request, res: Response) => {
  try {
    const { userId, otherUserId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Create consistent room ID
    const roomId = [userId, otherUserId].sort().join('-');

    if (db) {
      const messagesSnapshot = await db
        .collection('messages')
        .where('roomId', '==', roomId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const messages = messagesSnapshot.docs.map(doc => {
        const data = doc.data() as MessageData;
        
        // Decrypt content
        try {
          if (data.encryptedContent) {
            data.text = EncryptionService.decryptMessage(data.encryptedContent);
          }
          if (data.mediaMetadata) {
            data.mediaMetadata = EncryptionService.decryptMediaData(data.mediaMetadata);
          }
        } catch (error) {
          data.text = '[Unable to decrypt]';
        }

        return { id: doc.id, ...data };
      }).reverse(); // Reverse to get chronological order

      res.json({
        success: true,
        messages,
        roomId,
        encrypted: true
      });
    } else {
      // In-memory fallback
      const messages = messagesStore
        .filter(msg => msg.roomId === roomId)
        .slice(-limit)
        .reverse();

      res.json({
        success: true,
        messages,
        roomId,
        note: 'Development mode',
        encrypted: true
      });
    }
  } catch (error) {
    console.error('Get message history error:', error);
    res.status(500).json({ error: 'Failed to get message history' });
  }
};