// Simple streaming service that just works
class SimpleStreamingService {
  async streamChat(message, model, onChunk, onComplete, onError) {
    console.log('[SimpleStreaming] Starting stream for:', message);
    
    try {
      // Clean model name - remove any extra info like "(Unknown size)"
      const cleanModel = (model || 'deepseek-r1:8b-m4').split(' ')[0].trim();
      
      // Check if we're in Electron and prefer terminal streaming
      if (window.require && window.require('electron')) {
        console.log('[SimpleStreaming] Using terminal streaming in Electron');
        return this.streamViaTerminal(message, cleanModel, onChunk, onComplete, onError);
      }
      
      // Otherwise use HTTP API
      console.log('[SimpleStreaming] Using HTTP API streaming');
      
      const requestBody = {
        model: cleanModel,
        prompt: message,
        stream: true
      };
      
      console.log('[SimpleStreaming] Request:', requestBody);
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SimpleStreaming] Response error:', errorText);
        
        // Check for specific model loading error
        if (errorText.includes('model') && errorText.includes('not found')) {
          throw new Error(`Model "${cleanModel}" not found. Please run: ollama pull ${cleanModel}`);
        } else if (errorText.includes('failed to load model')) {
          throw new Error(`Failed to load model "${cleanModel}". Please ensure it's installed with: ollama pull ${cleanModel}`);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      console.log('[SimpleStreaming] Response OK, starting to read stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let chunkCount = 0;
      let lastActivityTime = Date.now();
      const TIMEOUT_MS = 120000; // 2 minute timeout
      let timeoutHandle = null;

      // Set up timeout handler
      const resetTimeout = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        timeoutHandle = setTimeout(() => {
          console.error('[SimpleStreaming] Stream timeout - no activity for 2 minutes');
          reader.cancel();
          if (onError) onError(new Error('Stream timeout - no response from model'));
        }, TIMEOUT_MS);
      };

      resetTimeout(); // Start initial timeout

      while (true) {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`[SimpleStreaming] Stream complete. Total chunks: ${chunkCount}, Total length: ${fullContent.length}`);
            if (timeoutHandle) clearTimeout(timeoutHandle);
            if (onComplete) onComplete(fullContent);
            break;
          }
          
          // Track activity time and reset timeout
          const now = Date.now();
          const timeSinceLastActivity = now - lastActivityTime;
          lastActivityTime = now;
          resetTimeout(); // Reset timeout on activity
          
          console.log(`[SimpleStreaming] Read activity - time since last: ${timeSinceLastActivity}ms`);

        // Decode chunk
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullContent += data.response;
              
              // Prevent content from growing too large (10MB limit)
              if (fullContent.length > 10 * 1024 * 1024) {
                console.error('[SimpleStreaming] Content too large, stopping stream');
                if (timeoutHandle) clearTimeout(timeoutHandle);
                if (onError) onError(new Error('Response too large (>10MB)'));
                reader.cancel();
                return;
              }
              
              console.log('[SimpleStreaming] Got chunk:', {
                chunk: data.response,
                totalLength: fullContent.length,
                done: data.done
              });
              if (onChunk) {
                chunkCount++;
                console.log(`[SimpleStreaming] Calling onChunk callback #${chunkCount}`);
                onChunk(data.response, fullContent);
              }
            }
            
            // If model indicates it's done, complete the stream
            if (data.done) {
              console.log('[SimpleStreaming] Model indicated completion');
              if (timeoutHandle) clearTimeout(timeoutHandle);
              if (onComplete) onComplete(fullContent);
              return;
            }
          } catch (e) {
            console.warn('[SimpleStreaming] Parse error:', e.message);
          }
        }
        } catch (readError) {
          console.error('[SimpleStreaming] Error reading stream:', readError);
          if (onError) onError(readError);
          break;
        }
      }
    } catch (error) {
      console.error('[SimpleStreaming] Error:', error);
      console.error('[SimpleStreaming] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      if (onError) onError(error);
    }
  }
  
  async streamViaTerminal(message, model, onChunk, onComplete, onError) {
    console.log('[SimpleStreaming] Terminal streaming for model:', model);
    
    try {
      const { spawn } = window.require('child_process');
      
      // Create a shell command that pipes the message to ollama
      const escapedMessage = message.replace(/'/g, "'\\''");
      
      console.log('[SimpleStreaming] Running ollama with message:', message);
      
      // Use sh -c to run the command with echo piping
      const child = spawn('sh', ['-c', `echo '${escapedMessage}' | ollama run ${model}`], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, TERM: 'dumb' }
      });
      
      let fullContent = '';
      let buffer = '';
      let lastUpdateTime = Date.now();
      let isFirstChunk = true;
      
      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        console.log('[SimpleStreaming] Terminal chunk received:', {
          length: chunk.length,
          preview: chunk.substring(0, 50),
          raw: chunk
        });
        
        // Skip the first chunk if it's just the model loading message
        if (isFirstChunk && chunk.includes('Loading model')) {
          isFirstChunk = false;
          console.log('[SimpleStreaming] Skipping model loading message');
          return;
        }
        isFirstChunk = false;
        
        // Clean ANSI escape codes
        const cleanedChunk = chunk.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        
        // Add to full content
        fullContent += cleanedChunk;
        
        // Call onChunk with the new chunk and full content
        if (onChunk) {
          console.log('[SimpleStreaming] Calling onChunk callback:', {
            newChunkLength: cleanedChunk.length,
            totalLength: fullContent.length,
            cleanedChunk: cleanedChunk.substring(0, 50)
          });
          onChunk(cleanedChunk, fullContent);
        }
      });
      
      child.stderr.on('data', (data) => {
        console.error('[SimpleStreaming] Terminal stderr:', data.toString());
      });
      
      child.on('close', (code) => {
        console.log('[SimpleStreaming] Terminal process closed with code:', code);
        if (code === 0 && onComplete) {
          onComplete(fullContent);
        } else if (code !== 0 && onError) {
          onError(new Error(`Process exited with code ${code}`));
        }
      });
      
      child.on('error', (err) => {
        console.error('[SimpleStreaming] Terminal spawn error:', err);
        if (onError) onError(err);
      });
      
    } catch (error) {
      console.error('[SimpleStreaming] Terminal streaming error:', error);
      if (onError) onError(error);
    }
  }
}

export default new SimpleStreamingService();