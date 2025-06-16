#!/bin/bash

echo "🧠⚡ Starting Sephia..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if build exists
if [ ! -d "build" ]; then
    echo "Building React app..."
    npm run build
fi

# Start the app
echo "Launching Sephia..."
npm run electron:start