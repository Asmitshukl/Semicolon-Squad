#!/bin/bash

# Backend Service Startup Script for Linux/macOS

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to backend directory
cd "$SCRIPT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the TypeScript
echo "Building TypeScript..."
npm run build

# Run database migrations
echo "Pushing database schema..."
npm run prisma:push

# Create admin user (optional)
echo ""
echo "Creating default admin user..."
npm run create:admin
echo "Default admin login: admin@example.com / StrongPass123"

# Start the backend service
echo ""
echo "Starting backend service on http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo ""

# Run the server
npm start
