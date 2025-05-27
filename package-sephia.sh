#!/bin/bash

echo "🧠⚡ Packaging Sephia..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules not found!${NC}"
    echo "Running npm install..."
    npm install
fi

# Build the React app
echo -e "${YELLOW}📦 Building React app...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ React build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ React build complete${NC}"

# Package with Electron
echo -e "${YELLOW}📦 Packaging with Electron...${NC}"
npm run electron:build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Electron packaging failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Packaging complete!${NC}"
echo ""

# Show the output
echo -e "${GREEN}🎉 Your Sephia app is ready!${NC}"
echo ""
echo "📁 Output location: ./dist/"
echo ""

# List the generated files
if [ -d "dist" ]; then
    echo "Generated files:"
    ls -la dist/*.dmg dist/*.zip dist/*.exe dist/*.AppImage dist/*.deb 2>/dev/null | grep -v "cannot access"
fi

echo ""
echo "To run the app:"
echo "  • macOS: Open the .dmg file and drag Sephia to Applications"
echo "  • Windows: Run the .exe installer"
echo "  • Linux: Run the .AppImage file"
echo ""
echo "🧠⚡ Enjoy Sephia!"