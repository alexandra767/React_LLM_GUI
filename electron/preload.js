const { contextBridge, ipcRenderer } = require('electron');
const { exec, spawn } = require('child_process');

console.log('[Preload] Script starting...');
console.log('[Preload] exec available:', typeof exec);
console.log('[Preload] spawn available:', typeof spawn);

// Whitelist of valid channels for IPC communication
const validSendChannels = [
  'terminal:write',
  'terminal:resize',
  'terminal:start',
  'terminal:stop',
  'speech:start',
  'speech:stop'
];

const validReceiveChannels = [
  'terminal:data',
  'terminal:exit',
  'speech:result',
  'speech:error',
  'speech:end'
];

// Create the exposed API
const electronAPI = {
  // Send messages to the main process
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`Attempted to send on invalid channel: ${channel}`);
    }
  },
  
  // Receive messages from the main process
  receive: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      // Strip event as it includes `sender` which we don't want to expose
      const newCallback = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, newCallback);
      
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener(channel, newCallback);
      };
    } else {
      console.warn(`Attempted to receive on invalid channel: ${channel}`);
    }
  },
  
  // Invoke methods and wait for the result
  invoke: async (channel, data) => {
    if (validSendChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }
    console.warn(`Attempted to invoke on invalid channel: ${channel}`);
    return null;
  },
  
  // Execute terminal commands
  exec: (command, options, callback) => {
    console.log('[Preload] Executing command:', command);
    return exec(command, options, callback);
  },
  
  // Spawn terminal processes for streaming with IPC
  spawnStream: (command, args, onData, onError, onClose) => {
    console.log('[Preload] Spawning streaming command:', command, 'with args:', args);
    
    try {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, TERM: 'dumb' }
      });
      
      console.log('[Preload] Child process created, PID:', child.pid);
      
      // Handle stdout
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          console.log('[Preload] stdout data:', data.length, 'bytes');
          if (onData) onData(data.toString());
        });
      }
      
      // Handle stderr - collect it but don't treat as error immediately
      let stderrBuffer = '';
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          const stderr = data.toString();
          console.error('[Preload] stderr data:', stderr);
          stderrBuffer += stderr;
          // Only report model not found errors immediately
          if (stderr.includes('could not find model') || stderr.includes('model not found')) {
            if (onError) onError(stderr);
          }
        });
      }
      
      // Handle close
      child.on('close', (code) => {
        console.log('[Preload] Process closed with code:', code);
        if (code !== 0 && stderrBuffer) {
          console.error('[Preload] Process failed with stderr:', stderrBuffer);
          if (onError) onError(`Process failed: ${stderrBuffer}`);
        }
        if (onClose) onClose(code);
      });
      
      // Handle error
      child.on('error', (err) => {
        console.error('[Preload] Process error:', err);
        if (onError) onError(err.message);
      });
      
      // Return methods to interact with the process
      return {
        write: (data) => {
          if (child.stdin && !child.stdin.destroyed) {
            child.stdin.write(data);
          }
        },
        end: () => {
          if (child.stdin && !child.stdin.destroyed) {
            child.stdin.end();
          }
        },
        kill: () => {
          child.kill();
        },
        pid: child.pid
      };
    } catch (error) {
      console.error('[Preload] Failed to spawn:', error);
      if (onError) onError(error.message);
      return null;
    }
  },
  
  // Speech recognition methods
  startSpeechRecognition: () => {
    console.log('[Preload] Starting speech recognition');
    ipcRenderer.send('speech:start');
  },
  
  stopSpeechRecognition: () => {
    console.log('[Preload] Stopping speech recognition');
    ipcRenderer.send('speech:stop');
  },
  
  onSpeechResult: (callback) => {
    ipcRenderer.on('speech:result', (event, data) => callback(data));
  },
  
  onSpeechError: (callback) => {
    ipcRenderer.on('speech:error', (event, error) => callback(error));
  },
  
  onSpeechEnd: (callback) => {
    ipcRenderer.on('speech:end', () => callback());
  }
};

console.log('[Preload] API object created with keys:', Object.keys(electronAPI));

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

// Log that preload script has loaded
console.log('Preload script loaded with contextBridge enabled');
console.log('[Preload] Testing exposed API...');
setTimeout(() => {
  console.log('[Preload] Verifying window.electron exists in renderer context');
}, 1000);