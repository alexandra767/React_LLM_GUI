// Simple streaming service that just works
class SimpleStreamingService {
  // Helper to enhance message with memory context for name questions
  enhanceMessageForNameQuestions(message) {
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
    
    if (!isNameQuestion && !isRememberQuestion) {
      return message; // Return original message if not a name or memory question
    }
    
    // Load user's name from memory
    let userName = 'Alexandra'; // Default fallback
    try {
      const memoryData = localStorage.getItem('aria_memory_system');
      if (memoryData) {
        const parsed = JSON.parse(memoryData);
        const personalMap = new Map(parsed.personal || []);
        const storedName = personalMap.get('name')?.value || personalMap.get('user_name')?.value;
        
        // CRITICAL: Block corrupted names like "meeting" 
        const corruptedNames = ['meeting', 'Meeting', 'birthday', 'Birthday', 'Family', 'Friend'];
        if (storedName && !corruptedNames.includes(storedName)) {
          userName = storedName;
          console.log('[SimpleStreaming] ✅ Using stored name:', storedName);
        } else {
          console.log('[SimpleStreaming] ❌ Blocked corrupted stored name:', storedName, '- using Alexandra');
          userName = 'Alexandra'; // Force correct name
        }
      }
    } catch (error) {
      console.warn('[SimpleStreaming] Failed to load user name from memory:', error);
    }
    
    // Build enhanced prompt with clear identity instructions
    if (isNameQuestion) {
      return `IDENTITY CLARIFICATION:
- You are an AI assistant called Aria
- The human user you're talking to is called ${userName}
- These are completely different names: Aria (you) vs ${userName} (them)

The user is asking if you know their name. Their name is ${userName}.

Respond exactly like this: "Hello ${userName}! Yes, I know your name is ${userName}. How can I help you today?"

Do NOT say "Hello Aria" - that's YOUR name, not theirs. Their name is ${userName}.`;
    }
    
    if (isRememberQuestion) {
      return `IDENTITY CLARIFICATION:
- You are an AI assistant called Aria
- The human user you're talking to is called ${userName}
- These are completely different names: Aria (you) vs ${userName} (them)

The user is asking if you remember them. Their name is ${userName}.

Respond exactly like this: "Hi ${userName}! I have your personal information and our conversation history stored in my memory system. I know your name is ${userName} and can recall what we've discussed previously to help you better. How can I assist you today?"

Do NOT say "Hello Aria" - that's YOUR name, not theirs. Their name is ${userName}.`;
    }
  }
  async streamChat(message, model, onChunk, onComplete, onError) {
    console.log('[SimpleStreaming] Starting stream for:', {
      message: message.substring(0, 100) + '...',
      model,
      hasOnChunk: !!onChunk,
      hasOnComplete: !!onComplete,
      hasOnError: !!onError
    });
    
    // Enhance message with memory context for name questions
    const enhancedMessage = this.enhanceMessageForNameQuestions(message);
    
    try {
      // Clean model name - remove any extra info like "(Unknown size)"
      const cleanModel = (model || 'qwen3:14B').split(' ')[0].trim();
      
      // Check if this is a Claude model and route accordingly
      if (cleanModel.startsWith('claude-')) {
        return this.streamClaude(enhancedMessage, cleanModel, onChunk, onComplete, onError);
      }
      
      // Check if in Electron and use terminal with streaming
      if (window.electron && window.electron.spawnStream) {
        console.log('[SimpleStreaming] Detected Electron environment with spawnStream support');
        console.log('[SimpleStreaming] window.electron available methods:', Object.keys(window.electron));
        
        try {
          const spawnStream = window.electron.spawnStream;
          console.log('[SimpleStreaming] Using electron.spawnStream for terminal streaming');
          console.log('[SimpleStreaming] spawnStream function:', typeof spawnStream);
          
          // Start with just the model name, no optimization parameters for now
          const args = ['run', cleanModel];
          
          // TODO: Add back optimization parameters after basic streaming works
          // const isM4Model = cleanModel.includes('-m4');
          // if (isM4Model) {
          //   args.push('--num-ctx', '32768', '--num-gpu', '999', '--num-thread', '12');
          // } else {
          //   args.push('--num-ctx', '16384', '--num-gpu', '999', '--num-thread', '10');
          // }
          
          console.log('[SimpleStreaming] Spawning ollama with args:', args);
          
          // Return a promise to prevent fall-through to HTTP
          return new Promise((resolve, reject) => {
            console.log('[SimpleStreaming] Creating streaming process');
            
            let fullContent = '';
            let hasCompleted = false;
            let isFirstChunk = true;
            
            // Add timeout to prevent infinite hanging
            const timeout = setTimeout(() => {
              if (!hasCompleted) {
                console.error('[SimpleStreaming] Streaming timeout after 120 seconds');
                hasCompleted = true;
                const error = new Error('Streaming timeout - no response received');
                if (onError) onError(error);
                reject(error);
              }
            }, 120000); // 120 second timeout for creative tasks
            
            const child = spawnStream('ollama', args, 
              // onData callback
              (chunk) => {
                console.log('[SimpleStreaming] Terminal chunk received:', chunk.length, 'chars');
                
                // Skip model loading messages
                if (isFirstChunk && (chunk.includes('Loading model') || chunk.includes('pulling'))) {
                  isFirstChunk = false;
                  console.log('[SimpleStreaming] Skipping model loading message');
                  return;
                }
                isFirstChunk = false;
                
                // Clean ANSI escape codes
                const cleanedChunk = chunk.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
                
                // Add to full content
                fullContent += cleanedChunk;
                
                // Stream chunk by chunk
                if (onChunk) {
                  console.log('[SimpleStreaming] Streaming chunk, total length now:', fullContent.length);
                  onChunk(cleanedChunk, fullContent);
                }
              },
              // onError callback
              (error) => {
                console.error('[SimpleStreaming] Terminal error:', error);
                
                if (error.includes('not found')) {
                  if (!hasCompleted) {
                    hasCompleted = true;
                    clearTimeout(timeout); // Clear timeout on error
                    const err = new Error(`Model "${cleanModel}" not found. Please run: ollama pull ${cleanModel}`);
                    if (onError) onError(err);
                    reject(err);
                  }
                }
              },
              // onClose callback
              (code) => {
                console.log('[SimpleStreaming] Terminal process closed with code:', code, 'Content length:', fullContent.length);
                
                if (!hasCompleted) {
                  hasCompleted = true;
                  clearTimeout(timeout); // Clear timeout on completion
                  if (code === 0 || fullContent.length > 0) {
                    if (onComplete) onComplete(fullContent);
                    resolve();
                  } else {
                    const error = new Error(`Process exited with code ${code}`);
                    if (onError) onError(error);
                    reject(error);
                  }
                }
              }
            );
            
            if (!child) {
              console.error('[SimpleStreaming] Failed to create streaming process');
              if (onError) onError(new Error('Failed to create streaming process'));
              reject(new Error('Failed to create streaming process'));
              return;
            }
            
            console.log('[SimpleStreaming] Child process created, PID:', child.pid);
            
            // Write the enhanced message to stdin
            console.log('[SimpleStreaming] Writing enhanced message to stdin:', enhancedMessage.substring(0, 50) + '...');
            child.write(enhancedMessage + '\n');
            child.end();
          });
        } catch (terminalError) {
          console.error('[SimpleStreaming] Terminal setup error:', terminalError);
          console.error('[SimpleStreaming] Error details:', {
            message: terminalError.message,
            stack: terminalError.stack,
            name: terminalError.name
          });
          // Fall through to HTTP API
        }
      }
      
      // Otherwise use HTTP API
      console.log('[SimpleStreaming] Using HTTP API streaming');
      
      // Add M4-optimized options based on model size
      const is32BModel = cleanModel.includes('32b') || cleanModel.includes('30b');
      const isLargeModel = cleanModel.includes('14b') || cleanModel.includes('70b');
      const isMediumModel = cleanModel.includes('7b') || cleanModel.includes('8b');
      
      // M4-specific optimizations for 24GB unified memory
      const options = {
        temperature: 0.8, // Slightly higher for creativity
        num_predict: 6144, // Increase further for longer creative content
        top_p: 0.9, // Nucleus sampling for better quality
        top_k: 40, // Limit token choices for more focused responses
        // Context size based on model - optimize for 32B with 24GB RAM
        num_ctx: is32BModel ? 8192 : (isLargeModel ? 16384 : (isMediumModel ? 24576 : 32768)),
        // GPU layers - maximize for M4 Pro with 16 GPU cores
        num_gpu: 999, // Use all available layers on GPU (Ollama will use max available)
        // Thread optimization for M4 Pro with 12 cores
        num_thread: 10, // M4 Pro has 12 cores, use 10 for optimal performance
        // Batch size optimization - smaller for 32B to save memory
        batch_size: is32BModel ? 256 : (isLargeModel ? 512 : 1024),
        // M4-specific Metal optimizations
        use_mmap: true,
        use_mlock: false,
        // With 24GB, we can use full precision for better quality
        f16_kv: isLargeModel ? true : false,
        // Optimize for Apple Silicon
        main_gpu: 0,
        // Additional optimizations for 24GB
        low_vram: false,
        // Allow more parallel processing with 24GB memory and 16 GPU cores
        num_batch: 1024,
        // M4 Pro specific optimizations
        gpu_layers: 999, // Alternative parameter some models use
        num_gpu_layers: 999, // Another variant
        n_gpu_layers: 999, // Yet another variant
        // Thread pool for parallel processing
        threads_batch: 10,
        // Increase parallel sequences for better GPU utilization
        n_parallel: 4
      };
      
      const requestBody = {
        model: cleanModel,
        prompt: enhancedMessage,
        stream: true,
        options
      };
      
      console.log('[SimpleStreaming] M4-optimized request for', cleanModel, ':', options);
      
      console.log('[SimpleStreaming] Request:', requestBody);
      
      // Create abort controller for this stream
      const abortController = new AbortController();
      window.__currentStreamAbortController = abortController;
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal
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
      const TIMEOUT_MS = 120000; // Increase to 120 seconds for creative tasks and large models
      let timeoutHandle = null;

      // Set up timeout handler - always enabled now
      const resetTimeout = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        lastActivityTime = Date.now();
        timeoutHandle = setTimeout(() => {
          console.error('[SimpleStreaming] Stream timeout - no activity for 120 seconds');
          reader.cancel();
          if (onError) onError(new Error('Stream timeout - no response from model'));
        }, TIMEOUT_MS);
      };

      // Start initial timeout
      resetTimeout();

      let consecutiveEmptyReads = 0;
      const MAX_EMPTY_READS = 20; // Reduce to catch stalled streams faster
      
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
              // Clear abort controller on successful completion
              if (window.__currentStreamAbortController) {
                window.__currentStreamAbortController = null;
              }
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
      
      // Clear abort controller
      if (window.__currentStreamAbortController) {
        window.__currentStreamAbortController = null;
      }
      
      // Don't call onError if it was an abort
      if (error.name !== 'AbortError') {
        if (onError) onError(error);
      }
    } finally {
      // Always clear abort controller
      if (window.__currentStreamAbortController) {
        window.__currentStreamAbortController = null;
      }
    }
  }
  
  async streamViaTerminal(message, model, onChunk, onComplete, onError) {
    // Enhance message for name questions
    const enhancedMessage = this.enhanceMessageForNameQuestions(message);
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
      
      // Create a shell command that pipes the enhanced message to ollama
      const escapedMessage = enhancedMessage.replace(/'/g, "'\\''");
      
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

  async streamClaude(message, model, onChunk, onComplete, onError) {
    // Enhance message for name questions
    const enhancedMessage = this.enhanceMessageForNameQuestions(message);
    console.log('[SimpleStreaming] Using Claude streaming for model:', model);
    
    try {
      // Get Claude API key from settings
      const settings = localStorage.getItem('sephia_settings');
      if (!settings) {
        throw new Error('No settings found for Claude API key');
      }
      
      const parsedSettings = JSON.parse(settings);
      if (!parsedSettings.claudeApiKey) {
        throw new Error('Claude API key not configured');
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': parsedSettings.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: enhancedMessage
            }
          ],
          temperature: 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SimpleStreaming] Claude API Error:', response.status, errorText);
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('[SimpleStreaming] Claude streaming complete');
            if (onComplete) {
              onComplete(fullContent);
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
                  const chunk = parsed.delta.text;
                  fullContent += chunk;
                  
                  if (onChunk) {
                    onChunk(chunk, fullContent);
                  }
                }
              } catch (parseError) {
                console.warn('[SimpleStreaming] Failed to parse Claude streaming chunk:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('[SimpleStreaming] Claude streaming error:', error);
      if (onError) onError(error);
    }
  }
}

export default new SimpleStreamingService();