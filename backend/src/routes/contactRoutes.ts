import express from "express";
import { checkRegisteredContacts, getRegisteredUsersCount, registerUser } from "../controllers/contactController";

const router = express.Router();

// Check which contacts are registered users
router.post("/check", checkRegisteredContacts);

// Register a new user (for testing)
router.post("/register", registerUser);

// Get registered users count
router.get("/stats", getRegisteredUsersCount);

export default router;