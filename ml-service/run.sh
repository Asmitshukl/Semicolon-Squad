#!/bin/bash

# ML Service Startup Script for Linux/macOS

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.10+ and try again."
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to ML service directory
cd "$SCRIPT_DIR"

# Check if venv exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/upgrade pip
echo "Installing pip dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if model directory exists
if [ ! -d "Vihaan-ML-2" ]; then
    echo "Warning: Vihaan-ML-2 model directory not found. ML service will use fallback mode."
    echo "To enable full ML capabilities, obtain the Vihaan-ML-2 model package."
fi

# Start the ML service
echo "Starting ML service on http://127.0.0.1:8000"
echo "API Documentation: http://127.0.0.1:8000/docs"
echo "Health Check: http://127.0.0.1:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run uvicorn
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
