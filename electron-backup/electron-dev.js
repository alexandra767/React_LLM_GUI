const electron = require('electron');
const { app, BrowserWindow, protocol } = electron;
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1E1E1E',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron', 'preload.js'),
      devTools: true
    },
    frame: true,
    titleBarStyle: 'default',
    movable: true
  });

  // Add a content security policy to allow loading resources including Google Fonts
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data:; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' data: https://fonts.gstatic.com; " +
          "img-src 'self' data:; " +
          "connect-src 'self' http://localhost:* https://fonts.googleapis.com https://fonts.gstatic.com;"
        ]
      }
    });
  });

  // Load the app from the development server
  mainWindow.loadURL('http://localhost:3000');
  
  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();
  
  // Check if the page loaded successfully
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Development page loaded successfully');
  });
  
  // Check for load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load development server:', errorCode, errorDescription);
    console.log('Attempting to reload...');
    setTimeout(() => mainWindow.loadURL('http://localhost:3000'), 5000);
  });

  return mainWindow;
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Register file protocol handler for local file access
  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''));
    callback(pathname);
  });
  
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the
    // dock icon is clicked and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});