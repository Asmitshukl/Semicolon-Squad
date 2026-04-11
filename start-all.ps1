# Complete Project Startup Script for Windows
# Run this script to start all services in separate terminals

# Define colors for output
$infoColor = 'Cyan'
$successColor = 'Green'
$errorColor = 'Red'
$warningColor = 'Yellow'

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $infoColor
Write-Host "║    NyayaSetu Semicolon Squad - Complete System Startup       ║" -ForegroundColor $infoColor
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $infoColor
Write-Host ""

# Get the root directory
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = @(Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -WarningAction SilentlyContinue)
    return $connection.TcpTestSucceeded
}

# Function to start process in new terminal
function Start-ServiceTerminal {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "Starting $ServiceName..." -ForegroundColor $infoColor
    
    # Check if port is already in use
    if ($Port -gt 0 -and (Test-Port $Port)) {
        Write-Host "⚠ Port $Port is already in use. Make sure no other instance is running." -ForegroundColor $warningColor
    }
    
    # Start in new PowerShell window
    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$ServicePath'; & $Command"
    ) -WindowStyle Normal
    
    Write-Host "✓ $ServiceName started in new window (Port: $Port)" -ForegroundColor $successColor
    Start-Sleep -Seconds 2
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor $infoColor
Write-Host ""

$nodeCheck = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
$npmCheck = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)
$pythonCheck = $null -ne (Get-Command python -ErrorAction SilentlyContinue)

Write-Host "✓ Node.js installed: $nodeCheck" -ForegroundColor $(if($nodeCheck) {'Green'} else {'Red'})
Write-Host "✓ npm installed: $npmCheck" -ForegroundColor $(if($npmCheck) {'Green'} else {'Red'})
Write-Host "✓ Python installed: $pythonCheck" -ForegroundColor $(if($pythonCheck) {'Green'} else {'Red'})
Write-Host ""

if (-not ($nodeCheck -and $npmCheck -and $pythonCheck)) {
    Write-Host "❌ Missing required dependencies!" -ForegroundColor $errorColor
    Write-Host "Please install Node.js and Python before continuing." -ForegroundColor $warningColor
    exit 1
}

Write-Host "Starting all services..." -ForegroundColor $infoColor
Write-Host ""

# Start ML Service (Port 8000)
$mlServicePath = Join-Path $rootDir "ml-service"
$mlRunScript = Join-Path $mlServicePath "run.ps1"
Start-ServiceTerminal "ML Service" $mlServicePath $mlRunScript 8000

# Start Backend (Port 5000)
$backendPath = Join-Path $rootDir "backend"
$backendRunScript = Join-Path $backendPath "run.ps1"
Start-ServiceTerminal "Backend API" $backendPath $backendRunScript 5000

# Start Frontend (Port 5173)
$frontendPath = Join-Path $rootDir "frontend"
$frontendRunScript = @"
Set-Location '$frontendPath'
Write-Host 'Frontend directory: $frontendPath' -ForegroundColor Green
Write-Host 'Installing dependencies (if needed)...' -ForegroundColor Cyan

if (-not (Test-Path 'node_modules')) {
    npm install
}

Write-Host 'Starting frontend development server...' -ForegroundColor Green
npm run dev
"@
Start-ServiceTerminal "Frontend" $frontendPath $frontendRunScript 5173

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $successColor
Write-Host "║              All services started successfully!               ║" -ForegroundColor $successColor
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $successColor
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor $infoColor
Write-Host "  Frontend:    http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:     http://localhost:5000" -ForegroundColor Cyan
Write-Host "  ML Service:  http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  ML Docs:     http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor $infoColor
Write-Host "  1. Open http://localhost:5173 in your browser" -ForegroundColor Cyan
Write-Host "  2. Create an account and test the ML pipeline" -ForegroundColor Cyan
Write-Host "  3. Check the SETUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services, close the terminal windows." -ForegroundColor $warningColor
Write-Host ""
