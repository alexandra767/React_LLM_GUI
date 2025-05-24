// Simple streaming service that just works
class SimpleStreamingService {
  async streamChat(message, model, onChunk, onComplete, onError) {
    console.log('[SimpleStreaming] Starting stream for:', {
      message: message.substring(0, 100) + '...',
      model,
      hasOnChunk: !!onChunk,
      hasOnComplete: !!onComplete,
      hasOnError: !!onError
    });
    
    try {
      // Clean model name - remove any extra info like "(Unknown size)"
      const cleanModel = (model || 'deepseek-r1:8b-m4').split(' ')[0].trim();
      
      // For now, always use HTTP API for consistency
      // Terminal streaming seems to have buffer issues
      console.log('[SimpleStreaming] Using HTTP API for all environments');
      
      // Otherwise use HTTP API
      console.log('[SimpleStreaming] Using HTTP API streaming');
      
      // Add options to handle long responses better
      const requestBody = {
        model: cleanModel,
        prompt: message,
        stream: true,
        options: {
          num_ctx: 32768, // Increase context window
          num_predict: -1, // No limit on predictions
          temperature: 0.7
        }
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
      const TIMEOUT_MS = 0; // Disable timeout - let the stream run as long as needed
      let timeoutHandle = null;

      // Set up timeout handler - only if timeout is enabled
      const resetTimeout = () => {
        if (TIMEOUT_MS > 0) {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          timeoutHandle = setTimeout(() => {
            console.error('[SimpleStreaming] Stream timeout - no activity');
            reader.cancel();
            if (onError) onError(new Error('Stream timeout - no response from model'));
          }, TIMEOUT_MS);
        }
      };

      if (TIMEOUT_MS > 0) {
        resetTimeout(); // Start initial timeout only if enabled
      }

      let consecutiveEmptyReads = 0;
      const MAX_EMPTY_READS = 50; // Allow many empty reads - streaming can be bursty
      
      while (true) {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`[SimpleStreaming] Stream complete. Total chunks: ${chunkCount}, Total length: ${fullContent.length}`);
            if (timeoutHandle) clearTimeout(timeoutHandle);
            // Ensure we have content before completing
            if (fullContent.length > 0) {
              if (onComplete) onComplete(fullContent);
            } else {
              console.error('[SimpleStreaming] Stream ended with no content');
              if (onError) onError(new Error('Stream ended with no content'));
            }
            break;
          }
          
          // Check for empty reads
          if (!value || value.length === 0) {
            consecutiveEmptyReads++;
            console.warn(`[SimpleStreaming] Empty read #${consecutiveEmptyReads}`);
            if (consecutiveEmptyReads >= MAX_EMPTY_READS) {
              console.error('[SimpleStreaming] Too many empty reads, ending stream');
              if (fullContent.length > 0) {
                if (onComplete) onComplete(fullContent);
              } else {
                if (onError) onError(new Error('Stream stalled with empty reads'));
              }
              break;
            }
            continue;
          }
          consecutiveEmptyReads = 0;
          
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
              
              // Log when we hit certain size milestones
              if (fullContent.length > 9000 && fullContent.length < 9100) {
                console.warn('[SimpleStreaming] Approaching 9KB mark:', fullContent.length);
              }
              if (fullContent.length > 9800 && fullContent.length < 9900) {
                console.warn('[SimpleStreaming] Near 9868 byte limit:', fullContent.length);
              }
              
              // Increase content limit to 50MB for code generation
              if (fullContent.length > 50 * 1024 * 1024) {
                console.error('[SimpleStreaming] Content too large, stopping stream');
                if (timeoutHandle) clearTimeout(timeoutHandle);
                if (onError) onError(new Error('Response too large (>50MB)'));
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
                try {
                  onChunk(data.response, fullContent);
                } catch (chunkError) {
                  console.error('[SimpleStreaming] Error in onChunk callback:', chunkError);
                  // Continue streaming even if callback fails
                }
              }
            }
            
            // If model indicates it's done, complete the stream
            if (data.done) {
              console.log('[SimpleStreaming] Model indicated completion:', {
                finalLength: fullContent.length,
                done: data.done,
                lastChunk: data.response,
                preview: fullContent.substring(fullContent.length - 100)
              });
              if (timeoutHandle) clearTimeout(timeoutHandle);
              // Add a small delay to ensure all content is processed
              setTimeout(() => {
                if (onComplete) onComplete(fullContent);
              }, 100);
              return;
            }
          } catch (e) {
            console.warn('[SimpleStreaming] Parse error:', e.message);
          }
        }
        } catch (readError) {
          console.error('[SimpleStreaming] Error reading stream:', readError);
          // If we have partial content, complete with what we have
          if (fullContent.length > 0) {
            console.log('[SimpleStreaming] Completing with partial content:', fullContent.length);
            if (onComplete) onComplete(fullContent + '\n\n[Stream interrupted]');
          } else {
            if (onError) onError(readError);
          }
          break;
        }
      }
      
      // Final check - if loop exits without calling complete
      if (fullContent.length > 0) {
        console.warn('[SimpleStreaming] Stream ended without done flag:', {
          contentLength: fullContent.length,
          lastChars: fullContent.substring(fullContent.length - 100),
          isThinking: fullContent.includes('<think>') && !fullContent.includes('</think>')
        });
        if (timeoutHandle) clearTimeout(timeoutHandle);
        
        // If we're in the middle of thinking, add a note
        if (fullContent.includes('<think>') && !fullContent.includes('</think>')) {
          fullContent += '\n</think>\n\n[Response was interrupted during thinking]';
        }
        
        if (onComplete) onComplete(fullContent);
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
      // Verify we can access child_process
      let spawn;
      try {
        spawn = window.require('child_process').spawn;
        if (!spawn) throw new Error('spawn not available');
      } catch (requireError) {
        console.error('[SimpleStreaming] Failed to require child_process:', requireError);
        if (onError) onError(new Error('Terminal streaming not available in this environment'));
        return;
      }
      
      // Create a shell command that pipes the message to ollama
      const escapedMessage = message.replace(/'/g, "'\\''");
      
      console.log('[SimpleStreaming] Running ollama with:', {
        model,
        messagePreview: message.substring(0, 100) + '...'
      });
      
      // Use ollama API directly for more reliable streaming
      const ollamaPath = '/usr/local/bin/ollama'; // Standard ollama installation path
      
      console.log('[SimpleStreaming] Spawning ollama process directly');
      
      const child = spawn(ollamaPath, ['run', model], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, TERM: 'dumb' }
      });
      
      // Write the message to stdin
      child.stdin.write(escapedMessage + '\n');
      child.stdin.end();
      
      // Log process info
      console.log('[SimpleStreaming] Process spawned:', {
        pid: child.pid,
        connected: child.connected
      });
      
      let fullContent = '';
      let buffer = '';
      let lastUpdateTime = Date.now();
      let isFirstChunk = true;
      let timeoutHandle = null;
      let hasCompleted = false;
      
      // Set up timeout for terminal streaming
      const resetTimeout = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        timeoutHandle = setTimeout(() => {
          if (!hasCompleted && fullContent.length > 0) {
            console.log('[SimpleStreaming] Terminal timeout, completing with current content');
            hasCompleted = true;
            if (onComplete) onComplete(fullContent);
            child.kill();
          }
        }, 600000); // 10 minute timeout for terminal - very generous
      };
      
      resetTimeout();
      
      child.stdout.on('data', (data) => {
        resetTimeout(); // Reset timeout on activity
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
        const errorMsg = data.toString();
        console.error('[SimpleStreaming] Terminal stderr:', errorMsg);
        
        // Check for common errors
        if (errorMsg.includes('model') && errorMsg.includes('not found')) {
          if (!hasCompleted) {
            hasCompleted = true;
            const error = new Error(`Model "${model}" not found. Please run: ollama pull ${model}`);
            if (onError) onError(error);
            child.kill();
          }
        } else if (errorMsg.includes('failed to load model')) {
          if (!hasCompleted) {
            hasCompleted = true;
            const error = new Error(`Failed to load model "${model}". Please ensure it's installed.`);
            if (onError) onError(error);
            child.kill();
          }
        }
      });
      
      child.on('close', (code) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        
        console.log('[SimpleStreaming] Terminal process closed with code:', code, 'Content length:', fullContent.length);
        
        if (!hasCompleted) {
          hasCompleted = true;
          if (code === 0 || fullContent.length > 0) {
            // Complete with content even if exit code is non-zero but we have content
            if (onComplete) onComplete(fullContent);
          } else if (code !== 0 && onError) {
            onError(new Error(`Process exited with code ${code}`));
          }
        }
      });
      
      child.on('error', (err) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        
        console.error('[SimpleStreaming] Terminal spawn error:', err);
        if (!hasCompleted) {
          hasCompleted = true;
          if (fullContent.length > 0) {
            // If we have partial content, complete with it
            if (onComplete) onComplete(fullContent);
          } else {
            if (onError) onError(err);
          }
        }
      });
      
    } catch (error) {
      console.error('[SimpleStreaming] Terminal streaming error:', error);
      if (onError) onError(error);
    }
  }
}

export default new SimpleStreamingService();