import { NextFunction, Request, Response } from "express";
import { auth } from "../config/firebase";

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;

    if (!auth) {
      // Firebase Admin disabled - skip authentication for development
      console.warn("⚠️ Auth verification skipped - Firebase Admin disabled");
      (req as any).user = { 
        uid: "dev-user-" + Date.now(), 
        email: "dev@example.com" 
      };
      return next();
    }

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false,
        error: "Unauthorized - Bearer token required" 
      });
    }

    const token = header.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    (req as any).user = decodedToken;
    next();
  } catch (err) {
    console.error("❌ Token verification error:", err);
    res.status(401).json({ 
      success: false,
      error: "Invalid or expired token" 
    });
  }
};
