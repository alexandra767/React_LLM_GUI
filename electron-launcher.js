#!/usr/bin/env node

// Sephia Electron Launcher
const { spawn } = require('child_process');
const path = require('path');

// Set process title
process.title = 'Sephia';

// Change to project directory
process.chdir(__dirname);

// Start electron with proper app name
const electron = spawn('npm', ['run', 'electron:dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_FORCE_WINDOW_MENU_BAR: 'false'
  }
});

electron.on('close', (code) => {
  process.exit(code);
});