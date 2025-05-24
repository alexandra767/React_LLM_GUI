
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');
const electronLog = require('electron-log');

// Terminal process management
let terminalProcess = null;

// Configure logging
electronLog.transports.file.level = 'debug';
electronLog.transports.console.level = 'debug';

const log = electronLog.scope('main');
const error = electronLog.scope('main:error');

let mainWindow;

// Handle any uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (dialog && dialog.showErrorBox) {
    dialog.showErrorBox('Uncaught Exception', `An error occurred: ${err.message}\n\n${err.stack || 'No stack trace available'}`);
  }
  if (app && typeof app.quit === 'function') {
    app.quit(1);
  } else {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  if (err.stack) {
    console.error('Stack:', err.stack);
  }
  
  if (dialog && dialog.showErrorBox) {
    dialog.showErrorBox(
      'Unhandled Rejection', 
      `An error occurred: ${err.message}\n\n${err.stack || 'No stack trace available'}`
    );
  }
});

function showErrorAndQuit(error) {
  console.error('Fatal error:', error);
  if (error && error.stack) {
    console.error('Stack:', error.stack);
  }
  
  if (dialog && dialog.showErrorBox) {
    dialog.showErrorBox(
      'Failed to start', 
      `Failed to start application: ${error?.message || 'Unknown error'}`
    );
  }
  
  try {
    if (app && typeof app.quit === 'function') {
      app.quit(1);
    } else {
      process.exit(1);
    }
  } catch (e) {
    console.error('Error while trying to quit:', e);
    process.exit(1);
  }
}

function createWindow() {
  console.log('Creating main window...');
  
  // Log Electron and Node versions
  console.log(`Electron ${process.versions.electron}, Node ${process.versions.node}, Chrome ${process.versions.chrome}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  // Create the browser window
  try {
    console.log('Creating new BrowserWindow...');
    mainWindow = new BrowserWindow({
      width: 1600,
      height: 1000,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false, // Disable nodeIntegration for security
        contextIsolation: true, // Enable context isolation for security
        enableRemoteModule: false, // Disable remote module for security
        preload: path.join(__dirname, 'preload.js'),
        sandbox: false // Disable sandbox to allow child_process
      },
      title: 'Sephia',
      icon: path.join(__dirname, '../public/favicon.ico')
    });
    console.log('BrowserWindow created successfully');
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch (err) {
    console.error('Failed to create BrowserWindow:', err);
    if (dialog && dialog.showErrorBox) {
      dialog.showErrorBox('Error', `Failed to create window: ${err.message}`);
    }
    app.quit();
    return;
  }

  // Load the index.html file
  console.log('Loading application...');
  if (isDev) {
    console.log('Running in development mode');
    const startUrl = 'http://localhost:3002';
    console.log(`Loading development URL: ${startUrl}`);
    
    // Load the React development server
    mainWindow.loadURL(startUrl)
      .then(() => {
        console.log('Successfully loaded URL:', startUrl);
        // Open the DevTools in development mode
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      })
      .catch(err => {
        console.error('Failed to load URL:', err);
        if (dialog && dialog.showErrorBox) {
          dialog.showErrorBox('Load Error', `Failed to load ${startUrl}: ${err.message}`);
        }
        app.quit();
      });
    
    // Handle any navigation errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load page:', { errorCode, errorDescription });
      if (dialog && dialog.showErrorBox) {
        dialog.showErrorBox('Load Failed', `Failed to load page: ${errorDescription} (${errorCode})`);
      }
    });
  } else {
    console.log('Running in production mode');
    // In production, load the built React app
    const indexPath = path.join(__dirname, '../build/index.html');
    console.log(`Loading from path: ${indexPath}`);
    
    // Check if the file exists first
    if (!fs.existsSync(indexPath)) {
      const error = new Error(`File not found: ${indexPath}`);
      console.error(error);
      showErrorAndQuit(error);
      return;
    }
    
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
      showErrorAndQuit(new Error(`Failed to load application: ${err.message}`));
    });
  }



  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Terminal IPC Handlers
function setupTerminalHandlers() {
  // Start a new terminal session
  ipcMain.handle('terminal:start', (event, { model, cols = 80, rows = 30 }) => {
    try {
      // Kill existing terminal process if any
      if (terminalProcess) {
        terminalProcess.kill();
        terminalProcess = null;
      }

      // Start a new Ollama process
      terminalProcess = spawn('ollama', ['run', model], {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      // Handle process exit
      terminalProcess.on('exit', (code) => {
        console.log(`Terminal process exited with code ${code}`);
        if (mainWindow) {
          mainWindow.webContents.send('terminal:exit', { code });
        }
        terminalProcess = null;
      });

      // Send data from terminal to renderer
      terminalProcess.stdout.on('data', (data) => {
        if (mainWindow) {
          mainWindow.webContents.send('terminal:data', data.toString());
        }
      });

      terminalProcess.stderr.on('data', (data) => {
        console.error(`Terminal stderr: ${data}`);
        if (mainWindow) {
          mainWindow.webContents.send('terminal:data', data.toString());
        }
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to start terminal:', err);
      return { success: false, error: err.message };
    }
  });

  // Write to terminal
  ipcMain.handle('terminal:write', (event, data) => {
    if (terminalProcess && terminalProcess.stdin.writable) {
      terminalProcess.stdin.write(data);
      return true;
    }
    return false;
  });

  // Resize terminal
  ipcMain.handle('terminal:resize', (event, { cols, rows }) => {
    if (terminalProcess) {
      try {
        terminalProcess.stdout.rows = rows;
        terminalProcess.stdout.columns = cols;
        terminalProcess.stderr.rows = rows;
        terminalProcess.stderr.columns = cols;
        return true;
      } catch (err) {
        console.error('Failed to resize terminal:', err);
      }
    }
    return false;
  });

  // Stop terminal
  ipcMain.handle('terminal:stop', () => {
    if (terminalProcess) {
      terminalProcess.kill();
      terminalProcess = null;
      return true;
    }
    return false;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  setupTerminalHandlers();
  createWindow();
}).catch(err => {
  console.error('Failed to start app:', err);
  if (dialog && dialog.showErrorBox) {
    dialog.showErrorBox('Startup Error', `Failed to start application: ${err.message}`);
  }
  app.quit();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  console.log('All windows closed, quitting...');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log('No windows found, creating new window...');
    createWindow();
  }
});


