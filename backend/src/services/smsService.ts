import twilio from 'twilio';

// SMS Service Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const enableRealSMS = process.env.ENABLE_REAL_SMS === 'true';

// Initialize Twilio client
let twilioClient: twilio.Twilio | null = null;

if (enableRealSMS && accountSid && authToken) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio SMS service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Twilio:', error);
  }
} else {
  console.log('📱 SMS service running in development mode');
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSService {
  /**
   * Send OTP via SMS
   */
  static async sendOTP(phoneNumber: string, otp: string): Promise<SMSResult> {
    try {
      const message = `Your Lynq verification code is: ${otp}. This code will expire in 5 minutes. Do not share this code with anyone.`;
      
      if (enableRealSMS && twilioClient && twilioPhoneNumber) {
        console.log(`📱 Sending real SMS to ${phoneNumber}`);
        
        const result = await twilioClient.messages.create({
          body: message,
          from: twilioPhoneNumber,
          to: phoneNumber
        });
        
        console.log(`✅ SMS sent successfully. SID: ${result.sid}`);
        return {
          success: true,
          messageId: result.sid
        };
        
      } else {
        // Development mode - log the OTP instead of sending SMS
        console.log('🔐 Development Mode - OTP Message:');
        console.log(`📱 To: ${phoneNumber}`);
        console.log(`💬 Message: ${message}`);
        console.log(`🔢 OTP: ${otp}`);
        
        return {
          success: true,
          messageId: `dev_${Date.now()}`
        };
      }
      
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS'
      };
    }
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove spaces and special characters
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[()-]/g, '');
    
    // Check if it's a valid international format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(cleanPhone);
  }

  /**
   * Format phone number for consistency
   */
  static formatPhoneNumber(phoneNumber: string): string {
    let cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[()-]/g, '');
    
    // Add + if not present
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    
    return cleanPhone;
  }

  /**
   * Check if SMS service is available
   */
  static isServiceAvailable(): boolean {
    return enableRealSMS ? (twilioClient !== null) : true;
  }

  /**
   * Get service status
   */
  static getServiceStatus(): string {
    if (enableRealSMS) {
      return twilioClient ? 'Real SMS (Twilio)' : 'SMS Service Error';
    } else {
      return 'Development Mode';
    }
  }
}