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
      // Clean model name - remove any extra info like "(Unknown size)"
      const rawModel = options.model || 'qwen3:14b';
      const modelName = rawModel.split(' ')[0].trim();
      const isM4Model = modelName.includes('-m4');
      const isCoderModel = modelName.includes('coder');
      console.log(`Sending message to ${modelName} (raw: ${rawModel}, isM4: ${isM4Model}, isCoder: ${isCoderModel})`);
      
      // Try HTTP API first, fallback to terminal if needed
      if (false && window.electron && window.electron.exec) {
        console.log('Using terminal connection as requested');
        try {
          const exec = window.electron.exec;
          
          return new Promise((resolve) => {
            console.log(`Running terminal command: ollama run ${modelName}`);
            
            // Add parameters to improve quality and reliability
            // Note: --num-ctx is not a valid ollama run flag, it's for API only
            const m4Params = '';
            
            const command = `ollama run ${modelName} "${message.replace(/"/g, '\\"')}"`;
            
            // Execute without timeout
            exec(command, 
              { maxBuffer: 50 * 1024 * 1024 }, // No timeout, 50MB buffer
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
          console.error('Terminal setup failed:', terminalError);
          // Fall back to HTTP API if terminal fails
        }
      }
      
      // HTTP API fallback (or primary if not in Electron)
      try {
        // Send a tags check to verify Ollama API is responsive (more reliable than health endpoint)
        await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
        
        console.log("Using HTTP API (not in Electron or terminal failed)");
        
        // Set optimized parameters for M4 Macs
        const is32BQwen = modelName.includes('32b-qwen-distill-q4_K_M');
        const response = await this.axios.post('/api/generate', {
          model: modelName,
          prompt: message,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 2048,
            top_p: options.topP || 0.95,
            // Parameters optimized for M4 models
            num_gpu: 999,
            num_thread: isM4Model ? 12 : 10,
            num_ctx: is32BQwen ? 8192 : (isM4Model ? 32768 : 16384),
            batch_size: is32BQwen ? 256 : (isM4Model ? 2048 : 1024),
            use_mmap: true,
            use_mlock: false,
            f16_kv: isM4Model ? true : false,
            gpu_layers: 999,
            n_gpu_layers: 999,
            threads_batch: isM4Model ? 12 : 10,
            n_parallel: is32BQwen ? 2 : (isM4Model ? 8 : 4)
          }
        }, {
          timeout: is32BQwen ? 300000 : 120000 // 5 min timeout for 32B model
        });
        
        console.log("Received successful response from Ollama API");
        return response.data;
      } catch (apiError) {
        console.error('Ollama API Error:', apiError.message);
        
        // Try using terminal fallback if in Electron environment
        if (false && window.electron && window.electron.exec) {
          console.log('Attempting terminal fallback...');
          try {
            const exec = window.electron.exec;
            
            return new Promise((resolve) => {
              console.log(`Running terminal command: ollama run ${modelName}`);
              
              // Add parameters to improve quality and reliability
              // Note: --num-ctx is not a valid ollama run flag, it's for API only
              const m4Params = '';
              
              const command = `ollama run ${modelName} "${message.replace(/"/g, '\\"')}"`;
              
              // Execute without timeout
              exec(command, 
                { maxBuffer: 50 * 1024 * 1024 }, // No timeout, 50MB buffer
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
      // Clean model name - remove any extra info
      const rawModel = options.model || 'qwen3:14b';
      const modelName = rawModel.split(' ')[0].trim();
      console.log(`Terminal message to ${modelName} (raw: ${rawModel})`);
      
      // Force terminal connection - no streaming support
      if (window.electron && window.electron.exec) {
        console.log('Using terminal connection for all messages (no streaming)');
        
        const response = await this.sendMessage(message, options);
        
        // Simulate streaming by sending the whole response at once
        if (onChunk) {
          onChunk(JSON.stringify({
            response: response.response,
            done: false
          }));
          
          // Send done signal
          setTimeout(() => {
            onChunk(JSON.stringify({
              response: '',
              done: true
            }));
          }, 100);
        }
        
        return;
      }
      
      // If not in Electron, fall back to HTTP streaming
      try {
        // First check if Ollama is available via tags endpoint
        try {
          const checkResponse = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
          console.log('Not in Electron, using HTTP API streaming');
        } catch (checkError) {
          console.error('Ollama API unavailable for streaming:', checkError);
          throw new Error('Ollama API unavailable');
        }
        
        // Use Fetch API for better streaming support
        console.log('Using Fetch API for streaming from:', `${this.baseUrl}/api/generate`);
        console.log('Streaming model:', modelName);
        console.log('Model flags - isM4:', isM4Model, 'isCoder:', isCoderModel);
        
        // M4-optimized settings based on model size and M4 variant
        const isM4Model = modelName.includes('-m4');
        const is32BQwen = modelName.includes('32b-qwen-distill-q4_K_M');
        const isCoderModel = modelName.includes('coder');
        const isLargeModel = modelName.includes('14b') || modelName.includes('32b') || modelName.includes('70b');
        const isMediumModel = modelName.includes('7b') || modelName.includes('8b') || isCoderModel;
        
        const requestBody = {
          model: modelName,
          prompt: message,
          stream: true,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.max_tokens || 4096,
            // 24GB unified memory optimizations - special settings for 32B Qwen
            num_ctx: is32BQwen ? 8192 : (isM4Model ? 32768 : (isLargeModel ? 16384 : (isMediumModel ? 24576 : 32768))),
            num_gpu: 999, // Use all GPU layers (M4 Pro 16 GPU cores)
            num_thread: is32BQwen ? 14 : (isM4Model ? 12 : 10), // More threads for 32B Qwen
            batch_size: is32BQwen ? 256 : (isM4Model ? 2048 : (isLargeModel ? 512 : 1024)), // Smaller batches for 32B
            use_mmap: true,
            use_mlock: false,
            f16_kv: isM4Model ? true : (isLargeModel ? true : false), // Always f16 for M4
            main_gpu: 0,
            low_vram: false,
            num_batch: is32BQwen ? 256 : (isM4Model ? 2048 : 1024),
            // M4 Pro specific - optimized for 32B Qwen
            gpu_layers: 999,
            n_gpu_layers: 999,
            threads_batch: is32BQwen ? 14 : (isM4Model ? 12 : 10),
            n_parallel: is32BQwen ? 2 : (isM4Model ? 8 : 4), // Less parallel for 32B
            // Additional M4 optimizations
            rope_frequency_scale: 1.0,
            rope_scaling: "linear"
          }
        };
        
        console.log('Request payload:', requestBody);
        
        // Use fetch with streaming support
        const response = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: options.signal,
          mode: 'cors', // Explicitly set CORS mode
          credentials: 'omit' // Don't send cookies
        });

        console.log('[Fetch] Response status:', response.status);
        console.log('[Fetch] Response headers:', response.headers);
        console.log('[Fetch] Model being used:', modelName);
        console.log('[Fetch] Full request body:', JSON.stringify(requestBody, null, 2));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Fetch] Error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          let chunkCount = 0;
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('[Fetch] Stream complete, total chunks:', chunkCount);
              if (onChunk) {
                onChunk(JSON.stringify({ done: true }));
              }
              break;
            }

            chunkCount++;
            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            console.log(`[Fetch] Chunk ${chunkCount} - length: ${chunk.length}`);
            console.log(`[Fetch] Chunk preview:`, chunk.substring(0, 200));

            // Add to buffer and process lines
            buffer += chunk;
            const lines = buffer.split('\n');
            
            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || '';

            // Process complete lines
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              try {
                const data = JSON.parse(trimmedLine);
                console.log('[Fetch] Parsed data:', { 
                  hasResponse: data.response !== undefined,
                  responseLength: data.response?.length || 0,
                  done: data.done 
                });

                if (data.response !== undefined) {
                  if (onChunk) {
                    const chunkToSend = JSON.stringify({
                      response: data.response,
                      done: data.done || false
                    });
                    console.log('[Fetch] Sending chunk to callback:', chunkToSend);
                    onChunk(chunkToSend);
                  }
                }
              } catch (e) {
                console.warn('[Fetch] Failed to parse JSON:', e.message, 'Line:', trimmedLine);
              }
            }
          }
        } catch (streamError) {
          console.error('[Fetch] Stream reading error:', streamError);
          if (onChunk) {
            onChunk(JSON.stringify({ 
              error: true, 
              response: `Stream error: ${streamError.message}`,
              done: true
            }));
          }
        } finally {
          reader.releaseLock();
        }
        
        return;
      } catch (apiError) {
        console.error('Ollama API Streaming Error:', apiError);
        console.error('Error details:', {
          message: apiError.message,
          stack: apiError.stack,
          name: apiError.name
        });
        
        // Check if it's a CORS error
        if (apiError.message.includes('Failed to fetch') || apiError.name === 'TypeError') {
          console.error('This appears to be a CORS error. Ollama may need to be configured to allow CORS.');
          if (onChunk) {
            onChunk(JSON.stringify({ 
              error: true, 
              response: "CORS error: Unable to connect to Ollama. Make sure Ollama is running with CORS enabled.",
              done: true
            }));
          }
          return;
        }
        
        console.log('Falling back to mock streaming response');
        
        // Try terminal fallback for streaming if in Electron environment
        if (window.require && window.require('electron')) {
          console.log('Attempting terminal streaming fallback...');
          try {
            const { exec } = window.require('child_process');
            
            // Add parameters to improve quality and reliability
            // Note: --num-ctx is not a valid ollama run flag, it's for API only
            const command = `ollama run ${modelName} "${message.replace(/"/g, '\\"')}"`;
            
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
      console.log('Fetching available models');
      
      // Try terminal first if in Electron
      if (window.electron && window.electron.exec) {
        console.log('Using terminal to get models');
        try {
          const exec = window.electron.exec;
          
          return new Promise((resolve) => {
            exec('ollama list', (error, stdout, stderr) => {
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
                      name: parts[0].trim(),
                      details: {}
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
        } catch (terminalError) {
          console.error('Terminal setup failed:', terminalError);
          return this.getFallbackModels();
        }
      }
      
      // If not in Electron, use HTTP API as fallback
      console.log('Not in Electron, using HTTP API for models');
      const response = await axios.get(`${this.baseUrl}/api/tags`, { 
        timeout: 10000 
      });
      
      if (response.data && response.data.models) {
        const mappedModels = response.data.models.map(model => ({
          id: model.name,
          name: model.name,
          details: model.details || {}
        }));
        
        console.log(`Found ${mappedModels.length} models from API`);
        return mappedModels;
      } else {
        throw new Error('Invalid API response format');
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
      { id: 'qwen3:14B', name: 'Qwen3 (14B)', size: 'Large', type: 'local' }, // User's actual model
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', size: 'Large', type: 'cloud' }, // Cloud model
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', size: 'Medium', type: 'cloud' } // Cloud model
    ];
  }

  // Add the missing getModels method that the base class expects
  async getModels() {
    return this.getAvailableModels();
  }
}

class ClaudeAdapter extends LLMAdapter {
  constructor(config) {
    super(config);
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
    this.apiKey = config.apiKey;
    if (!this.apiKey) {
      throw new Error('Claude API key is required');
    }
  }

  async sendMessage(message, options = {}) {
    try {
      console.log('[ClaudeAdapter] Sending message to Claude API');
      
      const model = options.model || 'claude-opus-4-20250514';
      const maxTokens = options.max_tokens || 4096;
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens,
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          temperature: options.temperature || 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ClaudeAdapter] API Error:', response.status, errorText);
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[ClaudeAdapter] Response received from Claude');
      
      return {
        response: data.content[0].text,
        usage: {
          input_tokens: data.usage.input_tokens,
          output_tokens: data.usage.output_tokens
        }
      };
    } catch (error) {
      console.error('[ClaudeAdapter] Error:', error);
      throw error;
    }
  }

  async streamMessage(message, options = {}, onChunk) {
    try {
      console.log('[ClaudeAdapter] Starting streaming message to Claude API');
      
      const model = options.model || 'claude-3-5-sonnet-20241022';
      const maxTokens = options.max_tokens || 4096;
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens,
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          temperature: options.temperature || 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ClaudeAdapter] Streaming API Error:', response.status, errorText);
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('[ClaudeAdapter] Streaming complete');
            if (onChunk) {
              onChunk(JSON.stringify({ done: true }));
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  if (onChunk) {
                    onChunk(JSON.stringify({ 
                      response: parsed.delta.text,
                      done: false 
                    }));
                  }
                }
              } catch (parseError) {
                console.warn('[ClaudeAdapter] Failed to parse streaming chunk:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('[ClaudeAdapter] Streaming error:', error);
      throw error;
    }
  }

  async getModels() {
    return [
      { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus', size: 'Extra Large', type: 'cloud' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', size: 'Large', type: 'cloud' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', size: 'Medium', type: 'cloud' }
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

  // Enhanced API that includes memory integration for consistent name recognition
  async generateResponse(message, options = {}) {
    try {
      const startTime = Date.now();
      
      // Load memory context for name questions
      let memoryContext = {};
      let userName = null;
      
      // Check if this is a name-related or memory question
      const lowerMessage = message.toLowerCase();
      const isNameQuestion = lowerMessage.includes("what's my name") || 
                           lowerMessage.includes("whats my name") ||
                           lowerMessage.includes("what is my name") ||
                           lowerMessage.includes("do you know my name") ||
                           lowerMessage.includes("who am i");
                           
      const isRememberQuestion = lowerMessage.includes("do you remember me") ||
                               lowerMessage.includes("do you rember me") || // Handle typo
                               lowerMessage.includes("remember me") ||
                               lowerMessage.includes("do you know me");
      
      if (isNameQuestion || isRememberQuestion) {
        try {
          // Load memory from UnifiedStorageService
          const memoryData = localStorage.getItem('aria_memory_system');
          if (memoryData) {
            const parsed = JSON.parse(memoryData);
            const personalMap = new Map(parsed.personal || []);
            const storedName = personalMap.get('name')?.value || personalMap.get('user_name')?.value;
            
            // CRITICAL: Block corrupted names like "meeting"
            const corruptedNames = ['meeting', 'Meeting', 'birthday', 'Birthday', 'Family', 'Friend'];
            if (storedName && !corruptedNames.includes(storedName)) {
              userName = storedName;
              console.log('[LLMService] ✅ Using stored name:', storedName);
            } else {
              console.log('[LLMService] ❌ Blocked corrupted stored name:', storedName, '- using Alexandra');
              userName = 'Alexandra'; // Force correct name
            }
          }
          
          // Fallback to default if no name found
          if (!userName) {
            userName = 'Alexandra';
            console.log('[LLMService] Using fallback name: Alexandra');
          }
        } catch (error) {
          console.error('[LLMService] Error loading memory:', error);
          userName = 'Alexandra'; // Fallback
        }
      }
      
      // Build enhanced prompt with memory context for name and memory questions
      let enhancedMessage = message;
      if (isNameQuestion && userName) {
        enhancedMessage = `IDENTITY CLARIFICATION:
- You are an AI assistant called Aria
- The human user you're talking to is called ${userName}
- These are completely different names: Aria (you) vs ${userName} (them)

The user is asking if you know their name. Their name is ${userName}.

Respond exactly like this: "Hello ${userName}! Yes, I know your name is ${userName}. How can I help you today?"

Do NOT say "Hello Aria" - that's YOUR name, not theirs. Their name is ${userName}.`;
      } else if (isRememberQuestion && userName) {
        enhancedMessage = `IDENTITY CLARIFICATION:
- You are an AI assistant called Aria
- The human user you're talking to is called ${userName}
- These are completely different names: Aria (you) vs ${userName} (them)

The user is asking if you remember them. Their name is ${userName}.

Respond exactly like this: "Hi ${userName}! I have your personal information and our conversation history stored in my memory system. I know your name is ${userName} and can recall what we've discussed previously to help you better. How can I assist you today?"

Do NOT say "Hello Aria" - that's YOUR name, not theirs. Their name is ${userName}.`;
      }
      
      // Send to current adapter
      const adapter = this.getCurrentAdapter();
      const response = await adapter.sendMessage(enhancedMessage, options);
      
      // Clean response for identity confusion
      let cleanedResponse = response.response;
      if (userName && cleanedResponse) {
        // Fix identity confusion - replace "Hello Aria!" with user's name
        cleanedResponse = cleanedResponse
          .replace(/Hello Aria!/gi, `Hello ${userName}!`)
          .replace(/Hi Aria!/gi, `Hi ${userName}!`)
          .replace(/Hello! I'm Monica/gi, "Hello! I'm Aria")
          .replace(/Hi! I'm Monica/gi, "Hi! I'm Aria")
          .replace(/I'm Monica/gi, "I'm Aria")
          .replace(/I am Monica/gi, "I am Aria")
          .replace(/Monica/gi, "Aria")
          .replace(/I'm Qwen/gi, "I'm Aria")
          .replace(/I am Qwen/gi, "I am Aria")
          .replace(/Qwen/gi, "Aria")
          .replace(/I'm DeepSeek/gi, "I'm Aria")
          .replace(/I am DeepSeek/gi, "I am Aria")
          .replace(/DeepSeek/gi, "Aria");
      }
      
      return {
        text: cleanedResponse || response.response,
        tokens: {
          input: Math.ceil(message.length / 4),
          output: Math.ceil((cleanedResponse || response.response || '').length / 4),
        },
        duration: (Date.now() - startTime) / 1000,
      };
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw error;
    }
  }
}

// Create and configure service instance
const llmService = new LLMService();

// Function to initialize adapters based on available configuration
function initializeAdapters() {
  // Always register Ollama adapter for local models
  llmService.registerAdapter('ollama', new OllamaAdapter({
    baseUrl: 'http://localhost:11434'
  }));

  llmService.registerAdapter('terminal', new TerminalAdapter({
    command: 'ollama'
  }));

  // Check for Claude API key and register Claude adapter if available
  try {
    const settings = localStorage.getItem('sephia_settings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      if (parsedSettings.claudeApiKey) {
        console.log('[LLMService] Claude API key found, registering Claude adapter');
        llmService.registerAdapter('claude', new ClaudeAdapter({
          apiKey: parsedSettings.claudeApiKey
        }));
        
        // Check current model to determine which adapter to use
        const currentModel = localStorage.getItem('sephia_current_model');
        if (currentModel && currentModel.startsWith('claude-')) {
          console.log('[LLMService] Setting Claude as active adapter for model:', currentModel);
          llmService.setAdapter('claude');
          return;
        }
      }
    }
  } catch (error) {
    console.warn('[LLMService] Error checking Claude configuration:', error);
  }

  // Default to Ollama if Claude not available or not preferred
  llmService.setAdapter('ollama');
}

// Initialize adapters
initializeAdapters();

// Export function to reinitialize when settings change
llmService.reinitialize = initializeAdapters;

export default llmService;