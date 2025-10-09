import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import messageRoutes from "./routes/messages";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;

// Routes
app.use("/api/messages", messageRoutes);
app.use("/messages", messageRoutes);

// Basic health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    port: PORT,
    message: "Lynq Backend is running!"
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "🚀 Lynq Backend is running!",
    endpoints: {
      health: "/health",
      messages: "/api/messages"
    }
  });
});

// Socket initialization
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (data) => {
    const { roomId } = data;
    socket.join(roomId);
    console.log(`Socket joined room: ${roomId}`);
  });

  socket.on('send-message', (data) => {
    const { roomId, message, senderId, receiverId } = data;
    socket.to(roomId).emit('receive-message', {
      message,
      senderId,
      receiverId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Lynq Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});