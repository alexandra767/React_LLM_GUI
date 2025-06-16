import axios from 'axios';

class LLMServiceFetch {
  constructor() {
    this.baseUrl = 'http://localhost:11434';
  }

  async streamMessage(message, options = {}, onChunk) {
    try {
      const modelName = (options.model || 'deepseek-r1:8b-m4').split(' ')[0].trim();
      console.log(`[Fetch] Streaming message to ${modelName}`);

      const requestBody = {
        model: modelName,
        prompt: message,
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 4096,
          num_ctx: 8192
        }
      };

      console.log('[Fetch] Request payload:', requestBody);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: options.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('[Fetch] Stream complete');
            if (onChunk) {
              onChunk(JSON.stringify({ done: true }));
            }
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          console.log('[Fetch] Received chunk length:', chunk.length);

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
                  onChunk(JSON.stringify({
                    response: data.response,
                    done: data.done || false
                  }));
                }
              }
            } catch (e) {
              console.warn('[Fetch] Failed to parse JSON:', e.message, 'Line:', trimmedLine);
            }
          }
        }
      } catch (error) {
        console.error('[Fetch] Stream reading error:', error);
        if (onChunk) {
          onChunk(JSON.stringify({ 
            error: true, 
            response: error.message,
            done: true
          }));
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('[Fetch] Streaming error:', error);
      if (onChunk) {
        onChunk(JSON.stringify({ 
          error: true, 
          response: `Error: ${error.message}`,
          done: true
        }));
      }
    }
  }

  async sendMessage(message, model = 'deepseek-r1:8b-m4') {
    try {
      const modelName = model.split(' ')[0].trim();
      console.log(`[Fetch] Sending message to ${modelName}`);

      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: modelName,
          prompt: message,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 2048
          }
        },
        { timeout: 60000 }
      );

      return response.data;
    } catch (error) {
      console.error('[Fetch] Error in sendMessage:', error);
      return {
        response: `Error: ${error.message}`,
        done: true
      };
    }
  }

  async getModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      return response.data.models || [];
    } catch (error) {
      console.error('[Fetch] Error fetching models:', error);
      return [];
    }
  }

  async testConnection() {
    try {
      await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

const llmServiceFetch = new LLMServiceFetch();
export default llmServiceFetch;