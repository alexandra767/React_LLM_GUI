
const { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');
const electronLog = require('electron-log');
const https = require('https');

// Set app name for branding
app.name = 'Sephia';

// Enable features needed for Web Speech API
app.commandLine.appendSwitch('enable-speech-dispatcher');
app.commandLine.appendSwitch('enable-features', 'WebSpeechAPI');
app.commandLine.appendSwitch('enable-web-speech');

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
      title: 'Sephia',
      webPreferences: {
        nodeIntegration: false, // Disable nodeIntegration for security
        contextIsolation: true, // Enable context isolation for security
        enableRemoteModule: false, // Disable remote module for security
        preload: path.join(__dirname, 'preload.js'),
        sandbox: false, // Disable sandbox to allow child_process
        webSecurity: false, // Temporarily disable for testing
        allowRunningInsecureContent: true,
        // Enable features needed for voice
        experimentalFeatures: true,
        // Allow network access for speech recognition
        webviewTag: true
      },
      title: 'Sephia',
      icon: process.platform === 'darwin' ? path.join(__dirname, '../public/favicon.icns') : path.join(__dirname, '../public/favicon.ico')
    });
    console.log('BrowserWindow created successfully');
    
    // Modify CSP to allow localhost images and speech recognition
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: http: https:; " +
            "connect-src 'self' ws: wss: http: https: http://localhost:* *.google.com *.googleapis.com speech.googleapis.com; " +
            "media-src 'self' blob: data: https:; " +
            "img-src 'self' data: blob: http: https: http://localhost:*; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline';"
          ]
        }
      });
    });
    
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
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    console.log(`Loading development URL: ${startUrl}`);
    
    // Load the React development server
    mainWindow.loadURL(startUrl)
      .then(() => {
        console.log('Successfully loaded URL:', startUrl);
        // Open the DevTools in development mode
        // mainWindow.webContents.openDevTools({ mode: 'detach' });
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

// Speech Recognition IPC Handlers
function setupSpeechHandlers() {
  let speechProcess = null;
  
  ipcMain.on('speech:start', (event) => {
    console.log('[Main] Starting speech recognition');
    
    // Use say command to simulate dictation input
    // This is a workaround since we can't directly access macOS dictation API
    // The user will need to manually trigger dictation with Fn+Fn
    if (mainWindow) {
      // Send a message to show instructions
      mainWindow.webContents.send('speech:result', {
        transcript: '',
        isFinal: false,
        isInstruction: true,
        message: 'Press Fn+Fn to start dictating'
      });
    }
  });
  
  ipcMain.on('speech:stop', (event) => {
    console.log('[Main] Stopping speech recognition');
    if (speechProcess) {
      speechProcess.kill();
      speechProcess = null;
    }
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

// Handle permission requests for microphone
app.on('web-contents-created', (event, contents) => {
  contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('[Electron] Permission requested:', permission);
    // Allow microphone permissions for voice features
    if (permission === 'media' || permission === 'microphone' || permission === 'audioCapture') {
      console.log('[Electron] Granting microphone permission');
      callback(true);
    } else {
      callback(true); // Allow other permissions as well
    }
  });
  
  // Allow network access for speech recognition
  contents.session.setPermissionCheckHandler((webContents, permission) => {
    console.log('[Electron] Permission check:', permission);
    return true;
  });
});

// CalDAV Request Handler
function setupCalDAVHandlers() {
  ipcMain.handle('caldav:request', async (event, options) => {
    console.log('[Main] CalDAV request:', {
      url: options.url,
      method: options.method,
      hasAuth: !!options.headers?.Authorization,
      authPrefix: options.headers?.Authorization?.substring(0, 10)
    });
    
    return new Promise((resolve, reject) => {
      const urlParts = new URL(options.url);
      
      const requestOptions = {
        hostname: urlParts.hostname,
        port: urlParts.port || 443,
        path: urlParts.pathname + urlParts.search,
        method: options.method,
        headers: options.headers
      };
      
      console.log('[Main] CalDAV request options:', requestOptions);
      
      const req = https.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('[Main] CalDAV response:', {
            status: res.statusCode,
            statusText: res.statusMessage,
            dataLength: data.length,
            dataPreview: data.substring(0, 200)
          });
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            text: data
          });
        });
      });
      
      req.on('error', (error) => {
        console.error('[Main] CalDAV request error:', error);
        reject(error);
      });
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  });
}

// AppleScript Handler
function setupAppleScriptHandlers() {
  const { exec } = require('child_process');
  
  ipcMain.handle('applescript:exec', async (event, script) => {
    console.log('[Main] Executing AppleScript');
    console.log('[Main] Script preview:', script.substring(0, 100) + '...');
    
    return new Promise((resolve, reject) => {
      // Write script to temp file to avoid escaping issues
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const tempFile = path.join(os.tmpdir(), `calendar-script-${Date.now()}.applescript`);
      
      fs.writeFileSync(tempFile, script);
      
      exec(`osascript "${tempFile}"`, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          console.error('[Main] Failed to delete temp file:', e);
        }
        
        if (error) {
          console.error('[Main] AppleScript error:', error);
          console.error('[Main] Error code:', error.code);
          console.error('[Main] Error stderr:', stderr);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.error('[Main] AppleScript stderr:', stderr);
        }
        
        console.log('[Main] AppleScript result length:', stdout.length);
        console.log('[Main] AppleScript result preview:', stdout.substring(0, 200));
        resolve(stdout.trim());
      });
    });
  });
}

// Clipboard Handler
function setupClipboardHandlers() {
  ipcMain.handle('clipboard:copyImage', async (event, imageBuffer) => {
    try {
      console.log('[Main] Copying image to clipboard, buffer size:', imageBuffer.byteLength);
      
      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(imageBuffer);
      
      // Create native image from buffer
      const image = nativeImage.createFromBuffer(buffer);
      
      if (image.isEmpty()) {
        throw new Error('Failed to create image from buffer');
      }
      
      // Write image to clipboard
      clipboard.writeImage(image);
      
      console.log('[Main] Image copied to clipboard successfully');
      return true;
    } catch (error) {
      console.error('[Main] Failed to copy image to clipboard:', error);
      return false;
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  app.setName('Sephia');
  
  // Set dock icon on macOS
  if (process.platform === 'darwin') {
    try {
      const iconPath = path.join(__dirname, '../public/favicon.icns');
      if (fs.existsSync(iconPath)) {
        // Only set icon if dock exists (not in test mode)
        if (app.dock) {
          app.dock.setIcon(iconPath);
        }
      }
    } catch (err) {
      console.error('Failed to set dock icon:', err);
    }
  }
  
  setupTerminalHandlers();
  setupSpeechHandlers();
  setupCalDAVHandlers();
  setupAppleScriptHandlers();
  setupClipboardHandlers();
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


