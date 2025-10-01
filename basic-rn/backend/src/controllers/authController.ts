import { Request, Response } from "express";
import { auth } from "../config/firebase";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }

    // Check if Firebase Admin is available
    if (!auth) {
      // Fallback: Accept any token for development
      console.warn("⚠️ Auth verification skipped - Firebase Admin disabled");
      return res.json({
        uid: "dev-user-" + Date.now(),
        email: "dev@example.com",
        message: "Development mode - Firebase Admin disabled"
      });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    res.json({
      uid: decodedToken.uid,
      email: decodedToken.email,
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
