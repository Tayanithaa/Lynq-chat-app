import { Request, Response } from "express";
import { auth } from "../config/firebase.js";

export const loginUser = async (req: Request, res: Response) => {
  try {
    if (!auth) {
      return res.status(503).json({ 
        error: "Firebase Admin not configured. Using client-side authentication only." 
      });
    }
    
    const { idToken } = req.body;
    const decodedToken = await auth.verifyIdToken(idToken);
    res.json({ uid: decodedToken.uid, email: decodedToken.email });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
