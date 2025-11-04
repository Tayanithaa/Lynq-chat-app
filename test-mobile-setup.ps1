# Quick test to verify mobile setup is ready
Write-Host "`nMOBILE SETUP VERIFICATION" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# 1. Check server is running
Write-Host "`n[1] Checking if server is running..." -ForegroundColor Yellow
$serverRunning = Get-Process | Where-Object {$_.ProcessName -eq "node"} | Measure-Object
if ($serverRunning.Count -gt 0) {
    Write-Host "   [OK] Server is running ($($serverRunning.Count) process(es))" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Server not running" -ForegroundColor Red
    Write-Host "   --> Run: node simple-server.js" -ForegroundColor Yellow
}

# 2. Check firewall rule
Write-Host "`n[2] Checking firewall rule..." -ForegroundColor Yellow
try {
    $firewallCheck = netsh advfirewall firewall show rule name="Lynq Chat Server Port 3004" 2>&1 | Out-String
    if ($firewallCheck -like "*Enabled*Yes*") {
        Write-Host "   [OK] Firewall rule exists and is enabled" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Firewall rule exists but may not be enabled" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [FAIL] Firewall rule not found" -ForegroundColor Red
    Write-Host "   --> Right-click add-firewall-rule.ps1 and Run as Administrator" -ForegroundColor Yellow
}

# 3. Show current IP
Write-Host "`n[3] Your computer's IP address:" -ForegroundColor Yellow
$ip = (ipconfig | Select-String "IPv4" | Select-Object -First 1) -replace '.*: ', ''
Write-Host "   $ip" -ForegroundColor Cyan

# 4. Check .env file
Write-Host "`n[4] Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" | Select-String "EXPO_PUBLIC_API_BASE_URL" | Where-Object {$_ -notmatch "^#"} | Select-Object -First 1
    if ($envContent -match "localhost") {
        Write-Host "   [WARN] Using localhost (won't work on mobile)" -ForegroundColor Yellow
        Write-Host "   --> Update .env to use: http://$ip:3004" -ForegroundColor Yellow
    } elseif ($envContent -match "$ip") {
        Write-Host "   [OK] .env configured with correct IP" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] .env has different IP than current" -ForegroundColor Yellow
        Write-Host "   Current .env: $envContent" -ForegroundColor Gray
        Write-Host "   Your IP: $ip" -ForegroundColor Gray
    }
} else {
    Write-Host "   [FAIL] .env file not found" -ForegroundColor Red
}

# 5. Test health endpoint
Write-Host "`n[5] Testing server accessibility..." -ForegroundColor Yellow
try {
    $testIp = $ip.Trim()
    $health = Invoke-RestMethod -Uri "http://${testIp}:3004/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   [OK] Server responding!" -ForegroundColor Green
    Write-Host "      Status: $($health.status)" -ForegroundColor Gray
    Write-Host "      Messages: $($health.messages)" -ForegroundColor Gray
    Write-Host "      Users: $($health.users)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] Cannot reach server from network" -ForegroundColor Red
    Write-Host "   --> Check firewall and server status" -ForegroundColor Yellow
}

# 6. WiFi check
Write-Host "`n[6] WiFi Network:" -ForegroundColor Yellow
$wifiName = (netsh wlan show interfaces | Select-String "SSID" | Select-Object -First 1) -replace '.*: ', ''
if ($wifiName) {
    Write-Host "   Connected to: $wifiName" -ForegroundColor Cyan
    Write-Host "   --> Make sure your phone is on the SAME network!" -ForegroundColor Yellow
} else {
    Write-Host "   [WARN] Not connected to WiFi" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" -NoNewline
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`nTo connect from mobile:" -ForegroundColor White
Write-Host "1. Server URL: http://${testIp}:3004" -ForegroundColor Cyan
Write-Host "2. Make sure phone on WiFi: $wifiName" -ForegroundColor Cyan  
Write-Host "3. In phone browser, test: http://${testIp}:3004/health" -ForegroundColor Cyan
Write-Host "4. If that works, your app should work too!" -ForegroundColor Green
Write-Host ""

pause
