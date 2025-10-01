import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/userRoutes";
import { initSocket } from "./socket/index";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    firebase: process.env.FIREBASE_ADMIN_DISABLED === 'true' ? 'disabled' : 'enabled'
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// Direct message routes (for frontend compatibility)
app.use("/messages", messageRoutes);

// Root endpoint
app.get("/", (req: express.Request, res: express.Response) => {
  res.json({
    message: "🚀 Lynq Backend is running!",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      messages: "/api/messages",
      users: "/api/users"
    }
  });
});

// Socket.io for real-time messaging
io.on("connection", (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`👤 User ${socket.id} joined room: ${roomId}`);
  });

  socket.on("send-message", (data) => {
    socket.to(data.roomId).emit("receive-message", data);
  });

  socket.on("disconnect", () => {
    console.log(`👤 User disconnected: ${socket.id}`);
  });
});

// expose io for controllers
initSocket(io);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API docs: http://localhost:${PORT}/`);
});
