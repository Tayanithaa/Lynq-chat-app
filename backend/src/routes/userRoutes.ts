import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
