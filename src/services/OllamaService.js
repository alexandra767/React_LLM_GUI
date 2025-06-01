class OllamaService {
  constructor() {
    this.baseUrl = 'http://localhost:11434/api';
    this.isLocal = process.env.NODE_ENV === 'development' || window.electron;
  }

  async listModels() {
    // Cache models to prevent excessive API calls
    if (this._modelsCache && this._modelsCacheTime && (Date.now() - this._modelsCacheTime) < 30000) {
      console.log('[OllamaService] Using cached models');
      return this._modelsCache;
    }

    try {
      let models = [];
      
      // Try Electron API first if available
      if (this.isLocal && window.electron) {
        try {
          const response = await window.electron.ollama.listModels();
          // Parse the response if it's a string
          if (typeof response === 'string') {
            try {
              const parsed = JSON.parse(response);
              if (Array.isArray(parsed)) {
                models = parsed;
              } else if (parsed && parsed.models) {
                models = parsed.models;
              }
            } catch (e) {
              console.error('Error parsing models response:', e);
            }
          } else if (Array.isArray(response)) {
            models = response;
          }
        } catch (e) {
          console.warn('Error using Electron API, falling back to HTTP:', e);
        }
      }
      
      // If no models from Electron, try HTTP API
      if (models.length === 0) {
        try {
          const response = await fetch(`${this.baseUrl}/tags`, { 
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          if (response.ok) {
            const data = await response.json();
            models = data.models || [];
          }
        } catch (e) {
          console.error('Error fetching models via HTTP:', e);
          // Return fallback models if API fails
          return this._getFallbackModels();
        }
      }
      
      // Format models to a consistent structure
      const formattedModels = models.map(model => ({
        name: model.name || model,
        size: model.size,
        modified: model.modified_at || model.modified
      }));

      // Cache the results
      this._modelsCache = formattedModels;
      this._modelsCacheTime = Date.now();
      
      return formattedModels;
      
    } catch (error) {
      console.error('Error listing models:', error);
      return this._getFallbackModels();
    }
  }

  _getFallbackModels() {
    return [
      { name: 'qwen3:14B', size: '8.2GB', modified: '2024-06-01' }
    ];
  }

  async generate(model, prompt, options = {}) {
    const defaultOptions = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.7,
        num_ctx: 4096,
        num_gpu: 25,
        num_thread: 10,
        batch_size: 512,
        ...options
      }
    };

    try {
      if (this.isLocal && window.electron) {
        return await window.electron.ollama.generate(
          model,
          prompt,
          defaultOptions.options
        );
      }

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultOptions),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async streamGenerate(model, prompt, onData, onEnd, onError, options = {}) {
    // Get system info from main process if in Electron
    let systemInfo = { cpus: 4 }; // Default fallback
    if (window.electron) {
      try {
        systemInfo = await window.electron.system.getInfo();
      } catch (err) {
        console.warn('Failed to get system info:', err);
      }
    }

    const defaultOptions = {
      model,
      prompt,
      stream: true,
      options: {
        temperature: 0.7,
        num_ctx: 4096,
        num_gpu: 25,
        num_thread: Math.max(2, Math.floor(systemInfo.cpus / 2)),
        ...options
      }
    };

    if (this.isLocal && window.electron) {
      try {
        return window.electron.ollama.streamGenerate(
          model,
          prompt,
          onData,
          onEnd,
          onError,
          defaultOptions.options
        );
      } catch (error) {
        console.error('Error in streamGenerate:', error);
        if (onError) onError(error);
        return () => {}; // Return empty cleanup function
      }
    }

    // Fallback to fetch API if not in Electron
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(defaultOptions),
      signal,
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      function processChunk() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            if (onEnd) onEnd();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          lines.forEach(line => {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (onData) onData(data.response || '');
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          });

          return processChunk();
        });
      }

      return processChunk();
    })
    .catch(error => {
      if (error.name !== 'AbortError' && onError) {
        onError(error);
      }
    });

    return () => controller.abort();
  }
}

export default new OllamaService();
