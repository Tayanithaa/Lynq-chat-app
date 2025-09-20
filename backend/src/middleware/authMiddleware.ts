import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase.js";

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  // Skip auth verification when Firebase Admin is disabled
  if (!auth) {
    console.log("⚠️ Auth verification skipped - Firebase Admin disabled");
    (req as any).user = { uid: "demo-user", email: "demo@example.com" };
    return next();
  }

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
