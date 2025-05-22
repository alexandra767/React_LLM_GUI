const electron = require('electron');
const { app, BrowserWindow, protocol, ipcMain, dialog } = electron;
const path = require('path');
const url = require('url');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

// Check if Ollama is installed and running
const checkOllama = () => {
  return new Promise((resolve) => {
    exec('ollama --version', (error) => {
      if (error) {
        console.error('Ollama is not installed or not in PATH');
        resolve({ installed: false, error: 'Ollama is not installed or not in PATH' });
        return;
      }
      
      // Check if Ollama server is running
      exec('lsof -i :11434', (error) => {
        if (error) {
          console.error('Ollama server is not running');
          resolve({ installed: true, running: false, error: 'Ollama server is not running' });
          return;
        }
        resolve({ installed: true, running: true });
      });
    });
  });
};

// Path to the built app
const BUILD_DIR = path.join(__dirname, '../build');

async function createWindow() {
  // Check Ollama status
  const ollamaStatus = await checkOllama();
  if (!ollamaStatus.installed || !ollamaStatus.running) {
    console.warn('Ollama is not properly set up:', ollamaStatus.error);
  }

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
      preload: path.join(__dirname, 'preload.js'),
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

  // Load the app directly from the file system
  const startUrl = url.format({
    pathname: path.join(BUILD_DIR, 'index.html'),
    protocol: 'file:',
    slashes: true,
    hash: `#/ollama-status?status=${ollamaStatus.installed && ollamaStatus.running ? 'ready' : 'error'}`
  });
  
  mainWindow.loadURL(startUrl);
  
  // Log system information for debugging
  console.log('System Information:', {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + 'GB',
    freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + 'GB',
    ollamaStatus
  });
  
  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();
  
  // Check if the page loaded successfully
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });
  
  // Check for load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
  
  console.log('Loading app from file system:', startUrl);
  return mainWindow;
}

// Get system information
const getSystemInfo = () => {
  const os = require('os');
  return {
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    platform: os.platform(),
    arch: os.arch()
  };
};

// IPC Handlers
if (ipcMain) {
  ipcMain.on('get-system-info', (event) => {
    try {
      event.returnValue = getSystemInfo();
    } catch (error) {
      console.error('Error in get-system-info handler:', error);
      event.returnValue = { error: error.message };
    }
  });

  // Handle terminal resize
  ipcMain.on('terminal:resize', (event, { cols, rows }) => {
    if (process.platform !== 'win32') {
      process.stdout.rows = rows;
      process.stdout.columns = cols;
      process.stderr.rows = rows;
      process.stderr.columns = cols;
    }
  });

  // Handle terminal data
  ipcMain.on('terminal:data', (event, data) => {
    if (process.platform === 'win32') {
      process.stdin.write(data);
    } else {
      process.stdin.write(Buffer.from(data, 'utf-8'));
    }
  });

  // Handle terminal close
  ipcMain.on('terminal:close', () => {
    process.exit(0);
  });

  ipcMain.on('open-ollama-folder', () => {
    const ollamaPath = path.join(os.homedir(), '.ollama');
    if (fs.existsSync(ollamaPath)) {
      require('child_process').exec(`open "${ollamaPath}"`);
    } else {
      dialog.showErrorBox('Ollama Folder Not Found', `Ollama folder not found at: ${ollamaPath}`);
    }
  });

  ipcMain.handle('ollama:list-models', async () => {
    return new Promise((resolve, reject) => {
      // First check if ollama is installed and running
      exec('ollama --version', (error) => {
        if (error) {
          console.error('Ollama is not installed or not in PATH');
          reject(new Error('Ollama is not installed or not in PATH'));
          return;
        }
        
        // If we got here, ollama is installed, now list models
        exec('ollama list --format json', (error, stdout) => {
          if (error) {
            console.error('Error listing models:', error);
            reject(error);
            return;
          }
          try {
            const models = JSON.parse(stdout);
            resolve(models);
          } catch (e) {
            console.error('Error parsing model list:', e);
            reject(e);
          }
        });
      });
    });
  });
}

// Handle process errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// This method will be called when Electron has finished initialization
const initApp = async () => {
  try {
    // Register file protocol handler
    protocol.registerFileProtocol('file', (request, callback) => {
      const pathname = decodeURI(request.url.replace('file:///', ''));
      callback(pathname);
    });
    
    await createWindow();

    app.on('activate', () => {
      // On macOS it's common to re-create a window when the
      // dock icon is clicked and there are no other windows open
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
};

// Only initialize the app if we're in the main process
if (app) {
  app.whenReady().then(initApp);

  // Quit when all windows are closed, except on macOS
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
} else {
  console.error('Electron app object is not available');
}