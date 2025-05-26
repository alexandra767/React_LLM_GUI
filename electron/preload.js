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
  'speech:stop',
  'caldav:request'
];

const validReceiveChannels = [
  'terminal:data',
  'terminal:exit',
  'speech:result',
  'speech:error',
  'speech:end',
  'caldav:response',
  'caldav:error'
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
  },
  
  // CalDAV request method
  caldavRequest: async (options) => {
    console.log('[Preload] Making CalDAV request:', options.url);
    try {
      const response = await ipcRenderer.invoke('caldav:request', options);
      return response;
    } catch (error) {
      console.error('[Preload] CalDAV request failed:', error);
      throw error;
    }
  },
  
  // AppleScript execution for native calendar access
  execAppleScript: async (script) => {
    console.log('[Preload] Executing AppleScript');
    console.log('[Preload] Script length:', script.length);
    
    // Add timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AppleScript timeout after 30 seconds')), 30000);
    });
    
    try {
      const result = await Promise.race([
        ipcRenderer.invoke('applescript:exec', script),
        timeoutPromise
      ]);
      console.log('[Preload] AppleScript result received:', result ? result.substring(0, 100) : 'empty');
      return result;
    } catch (error) {
      console.error('[Preload] AppleScript execution failed:', error);
      throw error;
    }
  },
  
  // Copy image to clipboard
  copyImageToClipboard: async (imageBuffer) => {
    console.log('[Preload] Copying image to clipboard, buffer size:', imageBuffer.byteLength);
    try {
      const result = await ipcRenderer.invoke('clipboard:copyImage', imageBuffer);
      return result;
    } catch (error) {
      console.error('[Preload] Failed to copy image to clipboard:', error);
      throw error;
    }
  },
  
  // Ollama API
  ollama: {
    // List available models
    listModels: async () => {
      console.log('[Preload] Listing Ollama models');
      return new Promise((resolve, reject) => {
        exec('ollama list', (error, stdout, stderr) => {
          if (error) {
            console.error('[Preload] Failed to list models:', error);
            reject(error);
            return;
          }
          
          // Parse the output to extract model names
          const lines = stdout.split('\n').filter(line => line.trim());
          const models = [];
          
          // Skip the header line
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(/\s+/);
            if (parts[0]) {
              models.push({
                name: parts[0],
                size: parts[1] || '',
                modified: parts.slice(2).join(' ') || ''
              });
            }
          }
          
          resolve(models);
        });
      });
    },
    
    // Generate response (non-streaming)
    generate: async (model, prompt, options = {}) => {
      console.log('[Preload] Generating with model:', model);
      const args = ['run', model, prompt];
      
      return new Promise((resolve, reject) => {
        exec(`ollama ${args.join(' ')}`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
          if (error) {
            console.error('[Preload] Generation failed:', error);
            reject(error);
            return;
          }
          
          resolve({ response: stdout.trim() });
        });
      });
    },
    
    // Stream generate response
    streamGenerate: (model, prompt, onData, onEnd, onError, options = {}) => {
      console.log('[Preload] Stream generating with model:', model);
      
      const child = spawn('ollama', ['run', model], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let fullResponse = '';
      
      // Send the prompt
      child.stdin.write(prompt + '\n');
      child.stdin.end();
      
      // Handle stdout
      child.stdout.on('data', (data) => {
        const text = data.toString();
        fullResponse += text;
        if (onData) onData(text);
      });
      
      // Handle stderr
      child.stderr.on('data', (data) => {
        console.error('[Preload] Ollama stderr:', data.toString());
      });
      
      // Handle close
      child.on('close', (code) => {
        if (code === 0) {
          if (onEnd) onEnd();
        } else {
          if (onError) onError(new Error(`Process exited with code ${code}`));
        }
      });
      
      // Handle error
      child.on('error', (err) => {
        console.error('[Preload] Ollama process error:', err);
        if (onError) onError(err);
      });
      
      // Return cleanup function
      return () => {
        child.kill();
      };
    },
    
    // Start terminal session
    startTerminal: (model, onData, onEnd, onError) => {
      console.log('[Preload] Starting Ollama terminal with model:', model);
      
      const child = spawn('ollama', ['run', model], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '1' }
      });
      
      // Handle stdout
      child.stdout.on('data', (data) => {
        if (onData) onData(data.toString());
      });
      
      // Handle stderr
      child.stderr.on('data', (data) => {
        const stderr = data.toString();
        console.error('[Preload] Terminal stderr:', stderr);
        if (stderr.includes('could not find model')) {
          if (onError) onError(new Error(`Model '${model}' not found`));
        }
      });
      
      // Handle close
      child.on('close', (code) => {
        console.log('[Preload] Terminal closed with code:', code);
        if (onEnd) onEnd(code);
      });
      
      // Handle error
      child.on('error', (err) => {
        console.error('[Preload] Terminal error:', err);
        if (onError) onError(err);
      });
      
      // Return control object
      return {
        write: (data) => {
          if (child.stdin && !child.stdin.destroyed) {
            child.stdin.write(data);
          }
        },
        kill: () => {
          child.kill();
        }
      };
    }
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