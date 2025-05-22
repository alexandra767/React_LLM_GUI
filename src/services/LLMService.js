import axios from 'axios';

class LLMAdapter {
  constructor(config) {
    this.config = config;
  }
  
  async sendMessage() {
    throw new Error('Method must be implemented by specific adapter');
  }
  
  async getModels() {
    throw new Error('Method must be implemented by specific adapter');
  }
}

class OllamaAdapter extends LLMAdapter {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000, // Increased timeout for better reliability
      // Set aggressive retry options for M4 Mac which might have temporary API connection issues
      retry: 5, // Increased retries
      retryDelay: 2000, // Increased delay between retries
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Add a request interceptor to monitor connection issues
    this.axios.interceptors.request.use(function (config) {
      console.log(`Making request to ${config.url} with method ${config.method}`);
      return config;
    }, function (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    });
    
    // Add response interceptor to debug issues
    this.axios.interceptors.response.use(function (response) {
      console.log(`Response received from ${response.config.url} with status ${response.status}`);
      return response;
    }, function (error) {
      console.error('Response interceptor error:', error);
      return Promise.reject(error);
    });
    
    console.log(`OllamaAdapter initialized with baseUrl: ${this.baseUrl}`);
  }
  
  async sendMessage(message, options = {}) {
    try {
      const modelName = options.model || 'deepseek-r1:8b-m4';
      console.log(`Sending message to ${modelName}`);
      
      // First check if Ollama is running before making the request
      try {
        // Send a tags check to verify Ollama API is responsive (more reliable than health endpoint)
        await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
        
        console.log("Ollama API is available, proceeding with request");
        
        // Set optimized parameters for M4 Macs
        const response = await this.axios.post('/api/generate', {
          model: modelName,
          prompt: message,
          stream: false,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          top_p: options.topP || 0.95,
          // Parameters optimized for faster response on M4 Macs
          num_gpu: 1,
          num_thread: 8,
          tfs_z: 1.0,
        }, {
          timeout: 120000 // Longer timeout for model loading on M4
        });
        
        console.log("Received successful response from Ollama API");
        return response.data;
      } catch (apiError) {
        console.error('Ollama API Error:', apiError.message);
        
        // Try using terminal fallback if in Electron environment
        if (window.require && window.require('electron')) {
          console.log('Attempting terminal fallback...');
          try {
            const { exec } = window.require('child_process');
            
            return new Promise((resolve) => {
              console.log(`Running terminal command: ollama run ${modelName}`);
              
              // Add parameters to improve quality and reliability
              const command = `ollama run ${modelName} \
                --num-ctx 8192 \
                --num-gpu 1 \
                --num-thread 8 \
                "${message.replace(/"/g, '\\"')}"`;
              
              // Execute with longer timeout
              exec(command, 
                { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }, // 3 min timeout, 10MB buffer
                (error, stdout, stderr) => {
                  if (error) {
                    console.error('Terminal command error:', error);
                    // Log stderr for debugging
                    if (stderr) {
                      console.error('Terminal stderr:', stderr);
                    }
                    resolve(this.getErrorResponse(message));
                    return;
                  }
                  
                  if (stdout) {
                    console.log('Terminal command output received, length:', stdout.length);
                    // Process stdout to remove any potential terminal control sequences
                    const cleanedOutput = stdout.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
                    
                    resolve({
                      model: modelName,
                      response: cleanedOutput,
                      done: true
                    });
                  } else {
                    console.warn('Terminal command returned empty output');
                    resolve(this.getErrorResponse(message));
                  }
              });
            });
          } catch (terminalError) {
            console.error('Terminal fallback failed:', terminalError);
            return this.getErrorResponse(message);
          }
        } else {
          console.log('Falling back to mock response');
          return this.getErrorResponse(message);
        }
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return this.getErrorResponse(message);
    }
  }
  
  // Helper for creating error responses
  getErrorResponse(message) {
    return {
      response: `Hello! I'm a simulated response since the connection to Ollama failed. You said: "${message}"\n\nTo get real responses, make sure:\n\n1. Ollama is running on your system with the command: 'ollama serve'\n2. The models are properly installed with 'ollama pull MODEL_NAME'\n3. The correct API endpoint (http://localhost:11434) is being used\n4. Your firewall is not blocking connections to localhost:11434\n5. You have no proxy or VPN interfering with local connections`,
      done: true
    };
  }
  
  async streamMessage(message, options = {}, onChunk) {
    try {
      console.log(`Streaming message to ${options.model || 'default model'}`);
      
      try {
        // First check if Ollama is available via tags endpoint
        try {
          const checkResponse = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
          console.log('Ollama API is available, proceeding with streaming');
        } catch (checkError) {
          console.error('Ollama API unavailable for streaming:', checkError);
          throw new Error('Ollama API unavailable');
        }
        
        // Handle streaming with Ollama API
        console.log('Attempting to stream from Ollama API:', `${this.baseUrl}/api/generate`);
        
        // Use XMLHttpRequest for streaming support
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${this.baseUrl}/api/generate`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.responseType = 'text';
        xhr.timeout = 180000; // 3 minute timeout for long responses
        
        // Buffer for processing incomplete chunks
        let buffer = '';
        let fullResponse = '';
        
        // Handle streaming response
        xhr.onprogress = function() {
          const newData = xhr.responseText;
          if (!newData || newData === fullResponse) return;
          
          // Update our record of the full response
          fullResponse = newData;
          
          // Process any new complete JSON objects
          const lines = newData.split('\n');
          
          // Process each complete line as a separate JSON object
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            try {
              // Skip HTTP response headers which can appear in the output
              if (line.startsWith('HTTP/1.1')) {
                console.log('Skipping HTTP header:', line);
                continue;
              }
              
              const data = JSON.parse(line);
              
              // Debug only first 20 chars to avoid console spam
              if (data.response) {
                console.log('Received data chunk:', { 
                  response: data.response.substring(0, 20) + '...',
                  done: data.done 
                });
              }
              
              // Make sure the response is properly formatted
              if (data.response) {
                // Always ensure it's a proper string
                data.response = String(data.response);
                
                // Send the chunk to the callback
                if (onChunk) {
                  onChunk(JSON.stringify(data));
                }
              }
            } catch (e) {
              // This is likely an incomplete JSON object at the end
              if (i === lines.length - 1) {
                buffer = line;
              } else {
                console.warn('Error parsing JSON chunk:', e.message);
                
                // Try to handle any plaintext response - only if it seems to be actual content
                if (typeof line === 'string' && line.length > 10 && !line.includes('HTTP/1.1')) {
                  if (onChunk) {
                    console.log('Sending plaintext chunk as fallback');
                    onChunk(JSON.stringify({ response: line }));
                  }
                }
              }
            }
          }
        };
        
        // Handle completion
        xhr.onload = function() {
          if (xhr.status === 200) {
            console.log('Stream completed successfully');
            
            // If we have a buffer with content at the end, try sending it
            if (buffer && buffer.length > 0) {
              try {
                const data = JSON.parse(buffer);
                if (data.response && onChunk) {
                  onChunk(JSON.stringify(data));
                }
              } catch (e) {
                // If we can't parse as JSON but it looks like content, send as text
                if (buffer.length > 10 && onChunk) {
                  onChunk(JSON.stringify({ response: buffer, done: true }));
                }
              }
            }
            
            // Signal completion
            if (onChunk) {
              onChunk(JSON.stringify({ done: true }));
            }
          } else {
            console.error('Stream error:', xhr.status, xhr.statusText);
            
            // Send an error notification to the callback
            if (onChunk) {
              onChunk(JSON.stringify({ 
                error: true, 
                response: "Error connecting to Ollama API. Check that Ollama is running on your system." 
              }));
            }
          }
        };
        
        // Handle errors
        xhr.onerror = function() {
          console.error('XHR Error in streamMessage');
          
          // Send an error notification to the callback
          if (onChunk) {
            onChunk(JSON.stringify({ 
              error: true, 
              response: "Network error when connecting to Ollama API. Check your connection and that Ollama is running." 
            }));
          }
        };
        
        // Handle timeouts
        xhr.ontimeout = function() {
          console.error('XHR Timeout in streamMessage');
          
          // Send an error notification to the callback
          if (onChunk) {
            onChunk(JSON.stringify({ 
              error: true, 
              response: "Connection to Ollama API timed out. The model might be taking too long to respond or Ollama might be unresponsive." 
            }));
          }
        };
        
        // Send the request with optimized parameters
        xhr.send(JSON.stringify({
          model: options.model || 'deepseek-r1:8b-m4',
          prompt: message,
          stream: true,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          top_p: options.topP || 0.95,
          // Parameters for improved response quality
          num_ctx: 8192,
          num_predict: 2048,
          stop: [], // No specific stop sequences
          num_gpu: 1, // Use GPU for acceleration
          num_thread: 8, // Use multiple threads for processing
        }));
        
        // Return a placeholder since the actual response is handled via callbacks
        return { pending: true };
      } catch (apiError) {
        console.error('Ollama API Streaming Error:', apiError);
        console.log('Falling back to mock streaming response');
        
        // Try terminal fallback for streaming if in Electron environment
        if (window.require && window.require('electron')) {
          console.log('Attempting terminal streaming fallback...');
          try {
            const { exec } = window.require('child_process');
            
            // Add parameters to improve quality and reliability
            const command = `ollama run ${options.model || 'deepseek-r1:8b-m4'} \
              --num-ctx 8192 \
              --num-gpu 1 \
              --num-thread 8 \
              "${message.replace(/"/g, '\\"')}"`;
            
            console.log(`Running terminal command: ${command}`);
            
            const child = exec(command, { 
              timeout: 300000, // 5 min timeout 
              maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });
            
            let buffer = '';
            
            // Handle streaming output
            child.stdout.on('data', (data) => {
              console.log('Terminal chunk received, length:', data.length);
              buffer += data;
              
              // Clean the data from ANSI escape codes
              const cleanedOutput = data.toString().replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
              
              // Send chunks to callback
              if (onChunk) {
                onChunk(JSON.stringify({ 
                  response: cleanedOutput,
                  done: false 
                }));
              }
            });
            
            // Handle process completion
            child.on('close', (code) => {
              console.log(`Terminal process exited with code ${code}`);
              
              if (onChunk) {
                onChunk(JSON.stringify({ done: true }));
              }
            });
            
            // Handle errors
            child.on('error', (err) => {
              console.error('Terminal error:', err);
              
              if (onChunk) {
                onChunk(JSON.stringify({ 
                  error: true,
                  response: `Terminal error: ${err.message}`,
                  done: true
                }));
              }
            });
            
            return { pending: true };
          } catch (terminalError) {
            console.error('Terminal streaming fallback failed:', terminalError);
            // Continue to mock response if terminal fails
          }
        }
        
        // If terminal fallback failed or not in Electron, use mock response
        console.log('Using mock streaming response');
        const mockResponseParts = [
          { response: "This is a simulated response since the connection to Ollama failed.\n" },
          { response: "You asked: \"" + message + "\"\n\n" },
          { response: "To get real responses from your local model, make sure:\n\n" },
          { response: "1. Ollama is running on your system with `ollama serve`\n" },
          { response: "2. You have the correct model installed (currently trying: " + (options.model || 'default') + ")\n" },
          { response: "3. The API endpoint is correctly configured in settings\n" },
          { response: "4. Your firewall is not blocking connections to localhost:11434\n" },
          { response: "5. Ollama has enough GPU/CPU resources available\n\n" },
          { response: "Debug info: " + (apiError.message || 'Unknown error') + "\n\n" },
          { response: "[MOCK RESPONSE - NOT FROM LOCAL LLM]" },
          { done: true }
        ];
        
        // Simulate streaming
        let index = 0;
        const sendMockChunks = async () => {
          if (index < mockResponseParts.length) {
            if (onChunk) {
              onChunk(JSON.stringify(mockResponseParts[index]));
            }
            index++;
            setTimeout(sendMockChunks, 150);
          }
        };
        
        sendMockChunks();
        return { pending: true };
      }
    } catch (error) {
      console.error('Error in streamMessage:', error);
      
      if (onChunk) {
        onChunk(JSON.stringify({ 
          response: "Sorry, I encountered an error connecting to your local LLM. This is a simulated response, not from your model.\n\nPlease check if Ollama is running correctly on your system with the 'ollama serve' command.",
          error: true
        }));
      }
      
      return { error: true, done: true };
    }
  }
  
  async getAvailableModels() {
    try {
      console.log('Fetching available models from Ollama');
      
      try {
        // Increase timeout for M4 Macs which may need more time to respond
        const response = await axios.get(`${this.baseUrl}/api/tags`, { 
          timeout: 10000  // 10 second timeout 
        });
        
        console.log('API response received, processing models...');
        
        if (response.data && response.data.models) {
          // Map the models to a consistent format for the UI
          const mappedModels = response.data.models.map(model => ({
            id: model.name,
            name: model.name,
            details: model.details || {}
          }));
          
          console.log(`Found ${mappedModels.length} models`);
          return mappedModels;
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (apiError) {
        console.error('Failed to fetch models from API:', apiError);
        console.log('Falling back to direct terminal command');
        
        try {
          // Try shell exec as fallback if electron allows it
          if (window.require && window.require('electron')) {
            const { exec } = window.require('child_process');
            
            return new Promise((resolve) => {
              exec('ollama list -v', (error, stdout, stderr) => {
                if (error) {
                  console.error('Terminal command error:', error);
                  // Fall back to hardcoded models
                  resolve(this.getFallbackModels());
                  return;
                }
                
                if (stdout) {
                  // Parse the output of ollama list to extract models
                  const lines = stdout.split('\n').filter(line => line.trim().length > 0);
                  // Skip the header line
                  const modelLines = lines.slice(1);
                  
                  const parsedModels = modelLines.map(line => {
                    const parts = line.split(/\s+/);
                    if (parts.length >= 2) {
                      return {
                        id: parts[0].trim(),
                        name: parts[0].trim()
                      };
                    }
                    return null;
                  }).filter(model => model !== null);
                  
                  if (parsedModels.length > 0) {
                    console.log(`Found ${parsedModels.length} models from terminal`);
                    resolve(parsedModels);
                  } else {
                    resolve(this.getFallbackModels());
                  }
                } else {
                  resolve(this.getFallbackModels());
                }
              });
            });
          } else {
            return this.getFallbackModels();
          }
        } catch (terminalError) {
          console.error('Terminal fallback failed:', terminalError);
          return this.getFallbackModels();
        }
      }
    } catch (error) {
      console.error('Error in getModels:', error);
      return this.getFallbackModels();
    }
  }
  
  // Helper method to provide consistent fallback models
  getFallbackModels() {
    console.log('Using fallback model list');
    return [
      { id: 'deepseek-r1:32b', name: 'DeepSeek (32B)' },
      { id: 'deepseek-r1:8b-m4', name: 'DeepSeek 8B-M4' },
      { id: 'deepseek-r1:14b-m4', name: 'DeepSeek 14B-M4' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek 8B' },
      { id: 'deepseek-r1:14b', name: 'DeepSeek 14B' },
      { id: 'llama3', name: 'Llama 3 (8B)' },
      { id: 'mistral', name: 'Mistral (7B)' }
    ];
  }
}

class TerminalAdapter extends LLMAdapter {
  constructor(config) {
    super(config);
    this.command = config.command || 'ollama';
  }
  
  async sendMessage(message, options = {}) {
    try {
      // In a real implementation, this would use a Node.js child_process or similar
      // to execute terminal commands. For the browser environment, you'd need a backend
      // service to handle this.
      console.log(`[Terminal] Sending message to ${options.model || 'default model'}`);
      
      // Simulate a response
      return {
        response: `This is a simulated response from the terminal adapter. 
        In a real implementation, this would execute: 
        ${this.command} run ${options.model || 'llama3'} "${message}"`
      };
    } catch (error) {
      console.error('Terminal Execution Error:', error);
      throw new Error('Failed to execute the LLM command in terminal');
    }
  }
  
  async getModels() {
    // Simulate getting models from terminal
    try {
      // In a real implementation, this would execute a terminal command
      const models = [
        { id: 'llama3', name: 'Llama 3 (8B)' },
        { id: 'mistral', name: 'Mistral (7B)' },
        { id: 'codellama', name: 'Code Llama (13B)' }
      ];
      return models;
    } catch (error) {
      console.error('Failed to get models from terminal:', error);
      throw new Error('Failed to get available models from terminal');
    }
  }
}

class LLMService {
  constructor() {
    this.adapters = {};
    this.currentAdapter = null;
  }
  
  registerAdapter(name, adapter) {
    this.adapters[name] = adapter;
  }
  
  setAdapter(name) {
    if (!this.adapters[name]) {
      throw new Error(`Adapter ${name} not registered`);
    }
    
    this.currentAdapter = this.adapters[name];
    return this.currentAdapter;
  }
  
  getCurrentAdapter() {
    if (!this.currentAdapter) {
      throw new Error('No adapter currently set');
    }
    
    return this.currentAdapter;
  }
  
  async sendMessage(message, options = {}) {
    const adapter = this.getCurrentAdapter();
    return adapter.sendMessage(message, options);
  }
  
  async streamMessage(message, options = {}, onChunk) {
    const adapter = this.getCurrentAdapter();
    if (typeof adapter.streamMessage === 'function') {
      return adapter.streamMessage(message, options, onChunk);
    } else {
      throw new Error('Current adapter does not support streaming');
    }
  }
  
  async getAvailableModels() {
    const adapter = this.getCurrentAdapter();
    return adapter.getModels();
  }

  // Simpler API for other components to use
  async generateResponse(message, options = {}) {
    try {
      // This would normally send the request to the actual LLM
      // For now, we'll simulate a response
      const startTime = Date.now();
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      return {
        text: `This is a simulated response to: "${message}"\n\nIn a real implementation, this would connect to your local LLM via Ollama.`,
        tokens: {
          input: Math.ceil(message.length / 4), // Roughly estimate tokens
          output: 40, // Fixed response size for simulation
        },
        duration: (Date.now() - startTime) / 1000,
      };
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw error;
    }
  }
}

// Create service instance
let llmServiceInstance = null;

const getLLMService = () => {
  if (!llmServiceInstance) {
    llmServiceInstance = new LLMService();
    
    // Register adapters
    llmServiceInstance.registerAdapter('ollama', new OllamaAdapter({
      baseUrl: 'http://localhost:11434'
    }));

    llmServiceInstance.registerAdapter('terminal', new TerminalAdapter({
      command: 'ollama'
    }));

    // Set default adapter
    llmServiceInstance.setAdapter('ollama');
  }
  
  return llmServiceInstance;
};

export default getLLMService();