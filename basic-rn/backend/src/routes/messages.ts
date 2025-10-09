import express from "express";

const router = express.Router();

// In-memory storage for development
let messages: any[] = [];

// Send message
router.post("/", (req, res) => {
  const { text, senderId, receiverId, roomId } = req.body;
  
  const message = {
    id: Date.now().toString(),
    text,
    senderId,
    receiverId,
    roomId: roomId || `${senderId}-${receiverId}`,
    timestamp: new Date().toISOString(),
    encrypted: true
  };
  
  messages.push(message);
  
  res.json({
    success: true,
    message
  });
});

// Get messages
router.get("/", (req, res) => {
  res.json({
    success: true,
    messages,
    count: messages.length
  });
});

// Get messages by room
router.get("/:roomId", (req, res) => {
  const { roomId } = req.params;
  const roomMessages = messages.filter(m => m.roomId === roomId);
  
  res.json({
    success: true,
    messages: roomMessages,
    count: roomMessages.length
  });
});

export default router;