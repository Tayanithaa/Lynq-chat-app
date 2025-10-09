import { Request, Response } from "express";

// Mock user database (in production, use real database)
const registeredUsers = new Set([
  '+1234567890',
  '+9876543210',
  '+1555123456',
  '+4471234567',
  // Add more mock registered numbers
]);

export interface ContactCheckRequest {
  phoneNumbers: string[];
}

export interface ContactCheckResponse {
  success: boolean;
  registeredNumbers: string[];
  totalChecked: number;
  registeredCount: number;
}

/**
 * Check which phone numbers are registered users
 */
export const checkRegisteredContacts = async (req: Request, res: Response) => {
  try {
    const { phoneNumbers }: ContactCheckRequest = req.body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({
        success: false,
        error: "Phone numbers array is required"
      });
    }

    console.log(`🔍 Checking ${phoneNumbers.length} phone numbers for registration status`);

    // Filter out invalid phone numbers
    const validPhoneNumbers = phoneNumbers.filter(phone => 
      typeof phone === 'string' && phone.trim().length > 0
    );

    // Check which numbers are registered
    const registeredNumbers = validPhoneNumbers.filter(phone => 
      registeredUsers.has(phone.trim())
    );

    console.log(`✅ Found ${registeredNumbers.length} registered users out of ${validPhoneNumbers.length} checked`);

    const response: ContactCheckResponse = {
      success: true,
      registeredNumbers,
      totalChecked: validPhoneNumbers.length,
      registeredCount: registeredNumbers.length
    };

    res.json(response);

  } catch (error) {
    console.error("❌ Error checking registered contacts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check registered contacts"
    });
  }
};

/**
 * Add a user to registered users (for testing)
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required"
      });
    }

    const cleanPhone = phoneNumber.trim();
    registeredUsers.add(cleanPhone);

    console.log(`✅ Added ${cleanPhone} to registered users`);

    res.json({
      success: true,
      message: "User registered successfully",
      phoneNumber: cleanPhone
    });

  } catch (error) {
    console.error("❌ Error registering user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register user"
    });
  }
};

/**
 * Get all registered users count (for admin)
 */
export const getRegisteredUsersCount = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      totalRegisteredUsers: registeredUsers.size,
      // Don't expose actual phone numbers for privacy
    });
  } catch (error) {
    console.error("❌ Error getting registered users count:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get registered users count"
    });
  }
};