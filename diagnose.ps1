# Quick Diagnostic Script for Windows

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    NyayaSetu - Quick Diagnostics                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if services are running
Write-Host "Test 1: Checking if services are running..." -ForegroundColor Yellow
Write-Host ""

# ML Service
Write-Host "  ML Service Port 8000:" -ForegroundColor Cyan
$ml_port = Test-NetConnection -ComputerName 127.0.0.1 -Port 8000 -WarningAction SilentlyContinue
if ($ml_port.TcpTestSucceeded) {
    Write-Host "    ✓ Port 8000 is OPEN" -ForegroundColor Green
} else {
    Write-Host "    ❌ Port 8000 is CLOSED (ML service not running)" -ForegroundColor Red
}

# Backend
Write-Host "  Backend Port 5000:" -ForegroundColor Cyan
$backend_port = Test-NetConnection -ComputerName localhost -Port 5000 -WarningAction SilentlyContinue
if ($backend_port.TcpTestSucceeded) {
    Write-Host "    ✓ Port 5000 is OPEN" -ForegroundColor Green
} else {
    Write-Host "    ❌ Port 5000 is CLOSED (Backend not running)" -ForegroundColor Red
}

# Frontend
Write-Host "  Frontend Port 5173:" -ForegroundColor Cyan
$frontend_port = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue
if ($frontend_port.TcpTestSucceeded) {
    Write-Host "    ✓ Port 5173 is OPEN" -ForegroundColor Green
} else {
    Write-Host "    ❌ Port 5173 is CLOSED (Frontend not running)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test 2: Testing ML Service Health..." -ForegroundColor Yellow

if ($ml_port.TcpTestSucceeded) {
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  ✓ ML Service is responding!" -ForegroundColor Green
        Write-Host "    Status: $($response.status)" -ForegroundColor Green
        Write-Host "    Engine: $($response.engine)" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ ML Service not responding: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠ ML Service port is not open - service not running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Test 3: Checking Environment Variables..." -ForegroundColor Yellow

$env_file = "$PSScriptRoot\.env"
if (Test-Path $env_file) {
    Write-Host "  ✓ .env file exists" -ForegroundColor Green
    
    $ml_url = Select-String -Path $env_file -Pattern "ML_SERVICE_URL" | % { $_.Line }
    Write-Host "    $ml_url" -ForegroundColor Gray
    
    $timeout = Select-String -Path $env_file -Pattern "ML_SERVICE_TIMEOUT" | % { $_.Line }
    Write-Host "    $timeout" -ForegroundColor Gray
} else {
    Write-Host "  ❌ .env file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test 4: Checking for processes..." -ForegroundColor Yellow

$node_procs = Get-Process -Name "node" -ErrorAction SilentlyContinue
$python_procs = Get-Process -Name "python" -ErrorAction SilentlyContinue

Write-Host "  Node.js processes: $($node_procs.Count)" -ForegroundColor Cyan
Write-Host "  Python processes: $($python_procs.Count)" -ForegroundColor Cyan

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   Diagnostic Summary                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($ml_port.TcpTestSucceeded -and $backend_port.TcpTestSucceeded -and $frontend_port.TcpTestSucceeded) {
    Write-Host "✓ All services appear to be running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try these next:" -ForegroundColor Yellow
    Write-Host "  1. Refresh your browser (Ctrl+R)" -ForegroundColor Gray
    Write-Host "  2. Check browser console (F12) for errors" -ForegroundColor Gray
    Write-Host "  3. Make sure .env has correct ML_SERVICE_URL" -ForegroundColor Gray
} else {
    Write-Host "⚠ Some services are not running!" -ForegroundColor Red
    Write-Host ""
    if (-not $ml_port.TcpTestSucceeded) {
        Write-Host "ML Service (Port 8000) is not running:" -ForegroundColor Red
        Write-Host "  • Check if the ML service terminal is open" -ForegroundColor Gray
        Write-Host "  • Look for error messages in the terminal" -ForegroundColor Gray
        Write-Host "  • Try running: cd ml-service && .\run.ps1" -ForegroundColor Gray
    }
    if (-not $backend_port.TcpTestSucceeded) {
        Write-Host "Backend (Port 5000) is not running:" -ForegroundColor Red
        Write-Host "  • Check if the backend terminal is open" -ForegroundColor Gray
        Write-Host "  • Look for error messages in the terminal" -ForegroundColor Gray
        Write-Host "  • Try running: cd backend && .\run.ps1" -ForegroundColor Gray
    }
    if (-not $frontend_port.TcpTestSucceeded) {
        Write-Host "Frontend (Port 5173) is not running:" -ForegroundColor Red
        Write-Host "  • Check if the frontend terminal is open" -ForegroundColor Gray
        Write-Host "  • Look for error messages in the terminal" -ForegroundColor Gray
        Write-Host "  • Try running: cd frontend && npm run dev" -ForegroundColor Gray
    }
}

Write-Host ""
