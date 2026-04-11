# Complete Fix for ML Integration - Run this to fix everything!

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    NyayaSetu - Complete Integration Fix                     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANT: Close all service terminals before continuing!" -ForegroundColor Yellow
Write-Host "This script will:" -ForegroundColor Cyan
Write-Host "  1. Kill any running services" -ForegroundColor Gray
Write-Host "  2. Clean up ML service virtual environment" -ForegroundColor Gray
Write-Host "  3. Reinstall all dependencies" -ForegroundColor Gray
Write-Host "  4. Restart all services" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Continue? (yes/no)"
if ($response -ne "yes") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1: Killing existing processes..." -ForegroundColor Yellow

# Kill any node processes
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcs) {
    Write-Host "  Stopping Node.js processes..." -ForegroundColor Gray
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Kill any python processes
$pythonProcs = Get-Process -Name "python*" -ErrorAction SilentlyContinue
if ($pythonProcs) {
    Write-Host "  Stopping Python processes..." -ForegroundColor Gray
    Stop-Process -Name "python*" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "✓ Processes stopped" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Cleaning up ML service..." -ForegroundColor Yellow
$mlServicePath = "$PSScriptRoot\ml-service"
$venvPath = Join-Path $mlServicePath "venv"

if (Test-Path $venvPath) {
    Write-Host "  Removing old virtual environment..." -ForegroundColor Gray
    Remove-Item -Path $venvPath -Recurse -Force
    Start-Sleep -Seconds 1
    Write-Host "  ✓ Virtual environment removed" -ForegroundColor Green
} else {
    Write-Host "  No virtual environment to clean" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 3: Verifying configuration..." -ForegroundColor Yellow

# Check .env file
$envPath = "$PSScriptRoot\.env"
if (Test-Path $envPath) {
    Write-Host "  ✓ .env file exists" -ForegroundColor Green
    
    # Check for correct ML_SERVICE_URL
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match 'ML_SERVICE_URL="http://127\.0\.0\.1:8000"') {
        Write-Host "  ✓ ML_SERVICE_URL is correct" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ ML_SERVICE_URL might be incorrect" -ForegroundColor Yellow
        Write-Host "    Setting correct value..." -ForegroundColor Gray
        
        $newContent = $envContent -replace 'ML_SERVICE_URL="[^"]*"', 'ML_SERVICE_URL="http://127.0.0.1:8000"'
        Set-Content -Path $envPath -Value $newContent
        Write-Host "    ✓ ML_SERVICE_URL fixed" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Starting ML Service..." -ForegroundColor Yellow
Write-Host "  (This will take 2-3 minutes on first run)" -ForegroundColor Gray
Write-Host ""

$mlRunScript = Join-Path $mlServicePath "run.ps1"
if (Test-Path $mlRunScript) {
    # Start ML service in a new window
    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$mlServicePath'; & '.\run.ps1'"
    ) -WindowStyle Normal
    
    Write-Host "✓ ML Service window opened" -ForegroundColor Green
    Write-Host "  Waiting for ML service to start (30 seconds)..." -ForegroundColor Gray
    
    # Wait for ML service to be ready
    $attempts = 0
    $maxAttempts = 30
    $mlReady = $false
    
    while ($attempts -lt $maxAttempts) {
        try {
            $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2 -ErrorAction Stop
            Write-Host "  ✓ ML Service is ready!" -ForegroundColor Green
            $mlReady = $true
            break
        } catch {
            $attempts++
            Write-Host "    Waiting... ($attempts/$maxAttempts)" -ForegroundColor Gray
            Start-Sleep -Seconds 1
        }
    }
    
    if (-not $mlReady) {
        Write-Host "  ⚠ ML Service is still starting (this is OK)" -ForegroundColor Yellow
        Write-Host "    Check the ML Service window for status" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ run.ps1 not found in ml-service directory" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 5: Starting Backend..." -ForegroundColor Yellow
$backendPath = "$PSScriptRoot\backend"
$backendRunScript = Join-Path $backendPath "run.ps1"

if (Test-Path $backendRunScript) {
    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$backendPath'; & '.\run.ps1'"
    ) -WindowStyle Normal
    
    Write-Host "✓ Backend window opened" -ForegroundColor Green
    Start-Sleep -Seconds 3
} else {
    Write-Host "⚠ Backend run.ps1 not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 6: Starting Frontend..." -ForegroundColor Yellow
$frontendPath = "$PSScriptRoot\frontend"

$frontendCmd = @"
Set-Location '$frontendPath'
Write-Host 'Installing frontend dependencies (if needed)...' -ForegroundColor Cyan
if (-not (Test-Path 'node_modules')) {
    npm install
}
Write-Host 'Starting frontend development server...' -ForegroundColor Green
npm run dev
"@

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    $frontendCmd
) -WindowStyle Normal

Write-Host "✓ Frontend window opened" -ForegroundColor Green
Write-Host ""

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                   All Services Started!                      ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:         http://localhost:5173" -ForegroundColor Gray
Write-Host "  Backend:          http://localhost:5000" -ForegroundColor Gray
Write-Host "  ML Service:       http://127.0.0.1:8000" -ForegroundColor Gray
Write-Host "  ML Docs:          http://127.0.0.1:8000/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 30-60 seconds for all services to fully start" -ForegroundColor Gray
Write-Host "  2. Open http://localhost:5173 in your browser" -ForegroundColor Gray
Write-Host "  3. Register a new victim account" -ForegroundColor Gray
Write-Host "  4. Test the complaint submission" -ForegroundColor Gray
Write-Host ""
Write-Host "🔍 If you still see errors:" -ForegroundColor Yellow
Write-Host "  1. Check the service windows for error messages" -ForegroundColor Gray
Write-Host "  2. Run .\diagnose.ps1 to check service status" -ForegroundColor Gray
Write-Host "  3. Run .\test-ml-integration.ps1 to test ML endpoints" -ForegroundColor Gray
Write-Host ""
Write-Host "This window will close automatically..." -ForegroundColor Gray
Start-Sleep -Seconds 5
