# ML Service Startup Script for Windows - FIXED VERSION

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         ML Service Startup (FastAPI - Vihaan ML)            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
$pythonCheck = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCheck) {
    Write-Host "❌ Python is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from https://www.python.org/" -ForegroundColor Yellow
    exit 1
}

# Get Python version
$pythonVersion = python --version 2>&1
Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Working directory: $scriptDir" -ForegroundColor Gray

# Change to ML service directory
Set-Location $scriptDir

# Check if venv exists, if not create it
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".\venv\Scripts\Activate.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Virtual environment activated" -ForegroundColor Green
Write-Host ""

# Install/upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip 2>&1 | Out-Null

# Install required packages
Write-Host "Installing Python dependencies from requirements.txt..." -ForegroundColor Yellow
if (-not (Test-Path "requirements.txt")) {
    Write-Host "❌ requirements.txt not found!" -ForegroundColor Red
    exit 1
}

pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Error output above should show what failed" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Verify FastAPI and Uvicorn are installed
Write-Host "Verifying installations..." -ForegroundColor Cyan
$fastapiCheck = pip show fastapi 2>&1 | Select-String "Name: fastapi"
$uvicornCheck = pip show uvicorn 2>&1 | Select-String "Name: uvicorn"

if ($fastapiCheck) {
    Write-Host "  ✓ FastAPI is installed" -ForegroundColor Green
} else {
    Write-Host "  ❌ FastAPI is NOT installed" -ForegroundColor Red
}

if ($uvicornCheck) {
    Write-Host "  ✓ Uvicorn is installed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Uvicorn is NOT installed" -ForegroundColor Red
}
Write-Host ""

# Check if main.py exists
if (-not (Test-Path "main.py")) {
    Write-Host "❌ main.py not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ main.py found" -ForegroundColor Green

# Check if model directory exists
if (-not (Test-Path "Vihaan-ML-2")) {
    Write-Host "⚠ Warning: Vihaan-ML-2 model directory not found" -ForegroundColor Yellow
    Write-Host "  ML service will use fallback heuristics mode" -ForegroundColor Yellow
    Write-Host "  For full ML capabilities, obtain the Vihaan-ML-2 package" -ForegroundColor Yellow
} else {
    Write-Host "✓ Vihaan-ML-2 model directory found" -ForegroundColor Green
}
Write-Host ""

# Start the ML service
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Starting ML Service...                          ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Service will be available at:" -ForegroundColor Cyan
Write-Host "  🌐 API:            http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  📚 Swagger Docs:   http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "  📋 ReDoc:          http://127.0.0.1:8000/redoc" -ForegroundColor Cyan
Write-Host "  ❤️  Health Check:   http://127.0.0.1:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run uvicorn with error handling
Write-Host "Launching uvicorn..." -ForegroundColor Gray
Write-Host ""

uvicorn main:app --host 127.0.0.1 --port 8000 --reload --log-level info

# If we get here, uvicorn exited
Write-Host ""
Write-Host "ML Service has stopped" -ForegroundColor Yellow
exit 0
