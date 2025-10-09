import { Request, Response } from "express";
import { SMSService } from "../services/smsService";

// In-memory storage for OTPs (in production, use Redis or database)
interface OTPData {
  otp: string;
  phoneNumber: string;
  createdAt: Date;
  attempts: number;
  messageId?: string;
}

const otpStorage = new Map<string, OTPData>();
const MAX_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS || '3');
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP endpoint
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false,
        error: "Phone number is required" 
      });
    }

    // Validate and format phone number
    if (!SMSService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid phone number format. Please use international format (e.g., +1234567890)" 
      });
    }

    const cleanPhone = SMSService.formatPhoneNumber(phoneNumber);
    
    // Check if SMS service is available
    if (!SMSService.isServiceAvailable()) {
      return res.status(503).json({
        success: false,
        error: "SMS service is currently unavailable"
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    
    // Send OTP via SMS
    const smsResult = await SMSService.sendOTP(cleanPhone, otp);
    
    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        error: smsResult.error || "Failed to send OTP"
      });
    }

    // Store OTP data
    const otpData: OTPData = {
      otp,
      phoneNumber: cleanPhone,
      createdAt: new Date(),
      attempts: 0,
      messageId: smsResult.messageId
    };

    otpStorage.set(cleanPhone, otpData);
    
    console.log(`📱 OTP sent to ${cleanPhone} via ${SMSService.getServiceStatus()}`);

    res.json({
      success: true,
      message: "OTP sent successfully",
      expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
      // Show OTP in development mode only
      debug: process.env.NODE_ENV === 'development' && process.env.ENABLE_REAL_SMS !== 'true' ? { otp } : undefined
    });

  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send OTP"
    });
  }
};

// Verify OTP endpoint
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        error: "Phone number and OTP are required"
      });
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const otpData = otpStorage.get(cleanPhone);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        error: "No OTP found for this phone number"
      });
    }

    // Check if OTP is expired
    const now = new Date();
    const otpAge = (now.getTime() - otpData.createdAt.getTime()) / (1000 * 60);
    
    if (otpAge > OTP_EXPIRY_MINUTES) {
      otpStorage.delete(cleanPhone);
      return res.status(400).json({
        success: false,
        error: "OTP has expired"
      });
    }

    // Check attempts
    if (otpData.attempts >= MAX_ATTEMPTS) {
      otpStorage.delete(cleanPhone);
      return res.status(400).json({
        success: false,
        error: "Maximum verification attempts exceeded"
      });
    }

    // Verify OTP
    if (otpData.otp !== otp.toString()) {
      otpData.attempts++;
      otpStorage.set(cleanPhone, otpData);
      
      return res.status(400).json({
        success: false,
        error: `Invalid OTP. ${MAX_ATTEMPTS - otpData.attempts} attempts remaining`
      });
    }

    // OTP verified successfully
    otpStorage.delete(cleanPhone); // Remove OTP after successful verification

    // Generate a simple session token (in production, use JWT)
    const sessionToken = `session_${cleanPhone}_${Date.now()}`;

    res.json({
      success: true,
      message: "OTP verified successfully",
      sessionToken,
      phoneNumber: cleanPhone
    });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify OTP"
    });
  }
};

// Resend OTP endpoint
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required"
      });
    }

    // Use the same logic as sendOTP
    await sendOTP(req, res);

  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resend OTP"
    });
  }
};