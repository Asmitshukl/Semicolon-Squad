#!/bin/bash

# Complete Project Startup Script for Linux/macOS
# Run this script to start all services in separate terminal windows

# Colors for output
INFO_COLOR='\033[0;36m'    # Cyan
SUCCESS_COLOR='\033[0;32m' # Green
ERROR_COLOR='\033[0;31m'   # Red
WARNING_COLOR='\033[0;33m' # Yellow
NC='\033[0m' # No Color

echo -e "${INFO_COLOR}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${INFO_COLOR}║    NyayaSetu Semicolon Squad - Complete System Startup       ║${NC}"
echo -e "${INFO_COLOR}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the root directory
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start service in new terminal
start_service_terminal() {
    local service_name=$1
    local service_path=$2
    local command=$3
    local port=$4
    
    echo -e "${INFO_COLOR}Starting ${service_name}...${NC}"
    
    # Check if port is already in use
    if check_port $port; then
        echo -e "${WARNING_COLOR}⚠ Port ${port} is already in use. Make sure no other instance is running.${NC}"
    fi
    
    # Determine terminal application based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - use Terminal.app
        osascript <<EOF
            tell application "Terminal"
                do script "cd '$service_path' && $command"
            end tell
EOF
    else
        # Linux - use gnome-terminal, xterm, or tmux
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --working-directory="$service_path" -- bash -c "$command; bash"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd '$service_path' && $command" &
        elif command -v tmux &> /dev/null; then
            tmux new-window -n "$service_name" -c "$service_path"
            tmux send-keys -t "$service_name" "$command" Enter
        else
            # Fallback - just run in background
            (cd "$service_path" && eval "$command" &)
        fi
    fi
    
    echo -e "${SUCCESS_COLOR}✓ ${service_name} started in new window (Port: ${port})${NC}"
    sleep 2
}

# Check prerequisites
echo -e "${INFO_COLOR}Checking prerequisites...${NC}"
echo ""

NODE_CHECK=$(command -v node &> /dev/null && echo "true" || echo "false")
NPM_CHECK=$(command -v npm &> /dev/null && echo "true" || echo "false")
PYTHON_CHECK=$(command -v python3 &> /dev/null && echo "true" || echo "false")

echo -e "✓ Node.js installed: ${NODE_CHECK}"
echo -e "✓ npm installed: ${NPM_CHECK}"
echo -e "✓ Python installed: ${PYTHON_CHECK}"
echo ""

if [ "$NODE_CHECK" != "true" ] || [ "$NPM_CHECK" != "true" ] || [ "$PYTHON_CHECK" != "true" ]; then
    echo -e "${ERROR_COLOR}❌ Missing required dependencies!${NC}"
    echo -e "${WARNING_COLOR}Please install Node.js and Python before continuing.${NC}"
    exit 1
fi

echo -e "${INFO_COLOR}Starting all services...${NC}"
echo ""

# Start ML Service (Port 8000)
ML_SERVICE_PATH="$ROOT_DIR/ml-service"
ML_RUN_SCRIPT="$ML_SERVICE_PATH/run.sh"
if [ ! -f "$ML_RUN_SCRIPT" ]; then
    echo -e "${ERROR_COLOR}Error: ML service run script not found at $ML_RUN_SCRIPT${NC}"
    exit 1
fi
chmod +x "$ML_RUN_SCRIPT"
start_service_terminal "ML Service" "$ML_SERVICE_PATH" "$ML_RUN_SCRIPT" 8000

# Start Backend (Port 5000)
BACKEND_PATH="$ROOT_DIR/backend"
BACKEND_RUN_SCRIPT="$BACKEND_PATH/run.sh"
if [ ! -f "$BACKEND_RUN_SCRIPT" ]; then
    echo -e "${ERROR_COLOR}Error: Backend run script not found at $BACKEND_RUN_SCRIPT${NC}"
    exit 1
fi
chmod +x "$BACKEND_RUN_SCRIPT"
start_service_terminal "Backend API" "$BACKEND_PATH" "$BACKEND_RUN_SCRIPT" 5000

# Start Frontend (Port 5173)
FRONTEND_PATH="$ROOT_DIR/frontend"
FRONTEND_COMMAND="cd '$FRONTEND_PATH' && npm install && npm run dev"
start_service_terminal "Frontend" "$FRONTEND_PATH" "$FRONTEND_COMMAND" 5173

echo ""
echo -e "${SUCCESS_COLOR}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${SUCCESS_COLOR}║              All services started successfully!               ║${NC}"
echo -e "${SUCCESS_COLOR}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${INFO_COLOR}Service URLs:${NC}"
echo -e "  Frontend:    ${INFO_COLOR}http://localhost:5173${NC}"
echo -e "  Backend:     ${INFO_COLOR}http://localhost:5000${NC}"
echo -e "  ML Service:  ${INFO_COLOR}http://127.0.0.1:8000${NC}"
echo -e "  ML Docs:     ${INFO_COLOR}http://127.0.0.1:8000/docs${NC}"
echo ""
echo -e "${INFO_COLOR}Next steps:${NC}"
echo -e "  1. Open http://localhost:5173 in your browser"
echo -e "  2. Create an account and test the ML pipeline"
echo -e "  3. Check the SETUP_GUIDE.md for detailed instructions"
echo ""
echo -e "${WARNING_COLOR}To stop all services, terminate the terminal windows.${NC}"
echo ""
