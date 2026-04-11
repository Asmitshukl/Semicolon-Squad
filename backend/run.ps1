# Backend Service Startup Script for Windows

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Change to backend directory
Set-Location $scriptDir

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Build the TypeScript
Write-Host "Building TypeScript..."
npm run build

# Run database migrations
Write-Host "Pushing database schema..."
npm run prisma:push

# Create admin user (optional)
Write-Host ""
Write-Host "Creating default admin user..."
npm run create:admin

# Start the backend service
Write-Host ""
Write-Host "Starting backend service on http://localhost:5000"
Write-Host "Press Ctrl+C to stop the server"
Write-Host ""

# Run the server
npm start
