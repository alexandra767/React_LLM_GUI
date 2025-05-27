#!/bin/bash

# Sephia Launcher Script

# Set up environment
export PATH="/Users/alexandratitus767/.nvm/versions/node/v22.16.0/bin:$PATH"
export NVM_DIR="$HOME/.nvm"

# Change to project directory
cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI

# Kill any existing processes on port 3000
echo "Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Kill any existing Electron processes
pkill -f "Electron.*sephia" 2>/dev/null || true
pkill -f "electron.*sephia" 2>/dev/null || true

# Wait a moment for ports to clear
sleep 1

# Start the app
echo "Starting Sephia..."
npm run electron:dev