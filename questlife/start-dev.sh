#!/bin/bash

# QuestLife Development Server Startup Script
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=5173
BACKEND_PORT=3000
PROJECT_NAME="QuestLife"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      ${PROJECT_NAME} Development Server      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}⚠️  Killing process on port $port (PID: $pids)${NC}"
        kill -9 $pids 2>/dev/null || true
        sleep 1
    fi
}

# Function to wait for server
wait_for_server() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for $name to start...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        response=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null)
        if [ "$response" = "200" ] || [ "$response" = "304" ]; then
            echo -e "${GREEN}✅ $name is running!${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $name failed to start after $max_attempts seconds${NC}"
    return 1
}

# Check Node.js and npm
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) installed${NC}"
echo -e "${GREEN}✅ npm $(npm -v) installed${NC}"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found in root directory${NC}"
    echo -e "${YELLOW}   Please ensure environment variables are configured${NC}"
fi

if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found in server directory${NC}"
    echo -e "${YELLOW}   Server may not start properly without environment variables${NC}"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# Initialize database if needed
if [ ! -f "server/data/questlife.db" ]; then
    echo -e "${BLUE}🗄️  Initializing database...${NC}"
    npm run db:init
    echo -e "${GREEN}✅ Database initialized${NC}"
    echo ""
fi

# Check and handle port conflicts
echo -e "${BLUE}🔍 Checking ports...${NC}"

if check_port $BACKEND_PORT; then
    echo -e "${YELLOW}⚠️  Port $BACKEND_PORT is already in use${NC}"
    read -p "Kill the process and continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port $BACKEND_PORT
    else
        echo -e "${RED}❌ Cannot start backend server. Port $BACKEND_PORT is in use${NC}"
        exit 1
    fi
fi

if check_port $FRONTEND_PORT; then
    echo -e "${YELLOW}⚠️  Port $FRONTEND_PORT is already in use${NC}"
    read -p "Kill the process and continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port $FRONTEND_PORT
    else
        echo -e "${YELLOW}ℹ️  Frontend will use a different port${NC}"
    fi
fi

echo -e "${GREEN}✅ Ports are ready${NC}"
echo ""

# Start servers
echo -e "${BLUE}🚀 Starting development servers...${NC}"
echo -e "${YELLOW}   Frontend will run on: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${YELLOW}   Backend will run on:  http://localhost:$BACKEND_PORT${NC}"
echo ""

# Trap to handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"; kill_port $FRONTEND_PORT; kill_port $BACKEND_PORT; exit 0' INT TERM

# Start the development servers
npm run dev &
DEV_PID=$!

# Wait for servers to start
sleep 3
wait_for_server "http://localhost:$BACKEND_PORT/api/health" "Backend server"

# Get the actual frontend port (in case it changed)
ACTUAL_FRONTEND_PORT=$(lsof -nP -iTCP -sTCP:LISTEN | grep node | grep -E '517[0-9]' | awk '{print $9}' | cut -d: -f2 | head -1)
if [ ! -z "$ACTUAL_FRONTEND_PORT" ]; then
    FRONTEND_PORT=$ACTUAL_FRONTEND_PORT
fi

wait_for_server "http://localhost:$FRONTEND_PORT" "Frontend server"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     🎮 QuestLife is ready! 🎮         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📱 Frontend: ${NC}http://localhost:$FRONTEND_PORT"
echo -e "${BLUE}🔧 Backend:  ${NC}http://localhost:$BACKEND_PORT"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running
wait $DEV_PID