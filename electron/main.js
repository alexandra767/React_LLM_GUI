
const { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');

// Version Info
const VERSION = '1.0.0';
console.log(`[Main] Sephia v${VERSION} starting...`);
console.log(`[Main] Build date: 2025-05-31T01:13:28.296Z`);
console.log(`[Main] Platform: ${process.platform} ${process.arch}`);
const electronLog = require('electron-log');
const https = require('https');

// Set app name for branding
app.name = 'Sephia';

// Enable features needed for Web Speech API
app.commandLine.appendSwitch('enable-speech-dispatcher');
app.commandLine.appendSwitch('enable-features', 'WebSpeechAPI,SpeechRecognition');
app.commandLine.appendSwitch('enable-web-speech');
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('allow-running-insecure-content');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream'); // Auto-grant microphone permission
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('ignore-certificate-errors'); // Allow speech API connections
app.commandLine.appendSwitch('ignore-ssl-errors'); // Allow HTTPS connections to Google
app.commandLine.appendSwitch('allow-insecure-localhost'); // Allow local connections
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor,RendererCodeIntegrity'); // Disable restrictions

// Fix audio issues on Apple Silicon M4 MacBook Pro
app.commandLine.appendSwitch('disable-audio-sandbox');
app.commandLine.appendSwitch('enable-audio-service-sandbox', 'false');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
// Additional M4-specific audio fixes
app.commandLine.appendSwitch('disable-audio-input-sandbox');
app.commandLine.appendSwitch('disable-audio-output-resampler');
app.commandLine.appendSwitch('audio-buffer-size', '2048');

// Process management
let terminalProcess = null;
const childProcesses = new Set();
const backgroundServices = new Set();
let isQuitting = false;

// Configure logging
electronLog.transports.file.level = 'debug';
electronLog.transports.console.level = 'debug';

const log = electronLog.scope('main');
const error = electronLog.scope('main:error');

let mainWindow;

// Handle any uncaught exceptions
process.on('uncaughtException', (err) => {
  // Ignore common EIO errors that don't affect functionality
  if (err.code === 'EIO' || err.message.includes('write EIO')) {
    // Don't log EIO errors to avoid cascading issues
    return;
  }
  
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
  
  // Ignore EIO errors in promise rejections too
  if (err.code === 'EIO' || err.message.includes('write EIO')) {
    // Don't log EIO errors to avoid cascading issues
    return;
  }
  
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
        webSecurity: false, // Disable for speech recognition
        allowRunningInsecureContent: true,
        // Enable features needed for voice
        experimentalFeatures: true,
        // Allow network access for speech recognition
        webviewTag: true,
        // Additional permissions for speech API
        plugins: true,
        backgroundThrottling: false,
        // Fix audio issues on M4 MacBook Pro
        autoplayPolicy: 'no-user-gesture-required',
        spellcheck: false, // Reduce overhead
        // Enable hardware acceleration for audio
        offscreen: false
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
            "connect-src 'self' ws: wss: http: https: http://localhost:* *.google.com *.googleapis.com speech.googleapis.com *.googleusercontent.com *.gstatic.com www.google.com; " +
            "media-src 'self' blob: data: https:; " +
            "img-src 'self' data: blob: http: https: http://localhost:*; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline';"
          ]
        }
      });
    });
    
    // Handle permission requests (microphone)
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      console.log('Permission requested:', permission);
      if (permission === 'microphone' || permission === 'media') {
        // Always grant microphone permission for speech recognition
        callback(true);
      } else {
        // For other permissions, use default behavior
        callback(false);
      }
    });

    mainWindow.on('closed', () => {
      console.log('[Main] Main window closed');
      mainWindow = null;
    });
    
    // Handle window close request for proper cleanup
    mainWindow.on('close', (event) => {
      console.log('[Main] Window close requested');
      if (!isQuitting) {
        console.log('[Main] Preventing immediate close for cleanup');
        event.preventDefault();
        cleanupAndQuit();
      }
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



  // Additional cleanup on window events handled above
}

// Speech Recognition IPC Handlers
function setupSpeechHandlers() {
  const { exec } = require('child_process');
  let speechProcess = null;
  
  // Handle speech recognition requests
  ipcMain.handle('speech:startNative', async (event) => {
    console.log('[Main] Native speech recognition requested - returning empty to indicate manual dictation needed');
    // Don't read from clipboard - just return empty string
    // The UI will show instructions for manual dictation
    return Promise.resolve('');
  });
  
  // Alternative: Use built-in speech recognition
  ipcMain.handle('speech:startBuiltin', async (event) => {
    console.log('[Main] Starting built-in speech recognition');
    
    return new Promise((resolve, reject) => {
      // Try using the built-in speech recognition with AppleScript
      const script = `
        tell application "SpeechRecognitionServer"
          listen for "hello world" with timeout 10
        end tell
      `;
      
      exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
        if (error) {
          console.error('[Main] Built-in speech error:', error);
          // Fallback to simple approach
          resolve('');
          return;
        }
        
        resolve(stdout.trim());
      });
    });
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
      
      // Track this process for cleanup
      addChildProcess(terminalProcess);

      // Handle process exit
      terminalProcess.on('exit', (code) => {
        console.log(`Terminal process exited with code ${code}`);
        removeChildProcess(terminalProcess);
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

// Process cleanup functions
function addChildProcess(process) {
  if (process && process.pid) {
    childProcesses.add(process);
    console.log('[Main] Added child process:', process.pid);
  }
}

function removeChildProcess(process) {
  if (process) {
    childProcesses.delete(process);
    console.log('[Main] Removed child process:', process.pid);
  }
}

function addBackgroundService(serviceInfo) {
  backgroundServices.add(serviceInfo);
  console.log('[Main] Added background service:', serviceInfo.name);
}

function killAllChildProcesses() {
  console.log('[Main] Killing all child processes...', childProcesses.size);
  
  for (const process of childProcesses) {
    try {
      if (process && process.pid && !process.killed) {
        console.log('[Main] Killing child process:', process.pid);
        process.kill('SIGTERM');
        
        // Force kill after 2 seconds if still running
        setTimeout(() => {
          if (!process.killed) {
            console.log('[Main] Force killing process:', process.pid);
            process.kill('SIGKILL');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('[Main] Error killing process:', error);
    }
  }
  
  childProcesses.clear();
}

function killBackgroundServices() {
  console.log('[Main] Killing background services...', backgroundServices.size);
  const { exec } = require('child_process');
  
  for (const service of backgroundServices) {
    try {
      console.log('[Main] Killing background service:', service.name, service.pattern);
      
      if (service.port) {
        // Kill by port
        exec(`lsof -ti:${service.port} | xargs kill -9 2>/dev/null || true`, (error) => {
          if (!error) {
            console.log('[Main] Killed service on port:', service.port);
          }
        });
      }
      
      if (service.pattern) {
        // Kill by process pattern
        exec(`pkill -f "${service.pattern}" 2>/dev/null || true`, (error) => {
          if (!error) {
            console.log('[Main] Killed service matching:', service.pattern);
          }
        });
      }
      
      if (service.command) {
        // Execute custom kill command
        exec(service.command, (error) => {
          if (!error) {
            console.log('[Main] Executed custom kill command for:', service.name);
          }
        });
      }
    } catch (error) {
      console.error('[Main] Error killing background service:', service.name, error);
    }
  }
  
  backgroundServices.clear();
}

function performAggressiveCleanup() {
  console.log('[Main] Performing aggressive cleanup...');
  const { exec } = require('child_process');
  
  const cleanupCommands = [
    // Kill all ComfyUI processes
    'pkill -f "main.py.*8188" 2>/dev/null || true',
    'pkill -f "comfyui" 2>/dev/null || true',
    
    // Kill all Bark TTS processes  
    'pkill -f "bark_tts_server" 2>/dev/null || true',
    'pkill -f "start-bark-tts" 2>/dev/null || true',
    'pkill -f "import bark" 2>/dev/null || true',
    
    // Kill processes on specific ports
    'lsof -ti:8188 | xargs kill -9 2>/dev/null || true',
    'lsof -ti:8189 | xargs kill -9 2>/dev/null || true',
    'lsof -ti:3000 | xargs kill -9 2>/dev/null || true',
    
    // Kill any Python processes related to AI/ML
    'pkill -f "python.*torch" 2>/dev/null || true',
    'pkill -f "python.*transformers" 2>/dev/null || true',
    
    // Kill tail processes for logs
    'pkill -f "tail.*comfyui" 2>/dev/null || true',
    
    // Memory cleanup (without sudo to avoid permission prompts)
    'echo "Memory cleanup attempted"'
  ];
  
  cleanupCommands.forEach((command, index) => {
    exec(command, (error, stdout, stderr) => {
      if (!error || error.code === 1) { // Code 1 often means "no processes found" which is fine
        console.log(`[Main] Cleanup command ${index + 1} completed`);
      } else {
        console.log(`[Main] Cleanup command ${index + 1} had no effect (normal if nothing to clean)`);
      }
    });
  });
}

function cleanupAndQuit() {
  if (isQuitting) {
    console.log('[Main] Already quitting, ignoring additional cleanup requests');
    return;
  }
  
  console.log('[Main] Starting cleanup process...');
  isQuitting = true;
  
  // Hide window immediately to give impression of quick close
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
  
  // Start cleanup process
  Promise.race([
    // Cleanup process with timeout
    new Promise((resolve) => {
      // Kill terminal process
      if (terminalProcess) {
        console.log('[Main] Killing terminal process');
        terminalProcess.kill();
        terminalProcess = null;
      }
      
      // Kill all child processes
      killAllChildProcesses();
      
      // Kill background services
      killBackgroundServices();
      
      // Perform aggressive cleanup
      performAggressiveCleanup();
      
      // Wait a bit for processes to die gracefully
      setTimeout(() => {
        console.log('[Main] Cleanup completed');
        resolve();
      }, 4000);
    }),
    
    // Timeout to force quit if cleanup takes too long
    new Promise((resolve) => {
      setTimeout(() => {
        console.log('[Main] Cleanup timeout reached, forcing quit');
        resolve();
      }, 5000);
    })
  ]).then(() => {
    console.log('[Main] Cleanup finished, quitting app');
    app.quit();
  }).catch((error) => {
    console.error('[Main] Error during cleanup:', error);
    app.quit();
  });
}

// System Process Handler
function setupSystemHandlers() {
  const { exec } = require('child_process');
  
  // Register background service for tracking
  ipcMain.handle('system:registerService', async (event, serviceInfo) => {
    console.log('[Main] Registering background service:', serviceInfo);
    addBackgroundService(serviceInfo);
    return true;
  });
  
  // Kill process by name pattern
  ipcMain.handle('system:killProcess', async (event, processPattern) => {
    console.log('[Main] Killing processes matching:', processPattern);
    
    return new Promise((resolve, reject) => {
      const command = `pkill -f "${processPattern}" 2>/dev/null || true`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('[Main] Kill process error:', error);
          resolve(false);
          return;
        }
        console.log('[Main] Kill process result:', stdout || 'No output');
        resolve(true);
      });
    });
  });
  
  // Kill process by port
  ipcMain.handle('system:killPort', async (event, port) => {
    console.log('[Main] Killing process on port:', port);
    
    return new Promise((resolve, reject) => {
      const command = `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('[Main] Kill port error:', error);
          resolve(false);
          return;
        }
        console.log('[Main] Kill port result:', stdout || 'No output');
        resolve(true);
      });
    });
  });
  
  // Force cleanup and quit
  ipcMain.handle('system:forceQuit', async (event) => {
    console.log('[Main] Force quit requested');
    cleanupAndQuit();
    return true;
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

  // Save image dialog handler
  ipcMain.handle('dialog:saveImage', async (event, imageBuffer, defaultName) => {
    try {
      console.log('[Main] Saving image with dialog, buffer size:', imageBuffer.byteLength);
      
      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(imageBuffer);
      
      // Show save dialog
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Image',
        defaultPath: defaultName,
        filters: [
          { name: 'PNG Images', extensions: ['png'] },
          { name: 'JPEG Images', extensions: ['jpg', 'jpeg'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (result.canceled) {
        console.log('[Main] User cancelled save dialog');
        return false;
      }
      
      // Write file to selected path
      fs.writeFileSync(result.filePath, buffer);
      
      console.log('[Main] Image saved successfully to:', result.filePath);
      return true;
    } catch (error) {
      console.error('[Main] Failed to save image:', error);
      return false;
    }
  });
}

// File System Handlers for External Memory
function setupFileSystemHandlers() {
  // Read file
  ipcMain.handle('fs:readFile', async (event, filePath) => {
    try {
      console.log('[Main] Reading file:', filePath);
      const data = await fs.promises.readFile(filePath, 'utf8');
      return data;
    } catch (error) {
      console.error('[Main] Failed to read file:', error);
      throw error;
    }
  });

  // Write file
  ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
    try {
      console.log('[Main] Writing file:', filePath);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });
      
      await fs.promises.writeFile(filePath, data, 'utf8');
      console.log('[Main] File written successfully');
      return true;
    } catch (error) {
      console.error('[Main] Failed to write file:', error);
      throw error;
    }
  });

  // Get userData directory path
  ipcMain.handle('fs:getUserDataPath', async (event) => {
    try {
      return app.getPath('userData');
    } catch (error) {
      console.error('[Main] Failed to get userData path:', error);
      throw error;
    }
  });

  // Storage API for userData directory
  ipcMain.handle('storage:set', async (event, key, value) => {
    try {
      const userDataPath = app.getPath('userData');
      const storageDir = path.join(userDataPath, 'sephia-storage');
      await fs.promises.mkdir(storageDir, { recursive: true });
      
      const filePath = path.join(storageDir, `${key}.json`);
      const data = {
        key: key,
        value: value,
        timestamp: new Date().toISOString()
      };
      
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[Main] Stored ${key} in userData`);
      return true;
    } catch (error) {
      console.error(`[Main] Failed to store ${key}:`, error);
      throw error;
    }
  });

  ipcMain.handle('storage:get', async (event, key) => {
    try {
      const userDataPath = app.getPath('userData');
      const storageDir = path.join(userDataPath, 'sephia-storage');
      const filePath = path.join(storageDir, `${key}.json`);
      
      const data = await fs.promises.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);
      console.log(`[Main] Retrieved ${key} from userData`);
      return parsed.value;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      console.error(`[Main] Failed to retrieve ${key}:`, error);
      throw error;
    }
  });

  ipcMain.handle('storage:remove', async (event, key) => {
    try {
      const userDataPath = app.getPath('userData');
      const storageDir = path.join(userDataPath, 'sephia-storage');
      const filePath = path.join(storageDir, `${key}.json`);
      
      await fs.promises.unlink(filePath);
      console.log(`[Main] Removed ${key} from userData`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true; // File doesn't exist, consider it removed
      }
      console.error(`[Main] Failed to remove ${key}:`, error);
      throw error;
    }
  });

  // Delete file
  ipcMain.handle('fs:deleteFile', async (event, filePath) => {
    try {
      console.log('[Main] Deleting file:', filePath);
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      console.error('[Main] Failed to delete file:', error);
      throw error;
    }
  });

  // Check if file exists
  ipcMain.handle('fs:fileExists', async (event, filePath) => {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  });

  // Create directory
  ipcMain.handle('fs:mkdir', async (event, dirPath) => {
    try {
      console.log('[Main] Creating directory:', dirPath);
      await fs.promises.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('[Main] Failed to create directory:', error);
      throw error;
    }
  });

  // Memory cleanup command
  ipcMain.handle('system:memoryCleanup', async (event) => {
    console.log('[Main] Memory cleanup requested');
    performAggressiveCleanup();
    
    // Also trigger garbage collection in renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(`
        if (window.gc) {
          window.gc();
          console.log('[Renderer] Garbage collection triggered');
        }
        // Clear caches
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
      `);
    }
    
    return { success: true, message: 'Memory cleanup completed' };
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
  setupSystemHandlers();
  setupClipboardHandlers();
  setupFileSystemHandlers();
  createWindow();
}).catch(err => {
  console.error('Failed to start app:', err);
  if (dialog && dialog.showErrorBox) {
    dialog.showErrorBox('Startup Error', `Failed to start application: ${err.message}`);
  }
  app.quit();
});

// App event handlers for proper shutdown
app.on('before-quit', (event) => {
  console.log('[Main] App before-quit event');
  if (!isQuitting) {
    console.log('[Main] Preventing quit for cleanup');
    event.preventDefault();
    cleanupAndQuit();
  }
});

app.on('window-all-closed', () => {
  console.log('[Main] All windows closed');
  if (!isQuitting) {
    cleanupAndQuit();
  }
});

app.on('will-quit', (event) => {
  console.log('[Main] App will-quit event');
  if (!isQuitting) {
    console.log('[Main] Preventing will-quit for cleanup');
    event.preventDefault();
    cleanupAndQuit();
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


