# Add Windows Firewall rule for Node.js server on port 3004
# Run this script as Administrator

Write-Host "Adding Windows Firewall rule for port 3004..." -ForegroundColor Yellow

try {
    # Add inbound rule
    netsh advfirewall firewall add rule name="Lynq Chat Server Port 3004" dir=in action=allow protocol=TCP localport=3004
    
    Write-Host "`n✅ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host "Your mobile phone should now be able to connect to the server.`n" -ForegroundColor Green
    
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure server is running: node simple-server.js" -ForegroundColor White
    Write-Host "2. Make sure phone is on same WiFi network" -ForegroundColor White
    Write-Host "3. Restart Expo: npx expo start" -ForegroundColor White
    Write-Host "4. Try logging in from your phone`n" -ForegroundColor White
}
catch {
    Write-Host "`n❌ Failed to add firewall rule: $_" -ForegroundColor Red
    Write-Host "Please run this script as Administrator (right-click → Run as Administrator)`n" -ForegroundColor Yellow
}

pause
