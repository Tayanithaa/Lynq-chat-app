# 🚀 Lynq Real OTP & Contact Sync Setup Guide

## 📱 **Real SMS OTP Integration**

### **1. Get Twilio Account (Free Trial Available)**

1. **Sign up at [Twilio](https://www.twilio.com/try-twilio)**
2. **Get your credentials:**
   - Account SID
   - Auth Token  
   - Phone Number (Twilio provides one)

### **2. Configure Backend Environment**

Edit `backend/.env`:

```bash
# Enable Real SMS
ENABLE_REAL_SMS=true

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### **3. Start Backend Server**

```bash
cd backend
npm run build
npm start
```

Server runs on: `http://localhost:3004`

## 👥 **Contact Synchronization**

### **Features Implemented:**

✅ **Real-time contact access** - Uses Expo Contacts API
✅ **Permission handling** - Requests contacts permission properly  
✅ **Phone number validation** - Validates international formats
✅ **Backend registration check** - Verifies which contacts use Lynq
✅ **Local storage** - Caches synced contacts for offline access
✅ **Automatic sync** - Syncs on app start and manual refresh
✅ **Privacy-focused** - Only processes phone numbers, respects permissions

### **How It Works:**

1. **Permission Request** → App asks for contacts access
2. **Contact Extraction** → Reads device contacts with phone numbers
3. **Format & Validate** → Cleans and validates phone numbers
4. **Backend Check** → Calls `/api/contacts/check` to find registered users
5. **Local Storage** → Saves results for offline access
6. **UI Display** → Shows registered vs non-registered contacts

## 🔧 **API Endpoints Added**

### **OTP Endpoints (Enhanced)**
- `POST /api/otp/send` - Send real SMS OTP
- `POST /api/otp/verify` - Verify OTP code  
- `POST /api/otp/resend` - Resend OTP

### **Contact Endpoints (New)**
- `POST /api/contacts/check` - Check registered phone numbers
- `POST /api/contacts/register` - Register new user
- `GET /api/contacts/stats` - Get registration statistics

## 📄 **Usage Examples**

### **Send Real OTP:**
```bash
curl -X POST http://localhost:3004/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

### **Check Registered Contacts:**
```bash
curl -X POST http://localhost:3004/api/contacts/check \
  -H "Content-Type: application/json" \
  -d '{"phoneNumbers": ["+1234567890", "+9876543210"]}'
```

## 🎯 **Frontend Integration**

### **Access Contacts Screen:**
Navigate to `/contacts` in your app to see:
- All synced contacts
- Who's registered on Lynq
- Sync status and statistics
- Chat/invite buttons

### **OTP Flow:**
1. User enters phone number
2. Real SMS sent via Twilio
3. User enters received OTP
4. Verification happens server-side
5. Success → App continues

## 🔐 **Security Features**

✅ **OTP Expiry** - 5 minutes (configurable)
✅ **Attempt Limiting** - Max 3 attempts per OTP
✅ **Phone Validation** - International format required
✅ **Rate Limiting** - Prevents spam
✅ **Privacy Protection** - No phone numbers logged in production

## 📊 **Development vs Production**

### **Development Mode** (`ENABLE_REAL_SMS=false`)
- OTP logged to console (no real SMS)
- Mock registered users for testing
- Faster development cycle

### **Production Mode** (`ENABLE_REAL_SMS=true`)
- Real SMS via Twilio
- Database-backed user registration
- Full security measures

## 🚨 **Troubleshooting**

### **SMS Not Sending:**
1. Check Twilio credentials in `.env`
2. Verify phone number format (+country code)
3. Check Twilio console for errors
4. Ensure account has SMS credits

### **Contacts Not Syncing:**
1. Check device permissions
2. Verify backend is running on port 3004
3. Check console logs for API errors
4. Try manual sync from contacts screen

### **Backend Issues:**
1. Run `npm run build` after code changes
2. Check `.env` file configuration
3. Verify port 3004 is available
4. Check console for error messages

## 💡 **Next Steps**

1. **Production Database** - Replace in-memory storage with Redis/PostgreSQL
2. **Push Notifications** - Notify when contacts join Lynq  
3. **Batch Operations** - Optimize large contact syncs
4. **Social Features** - Contact invitations, friend requests
5. **Analytics** - Track sync patterns and registration rates

---

## 🎉 **You're All Set!**

Your Lynq app now has:
- **Real SMS OTP verification** 📱
- **Complete contact synchronization** 👥  
- **Production-ready architecture** 🏗️
- **Privacy-focused design** 🔐

Start the backend server and test the features!