// This file is required by electron-builder
// It's a placeholder that points to the main electron process
const { app } = require('electron');
const path = require('path');

// This will be called by electron-builder
app.whenReady().then(() => {
  // The actual main process is loaded from electron/main.js
  require(path.join(__dirname, '../electron/main.js'));
});
