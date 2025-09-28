import { Request, Response } from "express";
import { db } from "../config/firebase";
import { getIO } from "../socket/index";

// In-memory storage as fallback when Firebase is disabled
let messagesStore: any[] = [];

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { text, senderId, receiverId } = req.body;

    if (!text || !senderId || !receiverId) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: text, senderId, receiverId" 
      });
    }

    const newMessage = {
      id: Date.now().toString(),
      text,
      senderId,
      receiverId,
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
    };

    if (db) {
      // Use Firebase if available
      const docRef = await db.collection("messages").add(newMessage);
      console.log(`📤 Message sent to Firebase: ${docRef.id}`);
      const messageToReturn = { ...newMessage, id: docRef.id };

      // Emit real-time update to connected clients
      try {
        const io = getIO();
        if (io) {
          io.emit("message", messageToReturn);
        }
      } catch (emitErr) {
        console.warn("⚠️ Failed to emit socket message:", emitErr);
      }

      res.json({
        success: true,
        message: messageToReturn,
      });
    } else {
      // Use in-memory storage as fallback
      messagesStore.push(newMessage);
      console.log(`📤 Message stored in memory: ${newMessage.id}`);
      // Emit real-time update to connected clients
      try {
        const io = getIO();
        if (io) {
          io.emit("message", newMessage);
        }
      } catch (emitErr) {
        console.warn("⚠️ Failed to emit socket message:", emitErr);
      }

      res.json({
        success: true,
        message: newMessage,
        note: "Using in-memory storage - Firebase Admin disabled",
      });
    }
  } catch (err) {
    console.error("❌ Send message error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to send message" 
    });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    if (db) {
      // Use Firebase if available
      const snapshot = await db
        .collection("messages")
        .orderBy("createdAt", "asc")
        .get();

      const messages: any[] = [];
      snapshot.forEach((doc: any) =>
        messages.push({ id: doc.id, ...doc.data() })
      );

      console.log(`📋 Retrieved messages from Firebase: ${messages.length}`);
      res.json({ 
        success: true,
        messages,
        count: messages.length
      });
    } else {
      // Use in-memory storage as fallback
      console.log(`📋 Retrieved messages from memory: ${messagesStore.length}`);
      res.json({ 
        success: true,
        messages: messagesStore,
        count: messagesStore.length,
        note: "Using in-memory storage - Firebase Admin disabled"
      });
    }
  } catch (err) {
    console.error("❌ Get messages error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch messages" 
    });
  }
};
