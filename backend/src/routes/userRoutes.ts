import express from "express";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me", verifyToken, (req, res) => {
  res.json((req as any).user);
});

export default router;
