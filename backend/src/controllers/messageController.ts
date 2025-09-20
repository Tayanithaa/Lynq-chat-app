import { Request, Response } from "express";
import { db } from "../config/firebase.js";

// In-memory storage for messages when Firebase is disabled
let messages: any[] = [];

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { sender, receiver, text } = req.body;
    const newMessage = {
      id: Date.now().toString(),
      sender,
      receiver,
      text,
      timestamp: new Date(),
    };

    if (db) {
      // Use Firebase if available
      await db.collection("messages").add(newMessage);
    } else {
      // Use in-memory storage if Firebase is disabled
      messages.push(newMessage);
      console.log("📝 Message stored in memory:", newMessage);
    }

    res.json({ success: true, message: "Message sent", data: newMessage });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    let messageList: any[] = [];

    if (db) {
      // Use Firebase if available
      const snapshot = await db.collection("messages").get();
      messageList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } else {
      // Use in-memory storage if Firebase is disabled
      messageList = messages;
      console.log("📋 Retrieved messages from memory:", messageList.length);
    }

    res.json({ success: true, messages: messageList });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};
