# 📱 Mobile Setup Guide - Fix Login Error

## Problem
Login works on web but fails on mobile with error: "Cannot connect to server"

## Root Cause
The `.env` file was set to `localhost:3004` which only works on the same computer. Mobile phones need your computer's actual IP address.

## ✅ Solution Applied

### 1. Updated `.env` File
Changed from:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3004
```

To your computer's IP:
```
EXPO_PUBLIC_API_BASE_URL=http://10.179.108.55:3004
```

### 2. Added Windows Firewall Rule
Mobile phones need firewall access to connect to port 3004.

**To add the firewall rule:**
```powershell
# Right-click on add-firewall-rule.ps1 → Run as Administrator
```

Or manually:
```powershell
# Open PowerShell as Administrator and run:
netsh advfirewall firewall add rule name="Lynq Chat Server Port 3004" dir=in action=allow protocol=TCP localport=3004
```

### 3. Improved Error Messages
Added helpful error messages in AuthContext to guide users if connection fails.

---

## 🚀 How to Test on Mobile

### Step 1: Make Sure Server is Running
```powershell
cd c:\Users\Tayanithaa.N.S\lynq-chat
node simple-server.js
```

You should see:
```
🔥 Firebase Admin initialized successfully
🚀 Encrypted chat server running on port 3004
```

### Step 2: Add Firewall Rule (One Time Only)
Right-click `add-firewall-rule.ps1` → **Run as Administrator**

### Step 3: Restart Expo
Stop and restart Expo to pick up the new `.env` settings:
```powershell
# Press Ctrl+C to stop if running
npx expo start
```

### Step 4: Connect Your Phone
1. **Make sure your phone is on the SAME WiFi network as your computer**
2. Scan the QR code in Expo
3. App will open on your phone

### Step 5: Try Login
1. Username: `testuser1` (or any username)
2. Password: `password123` (or any password 4+ chars)
3. Tap **Login**
4. ✅ Should work now!

---

## 🔍 Troubleshooting

### Error: "Cannot connect to server"

**Check 1: Are you on the same WiFi?**
- Phone and computer MUST be on same WiFi network
- Corporate/school networks may block device-to-device communication

**Check 2: Is the server running?**
```powershell
# Should show server running on port 3004
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

**Check 3: Can you reach the server?**
Open your phone's browser and go to:
```
http://10.179.108.55:3004/health
```

You should see:
```json
{"status":"OK","messages":0,"users":0,...}
```

**Check 4: Is firewall blocking?**
```powershell
# Check if rule exists
netsh advfirewall firewall show rule name="Lynq Chat Server Port 3004"
```

Should show: `Enabled: Yes`

**Check 5: IP address changed?**
If your computer's IP changed (e.g., reconnected to WiFi):

1. Get new IP:
   ```powershell
   ipconfig | Select-String "IPv4"
   ```

2. Update `.env`:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_NEW_IP:3004
   EXPO_PUBLIC_SOCKET_URL=http://YOUR_NEW_IP:3004
   ```

3. Restart Expo:
   ```powershell
   npx expo start
   ```

---

## 📋 Quick Checklist

Before testing on mobile:
- [ ] Server is running (`node simple-server.js`)
- [ ] Firewall rule added (`add-firewall-rule.ps1` as Admin)
- [ ] `.env` has computer's IP (not localhost)
- [ ] Expo restarted after `.env` change
- [ ] Phone on same WiFi network
- [ ] Can access `http://10.179.108.55:3004/health` in phone browser

---

## 🎯 Expected Behavior After Fix

### On Mobile:
1. Open app
2. Tap Login
3. Enter username/password
4. **Success!** → Navigates to chat screen
5. See "Online" tab with green dots
6. Can send/receive messages in real-time

### On Web (Browser):
To test on web again, change `.env` back to localhost:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3004
EXPO_PUBLIC_SOCKET_URL=http://localhost:3004
```

Or just use your IP (works for both):
```
EXPO_PUBLIC_API_BASE_URL=http://10.179.108.55:3004
EXPO_PUBLIC_SOCKET_URL=http://10.179.108.55:3004
```

---

## 🔥 Common Issues

### "Network request failed"
- Server not running
- Wrong IP in `.env`
- Not on same WiFi

### "Connection refused"
- Firewall blocking
- Port 3004 already in use
- Server crashed

### "Invalid credentials"
- Server IS working! This is a different error
- Just means username/password wrong
- Try creating new account or use test credentials

---

## ✨ Quick Test Script

Run this to verify everything is set up:

```powershell
# 1. Check server is running
$serverRunning = Get-Process | Where-Object {$_.ProcessName -eq "node"} | Measure-Object
if ($serverRunning.Count -gt 0) {
    Write-Host "✅ Server is running" -ForegroundColor Green
} else {
    Write-Host "❌ Server not running. Run: node simple-server.js" -ForegroundColor Red
}

# 2. Check firewall rule
$firewallRule = netsh advfirewall firewall show rule name="Lynq Chat Server Port 3004" 2>&1
if ($firewallRule -like "*Enabled*Yes*") {
    Write-Host "✅ Firewall rule exists" -ForegroundColor Green
} else {
    Write-Host "❌ Firewall rule missing. Run add-firewall-rule.ps1 as Admin" -ForegroundColor Red
}

# 3. Show current IP
Write-Host "`nYour computer's IP address:" -ForegroundColor Cyan
ipconfig | Select-String "IPv4" | Select-Object -First 1

# 4. Test health endpoint
Write-Host "`nTesting server health..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://10.179.108.55:3004/health" -UseBasicParsing
    Write-Host "✅ Server responding: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Server not accessible from network" -ForegroundColor Red
}
```

Save this as `test-mobile-setup.ps1` and run it.

---

**After following these steps, your mobile login should work!** 🎉
