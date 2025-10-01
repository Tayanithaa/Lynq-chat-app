import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

// Protected Routes
router.post("/", verifyToken, sendMessage);
router.get("/", verifyToken, getMessages);

// Test Routes (without authentication for browser testing)
router.post("/test", sendMessage);
router.get("/test", getMessages);

export default router;
