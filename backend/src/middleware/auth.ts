import { NextFunction, Request, Response } from "express";
import { auth } from "../config/firebase";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // If Firebase Admin is disabled, skip verification and inject a dev user
  if (!auth) {
    req.user = { uid: "dev-user", email: "dev@local" };
    return next();
  }

  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
