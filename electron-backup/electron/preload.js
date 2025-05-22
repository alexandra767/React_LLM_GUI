const { contextBridge, ipcRenderer } = require('electron');
const { exec, spawn } = require('child_process');
const os = require('os');

// Terminal emulation
class Terminal {
  constructor() {
    this.process = null;
    this.buffer = '';
    this.listeners = [];
  }

  start() {
    if (this.process) return;
    
    const shell = os.platform() === 'win32' ? 'cmd.exe' : '/bin/zsh';
    this.process = spawn(shell, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, TERM: 'xterm-256color' }
    });

    this.process.stdout.on('data', (data) => {
      this.buffer += data.toString();
      this.emit('data', data.toString());
    });

    this.process.stderr.on('data', (data) => {
      this.buffer += data.toString();
      this.emit('data', data.toString());
    });

    this.process.on('close', (code) => {
      this.emit('close', code);
      this.process = null;
    });
  }

  write(data) {
    if (!this.process) return;
    this.process.stdin.write(data);
  }

  resize(columns, rows) {
    if (!this.process) return;
    // Only works on Unix-like systems
    if (os.platform() !== 'win32') {
      this.process.kill('SIGWINCH');
    }
  }

  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  emit(event, ...args) {
    this.listeners
      .filter(({ event: e }) => e === event)
      .forEach(({ callback }) => callback(...args));
  }

  destroy() {
    if (!this.process) return;
    this.process.kill();
    this.process = null;
  }
}

// Check if Ollama is running
const isOllamaRunning = () => {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      // On Windows, we'll just try to list models
      exec('ollama list', (error) => {
        resolve(!error);
      });
    } else {
      // On Unix-like systems, we can check if the process is running
      exec('pgrep ollama', (error) => {
        resolve(!error);
      });
    }
  });
};

// Ollama API integration
const ollama = {
  terminal: new Terminal(),
  isRunning: isOllamaRunning,
  
  // List available models
  listModels: async () => {
    return new Promise((resolve, reject) => {
      const process = spawn('ollama', ['list']);
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          console.error('Error listing models:', stderr);
          reject(stderr || `Process exited with code ${code}`);
          return;
        }
        resolve(stdout);
      });
    });
  },

  // Generate text using a model with streaming support
  generate: async (model, prompt, options = {}) => {
    const {
      maxTokens = 128,
      temperature = 0.7,
      topP = 0.9,
      topK = 40,
      numCtx = 4096,
      numGpu = 25,
      numThread = 10,
      batchSize = 512,
      onData = () => {},
      onEnd = () => {}
    } = options;

    const args = [
      'run',
      model,
      `"${prompt}"`,
      '--num_ctx', numCtx,
      '--num_gpu', numGpu,
      '--num_thread', numThread,
      '--batch_size', batchSize,
      '--temp', temperature
    ];

    return new Promise((resolve, reject) => {
      const process = spawn('ollama', args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      
      process.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        onData(text);
      });
      
      process.stderr.on('data', (data) => {
        console.error('Ollama stderr:', data.toString());
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          const error = new Error(`Ollama process exited with code ${code}`);
          console.error(error);
          reject(error);
          return;
        }
        onEnd();
        resolve(output);
      });
      
      process.on('error', (error) => {
        console.error('Failed to start Ollama process:', error);
        reject(error);
      });
    });
  },
  
  // Start an interactive terminal session with the model
  startTerminal: (model, onData, onEnd) => {
    const process = spawn('ollama', ['run', model], {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLUMNS: '80',
        LINES: '24'
      }
    });
    
    let isAlive = true;
    let outputBuffer = '';
    
    const flushBuffer = () => {
      if (outputBuffer) {
        onData(outputBuffer);
        outputBuffer = '';
      }
    };
    
    // Buffer output to prevent flooding the UI
    const bufferOutput = (data) => {
      outputBuffer += data.toString();
      if (!this._flushTimer) {
        this._flushTimer = setTimeout(() => {
          flushBuffer();
          this._flushTimer = null;
        }, 16); // ~60fps
      }
    };
    
    process.stdout.on('data', bufferOutput);
    process.stderr.on('data', (data) => {
      console.error('Ollama terminal stderr:', data.toString());
      bufferOutput(data);
    });
    
    process.on('close', (code) => {
      isAlive = false;
      flushBuffer();
      console.log(`Ollama terminal process exited with code ${code}`);
      onEnd();
    });
    
    process.on('error', (error) => {
      console.error('Ollama terminal error:', error);
      if (isAlive) {
        onEnd();
      }
    });
    
    return {
      write: (data) => {
        if (isAlive) {
          process.stdin.write(data);
        }
      },
      resize: (cols, rows) => {
        if (isAlive && process.platform !== 'win32') {
          process.kill(process.pid, 'SIGWINCH');
        }
      },
      destroy: () => {
        if (isAlive) {
          isAlive = false;
          process.kill('SIGTERM');
        }
      }
    };
  },

  // Stream text generation (for larger responses)
  streamGenerate: (model, prompt, onData, onEnd, onError, options = {}) => {
    const {
      maxTokens = 128,
      temperature = 0.7,
      numCtx = 4096,
      numGpu = 25
    } = options;

    const command = `ollama run ${model} \"${prompt}\" \
      --num_ctx ${numCtx} \
      --num_gpu ${numGpu} \
      --temp ${temperature} \
      --stream`;

    const child = exec(command);
    
    child.stdout.on('data', (data) => {
      onData(data.toString());
    });

    child.stderr.on('data', (data) => {
      console.error('Error from Ollama:', data.toString());
      onError(data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        onEnd();
      } else {
        onError(`Process exited with code ${code}`);
      }
    });

    return () => {
      child.kill();
    };
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // System information
  system: {
    getInfo: () => {
      return new Promise((resolve) => {
        ipcRenderer.once('get-system-info-reply', (event, data) => {
          resolve(data);
        });
        ipcRenderer.send('get-system-info');
      });
    },
    
    // Terminal emulation
    createTerminal: () => {
      const terminal = new Terminal();
      return {
        onData: (callback) => terminal.on('data', callback),
        onClose: (callback) => terminal.on('close', callback),
        write: (data) => terminal.write(data),
        resize: (cols, rows) => terminal.resize(cols, rows),
        destroy: () => terminal.destroy()
      };
    }
  },
  
  // Ollama API
  ollama: {
    // Terminal integration
    startTerminal: (model, onData, onEnd) => {
      return ollama.startTerminal(model, onData, onEnd);
    },
    listModels: () => ipcRenderer.invoke('ollama:list-models'),
    generate: (model, prompt, options) => ipcRenderer.invoke('ollama:generate', model, prompt, options),
    streamGenerate: (model, prompt, onData, onEnd, onError, options) => {
      const listener = (event, chunk) => onData(chunk);
      ipcRenderer.on('ollama:stream-data', listener);
      
      ipcRenderer.invoke('ollama:stream-generate', model, prompt, options)
        .then(() => {
          ipcRenderer.off('ollama:stream-data', listener);
          onEnd();
        })
        .catch(error => {
          ipcRenderer.off('ollama:stream-data', listener);
          onError(error);
        });
      
      return () => {
        ipcRenderer.off('ollama:stream-data', listener);
        ipcRenderer.send('ollama:stop-generation');
      };
    },
  },
  
  // General IPC methods
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  
  on: (channel, func) => {
    const subscription = (event, ...args) => func(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.off(channel, subscription);
  },
});

// Log when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded');});

// Log when page is fully loaded
window.addEventListener('load', () => {
  console.log('Page fully loaded');
});