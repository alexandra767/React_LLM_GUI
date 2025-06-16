#!/bin/bash

# Setup NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Change to project directory
cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI

# Run Electron
exec node ./node_modules/.bin/electron electron-prod.js
