import express from "express";
import { resendOTP, sendOTP, verifyOTP } from "../controllers/otpController";

const router = express.Router();

// Send OTP to phone number
router.post("/send", sendOTP);

// Verify OTP
router.post("/verify", verifyOTP);

// Resend OTP
router.post("/resend", resendOTP);

export default router;