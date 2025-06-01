/**
 * Bark TTS Voice Service
 * High-quality text-to-speech using Bark AI models
 * Provides multiple voice presets and advanced speech synthesis
 */

class BarkVoiceService {
  constructor() {
    this.baseUrl = 'http://localhost:8189';
    this.isSupported = true;
    this.voices = [];
    this.currentVoice = this.getUserSelectedVoice() || 'v2/en_speaker_9'; // Default to Speaker 9 (Gentle, soft-spoken)
    this.isServerRunning = false;
    this.activeAudioElements = new Set();
    this.audioCleanupInterval = null;
    this.isSpeaking = false;
    
    // Initialize service
    this.init();
    
    // Register shutdown handlers
    this.registerShutdownHandlers();
  }

  // Get user's selected Bark voice from settings
  getUserSelectedVoice() {
    try {
      const voiceSettings = localStorage.getItem('sephia_voice_settings');
      if (voiceSettings) {
        const settings = JSON.parse(voiceSettings);
        console.log('[BarkVoiceService] User voice settings:', {
          barkVoice: settings.barkVoice,
          fullSettings: settings
        });
        return settings.barkVoice || null;
      }
    } catch (error) {
      console.warn('[BarkVoiceService] Failed to load voice settings:', error);
    }
    return null;
  }

  async init() {
    try {
      await this.checkServerStatus();
      await this.loadVoices();
      console.log('[BarkVoiceService] Initialized successfully');
    } catch (error) {
      console.warn('[BarkVoiceService] Server not running:', error.message);
      this.isServerRunning = false;
    }
  }

  async checkServerStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for server check
      
      const response = await fetch(`${this.baseUrl}/status`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const status = await response.json();
      this.isServerRunning = status.status === 'running';
      
      console.log('[BarkVoiceService] Server status:', {
        running: this.isServerRunning,
        modelsLoaded: status.models_loaded,
        gpuAvailable: status.gpu_available,
        device: status.device
      });
      
      return status;
    } catch (error) {
      console.error('[BarkVoiceService] Server check failed:', error);
      this.isServerRunning = false;
      
      if (error.name === 'AbortError') {
        throw new Error('Server connection timeout - server may be loading models');
      }
      throw error;
    }
  }

  async loadVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`);
      if (!response.ok) {
        throw new Error(`Failed to load voices: ${response.status}`);
      }
      
      const data = await response.json();
      this.voices = Object.entries(data.voices).map(([id, info]) => ({
        id,
        name: info.name,
        language: info.language,
        gender: info.gender,
        style: info.style,
        localService: true
      }));
      
      console.log('[BarkVoiceService] Loaded voices:', this.voices.length);
      return this.voices;
    } catch (error) {
      console.error('[BarkVoiceService] Failed to load voices:', error);
      // Fallback to default voice list if server unavailable
      this.voices = [
        { id: 'v2/en_speaker_1', name: 'Sarah (Female)', language: 'English', gender: 'Female', style: 'Friendly', localService: true }
      ];
      return this.voices;
    }
  }

  async getVoices() {
    if (!this.isServerRunning) {
      await this.init();
    }
    return this.voices;
  }

  async speak(text, options = {}) {
    // Prevent concurrent speech generation
    if (this.isSpeaking) {
      console.log('[BarkVoiceService] Already speaking, stopping current speech first');
      await this.stop();
    }
    
    this.isSpeaking = true;
    
    // Stop all existing audio first to prevent overlapping voices
    await this.stop();
    
    // Set flag to prevent status checks during speech generation
    window.__barkGeneratingSpeech = true;
    
    // Comprehensive cache clearing to prevent old content
    if (window.__streamingContent) {
      window.__streamingContent = '';
    }
    if (window.__lastSpokenMessage) {
      window.__lastSpokenMessage = '';
    }
    if (window.__conversationCache) {
      window.__conversationCache = {};
    }
    // Clear all possible global caches
    if (window.__globalStreamingContent) {
      window.__globalStreamingContent = '';
    }
    if (window.__streamingChunks) {
      window.__streamingChunks = [];
    }
    if (window.__messageContent) {
      window.__messageContent = '';
    }
    // Clear localStorage caches
    localStorage.removeItem('lastSpokenContent');
    localStorage.removeItem('streamingContent');
    localStorage.removeItem('cachedResponse');
    
    console.log('[BarkVoiceService] Speaking text:', text.substring(0, 100) + '...');
    
    // Check server status first
    try {
      await this.checkServerStatus();
    } catch (error) {
      throw new Error('Bark TTS server is not available. Please check if the server is running.');
    }

    if (!this.isServerRunning) {
      throw new Error('Bark TTS server is not running. Start it with: ./start-bark-tts.sh');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }
    
    // Validate text doesn't contain old cached content
    const suspiciousPatterns = [
      'TravelAppPlan',
      'Abraham Lincoln',
      'application/vnd.google',
      'File downloaded from Google Drive',
      'Unknown command: @'
    ];
    
    const containsSuspiciousContent = suspiciousPatterns.some(pattern => 
      text.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (containsSuspiciousContent) {
      console.warn('[BarkVoiceService] Rejecting suspicious cached content:', text.substring(0, 100));
      throw new Error('Detected old cached content, rejecting speech request');
    }

    // Always get the latest user-selected voice
    const userVoice = this.getUserSelectedVoice();
    const voice = options.voice || userVoice || this.currentVoice;
    
    console.log('[BarkVoiceService] Voice selection details:', {
      optionsVoice: options.voice,
      userSelectedVoice: userVoice,
      fallbackCurrentVoice: this.currentVoice,
      finalVoiceUsed: voice
    });
    
    console.log('[BarkVoiceService] Generating speech for complete text:', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      textLength: text.length,
      voice,
      temperature: options.temperature || 0.7
    });

    try {
      // Simplified identity cleaning to reduce processing delays
      let cleanedText = text.trim()
        .replace(/Monica/gi, "Aria")
        .replace(/I'm\s+Monica/gi, "I'm Aria")
        // Fix common TTS pronunciation issues
        .replace(/\bgoing\s*to\b/gi, "going to")
        .replace(/\bwant\s*to\b/gi, "want to")
        .replace(/\btry\s*to\b/gi, "try to")
        .replace(/\bhave\s*to\b/gi, "have to")
        .replace(/\bneed\s*to\b/gi, "need to")
        .replace(/\bused\s*to\b/gi, "used to");

      // Add feminine context to ensure female voice characteristics  
      const contextualText = this.addFeminineContext(cleanedText, voice);
      
      // Validate that contextualText contains the original text to prevent cache contamination
      if (!contextualText.includes(text.substring(0, Math.min(50, text.length)))) {
        console.error('[BarkVoiceService] Text validation failed - contextual text does not match original');
        throw new Error('Text validation failed - possible cache contamination');
      }
      
      // For longer texts, use chunking to prevent server truncation
      // Bark server truncates text that's too long, so we need proper chunking
      if (contextualText.length > 1500) {  // Lowered to 1500 to prevent server truncation
        console.log('[BarkVoiceService] Processing long text:', contextualText.length, 'characters');
        return await this.speakLongText(contextualText, voice, options);
      }
      
      const requestBody = {
        text: contextualText,
        voice: voice,
        temperature: options.temperature || 0.7,
        silent: false
      };

      console.log('[BarkVoiceService] Sending full text to TTS:', {
        textLength: contextualText.length,
        voice: voice
      });

      const response = await fetch(`${this.baseUrl}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(`TTS generation failed: ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`TTS generation failed: ${result.error || 'Unknown error'}`);
      }

      // Play the audio
      await this.playAudioData(result.audio_data, options.onStart);
      
      console.log('[BarkVoiceService] Speech completed successfully:', {
        duration: result.duration,
        voice: result.voice_used,
        textLength: contextualText.length
      });

      return {
        success: true,
        duration: result.duration,
        voice: result.voice_used
      };

    } catch (error) {
      console.error('[BarkVoiceService] Speech generation error:', error);
      throw error;
    } finally {
      this.isSpeaking = false;
      window.__barkGeneratingSpeech = false;
    }
  }

  // Handle long text by chunking intelligently with retry mechanism
  async speakLongText(text, voice, options = {}) {
    console.log('[BarkVoiceService] Processing long text in chunks');
    
    // Split text into meaningful chunks at sentence boundaries
    const chunks = this.chunkTextIntelligently(text);
    console.log('[BarkVoiceService] Split into', chunks.length, 'chunks');
    
    let successfulChunks = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Validate chunk belongs to original text
      if (!text.includes(chunk.substring(0, Math.min(30, chunk.length)))) {
        console.error(`[BarkVoiceService] Chunk ${i + 1} validation failed - does not belong to original text`);
        console.error(`[BarkVoiceService] Contaminated chunk:`, chunk.substring(0, 100));
        continue; // Skip this contaminated chunk
      }
      
      console.log(`[BarkVoiceService] Speaking chunk ${i + 1}/${chunks.length}:`, chunk.substring(0, 50) + '...');
      
      // Retry mechanism for each chunk
      let retries = 0;
      const maxRetries = 2;
      let chunkSuccess = false;
      
      while (!chunkSuccess && retries <= maxRetries) {
        try {
          const requestBody = {
            text: chunk,
            voice: voice,
            temperature: options.temperature || 0.7,
            silent: false
          };

          const response = await fetch(`${this.baseUrl}/tts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(`TTS generation failed: ${errorData.detail || response.statusText}`);
          }

          const result = await response.json();
          
          if (!result.success) {
            throw new Error(`TTS generation failed: ${result.error || 'Unknown error'}`);
          }

          // Play chunk and wait for completion
          await this.playAudioData(result.audio_data, options.onStart);
          
          chunkSuccess = true;
          successfulChunks++;
          console.log(`[BarkVoiceService] ✅ Chunk ${i + 1}/${chunks.length} completed successfully`);
          
          // Call progress callback if provided
          if (options.onProgress) {
            options.onProgress({
              current: i + 1,
              total: chunks.length,
              percentage: Math.round(((i + 1) / chunks.length) * 100),
              successful: successfulChunks
            });
          }
          
          // Minimal pause between chunks to reduce stuttering
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          retries++;
          console.warn(`[BarkVoiceService] ⚠️ Chunk ${i + 1} failed (attempt ${retries}/${maxRetries + 1}):`, error.message);
          
          if (retries <= maxRetries) {
            console.log(`[BarkVoiceService] 🔄 Retrying chunk ${i + 1} in 1 second...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.error(`[BarkVoiceService] ❌ Chunk ${i + 1} failed permanently after ${maxRetries + 1} attempts`);
            // Continue with next chunk instead of stopping entirely
            console.log(`[BarkVoiceService] 📢 Continuing with remaining ${chunks.length - i - 1} chunks...`);
          }
        }
      }
    }
    
    console.log(`[BarkVoiceService] Long text speech completed: ${successfulChunks}/${chunks.length} chunks successful`);
    return { success: true, chunks: chunks.length, successfulChunks };
  }

  // Intelligently chunk text at sentence boundaries
  chunkTextIntelligently(text) {
    const maxChunkLength = 1200; // Smaller chunks for smoother flow and no truncation
    const chunks = [];
    
    // Split by sentences first, but handle incomplete sentences too
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      // If adding this sentence would exceed max length, save current chunk
      if (currentChunk.length + sentence.length > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    // Add the last chunk if there's content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    // If no chunks were created (single sentence), just add the whole text
    if (chunks.length === 0 && text.trim()) {
      chunks.push(text.trim());
    }
    
    console.log('[BarkVoiceService] Text chunking result:', {
      originalLength: text.length,
      chunksCreated: chunks.length,
      chunkLengths: chunks.map(chunk => chunk.length),
      chunkPreviews: chunks.map(chunk => chunk.substring(0, 50) + '...')
    });
    
    return chunks;
  }

  async playAudioData(audioData, onStart = null) {
    return new Promise((resolve, reject) => {
      // Declare variables in Promise scope to avoid scope issues
      let isResolved = false;
      // timeoutId variable removed - no longer using audio timeout
      let audioUrl = null;
      let audio = null;
      
      try {
        // Ensure activeAudioElements is initialized
        if (!this.activeAudioElements) {
          this.activeAudioElements = new Set();
        }
        
        console.log('[BarkVoiceService] Processing audio data:', {
          type: typeof audioData,
          length: audioData?.length || 'unknown',
          isDataUrl: audioData?.startsWith?.('data:') || false,
          isBlob: audioData instanceof Blob,
          preview: typeof audioData === 'string' ? audioData.substring(0, 50) : 'not string'
        });
        
        // Handle different audio data formats
        if (typeof audioData === 'string') {
          if (audioData.startsWith('data:audio/')) {
            // Already a data URL
            audioUrl = audioData;
          } else if (audioData.startsWith('http')) {
            // HTTP URL
            audioUrl = audioData;
          } else {
            // Assume base64 encoded audio, create proper data URL
            audioUrl = `data:audio/wav;base64,${audioData}`;
          }
        } else if (audioData instanceof Blob) {
          // Blob data
          audioUrl = URL.createObjectURL(audioData);
        } else {
          throw new Error('Unsupported audio data format');
        }
        
        console.log('[BarkVoiceService] Using audio URL:', audioUrl.substring(0, 100) + '...');
        
        audio = new Audio(audioUrl);
        
        // Add protection flag to prevent interruption
        audio.setAttribute('data-bark-speech', 'true');
        
        // Track this audio element for cleanup
        this.activeAudioElements.add(audio);
        
        // Add more detailed event listeners for debugging
        audio.onloadstart = () => {
          console.log('[BarkVoiceService] Audio loading started');
        };
        
        audio.oncanplay = () => {
          console.log('[BarkVoiceService] Audio can start playing');
        };
        
        audio.oncanplaythrough = () => {
          console.log('[BarkVoiceService] Audio can play through without buffering');
        };
        
        audio.onplay = () => {
          console.log('[BarkVoiceService] Audio playback started');
        };
        
        // REMOVED AUDIO PLAYBACK TIMEOUT - Let speech run as long as needed
        // Previous 5-minute timeout was cutting off long content
        // Audio will resolve naturally when playback ends

        audio.onended = () => {
          console.log('[BarkVoiceService] Audio playback completed naturally');
          if (!isResolved) {
            isResolved = true;
            // Clean up blob URL if we created one
            if (audioData instanceof Blob) {
              URL.revokeObjectURL(audioUrl);
            }
            // Remove from active elements tracking
            this.activeAudioElements.delete(audio);
            // Minimal delay to ensure smooth transition to next chunk
            setTimeout(() => {
              resolve();
            }, 50);
          }
        };
        
        audio.onerror = (error) => {
          console.error('[BarkVoiceService] Audio playback error:', {
            error: error,
            audioError: audio.error,
            networkState: audio.networkState,
            readyState: audio.readyState,
            audioUrl: audioUrl.substring(0, 100)
          });
          
          if (!isResolved) {
            isResolved = true;
            // Clean up blob URL if we created one
            if (audioData instanceof Blob) {
              URL.revokeObjectURL(audioUrl);
            }
            // Remove from active elements tracking
            this.activeAudioElements.delete(audio);
            reject(new Error(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`));
          }
        };
        
        audio.onabort = () => {
          console.log('[BarkVoiceService] Audio playback aborted');
        };
        
        audio.onstalled = () => {
          console.warn('[BarkVoiceService] Audio playback stalled');
        };
        
        audio.onsuspend = () => {
          console.log('[BarkVoiceService] Audio playback suspended');
        };
        
        audio.onwaiting = () => {
          console.log('[BarkVoiceService] Audio playback waiting for data');
        };
        
        // Set volume and play
        audio.volume = 1.0; // Maximum volume to ensure audibility
        console.log('[BarkVoiceService] Starting audio playback with volume:', audio.volume);
        
        // Check browser autoplay policy
        audio.play().then(() => {
          console.log('[BarkVoiceService] Audio play() promise resolved successfully');
          // Call onStart callback when audio actually starts playing
          if (onStart && typeof onStart === 'function') {
            console.log('[BarkVoiceService] 🎤 Audio started, calling onStart callback');
            onStart();
          }
        }).catch((playError) => {
          console.error('[BarkVoiceService] Audio play() failed:', playError);
          
          if (!isResolved) {
            isResolved = true;
            // Timeout removed - no need to clear
            // Clean up blob URL if we created one
            if (audioData instanceof Blob) {
              URL.revokeObjectURL(audioUrl);
            }
            
            if (playError.name === 'NotAllowedError') {
              reject(new Error('Audio playback blocked by browser autoplay policy. Please interact with the page first.'));
            } else {
              reject(new Error(`Audio playback failed: ${playError.message}`));
            }
          }
        });
        
      } catch (error) {
        console.error('[BarkVoiceService] Error in playAudioData:', error);
        if (!isResolved) {
          isResolved = true;
          // Timeout removed - no need to clear
          reject(error);
        }
      }
    });
  }

  setVoice(voiceId) {
    // Allow setting voice even if voices haven't loaded yet (for default voices)
    if (!this.voices || this.voices.length === 0) {
      this.currentVoice = voiceId;
      
      // Save to localStorage
      try {
        const voiceSettings = JSON.parse(localStorage.getItem('sephia_voice_settings') || '{}');
        voiceSettings.barkVoice = voiceId;
        localStorage.setItem('sephia_voice_settings', JSON.stringify(voiceSettings));
        console.log('[BarkVoiceService] Voice set to:', voiceId, '(voices not loaded yet)');
      } catch (error) {
        console.warn('[BarkVoiceService] Failed to save voice setting:', error);
      }
      
      return true;
    }
    
    const voice = this.voices.find(v => v.id === voiceId);
    if (voice) {
      this.currentVoice = voiceId;
      
      // Also save to localStorage so it persists
      try {
        const voiceSettings = JSON.parse(localStorage.getItem('sephia_voice_settings') || '{}');
        voiceSettings.barkVoice = voiceId;
        localStorage.setItem('sephia_voice_settings', JSON.stringify(voiceSettings));
        console.log('[BarkVoiceService] Voice changed to:', voice.name, 'and saved to settings');
      } catch (error) {
        console.warn('[BarkVoiceService] Failed to save voice setting:', error);
      }
      
      return true;
    }
    console.warn('[BarkVoiceService] Voice not found:', voiceId);
    return false;
  }

  getCurrentVoice() {
    if (!this.voices || this.voices.length === 0) {
      return null;
    }
    return this.voices.find(v => v.id === this.currentVoice) || this.voices[0];
  }

  async stop() {
    // Stop ALL audio immediately to prevent multiple voices talking
    const audioElements = document.querySelectorAll('audio');
    console.log('[BarkVoiceService] Stopping all audio to prevent overlapping voices:', audioElements.length, 'elements');
    
    audioElements.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        // Remove from active tracking
        this.activeAudioElements.delete(audio);
      } catch (error) {
        console.warn('[BarkVoiceService] Error stopping audio:', error);
      }
    });
    
    // Clear active audio tracking
    if (this.activeAudioElements) {
      this.activeAudioElements.clear();
    }
    
    // Reset speaking flag
    this.isSpeaking = false;
    
    console.log('[BarkVoiceService] All audio stopped');
  }

  async pause() {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => audio.pause());
    console.log('[BarkVoiceService] Paused audio playback');
  }

  async resume() {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (audio.paused && audio.currentTime > 0) {
        audio.play();
      }
    });
    console.log('[BarkVoiceService] Resumed audio playback');
  }

  // Test method to verify service is working
  async test() {
    try {
      const status = await this.checkServerStatus();
      if (!status.models_loaded) {
        return {
          success: false,
          message: 'Bark models are still loading. Please wait a moment and try again.'
        };
      }

      await this.speak('Hello, this is a test of the Bark voice service.', {
        voice: 'v2/en_speaker_1'
      });

      const currentVoice = this.getCurrentVoice();
      return {
        success: true,
        message: 'Bark TTS is working correctly!',
        voices: this.voices.length,
        currentVoice: currentVoice ? currentVoice.name : this.currentVoice || 'Unknown'
      };

    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  // Test system audio output
  async testSystemAudio() {
    return new Promise((resolve) => {
      try {
        console.log('[BarkVoiceService] Testing system audio output...');
        
        // Create a simple test tone
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5); // Play for 0.5 seconds
        
        oscillator.onended = () => {
          console.log('[BarkVoiceService] Test tone completed');
          audioContext.close();
          resolve({
            success: true,
            message: 'System audio test completed. Did you hear a brief tone?'
          });
        };
        
        // Removed timeout - let audio test complete naturally
        // Previous 2-second timeout was too aggressive
        
      } catch (error) {
        console.error('[BarkVoiceService] System audio test failed:', error);
        resolve({
          success: false,
          message: `System audio test failed: ${error.message}`
        });
      }
    });
  }

  // Check audio output devices
  async checkAudioDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      
      console.log('[BarkVoiceService] Available audio output devices:', audioOutputs.map(d => ({
        deviceId: d.deviceId,
        label: d.label || 'Unknown device',
        groupId: d.groupId
      })));
      
      return {
        success: true,
        devices: audioOutputs,
        defaultDevice: audioOutputs.find(d => d.deviceId === 'default') || audioOutputs[0]
      };
    } catch (error) {
      console.error('[BarkVoiceService] Failed to enumerate audio devices:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MEMORY FIX: Audio cleanup methods
  startAudioCleanupRoutine() {
    // Clean up audio elements every 30 seconds
    this.audioCleanupInterval = setInterval(() => {
      this.cleanupOldAudioElements();
    }, 30000);
    
    console.log('[BarkVoiceService] 🧹 Audio cleanup routine started');
  }

  cleanupAudioElement(audio, audioUrl, isBlobUrl) {
    try {
      // Remove from tracking
      this.activeAudioElements.delete(audio);
      
      // Clean up blob URL if we created one
      if (isBlobUrl && audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Remove audio element from DOM if it was added
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
      
      // Clear all event listeners by cloning and replacing
      audio.onended = null;
      audio.onerror = null;
      audio.onplay = null;
      audio.onpause = null;
      audio.onloadstart = null;
      audio.oncanplay = null;
      
      console.log('[BarkVoiceService] 🧹 Audio element cleaned up');
    } catch (error) {
      console.warn('[BarkVoiceService] Error during audio cleanup:', error);
    }
  }

  cleanupOldAudioElements() {
    let cleanedCount = 0;
    
    // Only clean up truly finished audio elements, never interrupt active speech
    this.activeAudioElements.forEach(audio => {
      try {
        // Only clean up if audio is completely finished (ended) and not currently playing
        if (audio.ended && audio.currentTime > 0) {
          this.activeAudioElements.delete(audio);
          
          // Clean up blob URLs
          if (audio.src && audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
          }
          
          cleanedCount++;
        } else if (audio.currentTime === 0 && audio.paused && audio.readyState === 0) {
          // Only clean up if audio never started playing (failed to load)
          this.activeAudioElements.delete(audio);
          
          if (audio.src && audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
          }
          
          cleanedCount++;
        }
        // Never clean up paused or actively playing audio
      } catch (error) {
        // Only remove audio elements that throw errors (broken references)
        this.activeAudioElements.delete(audio);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`[BarkVoiceService] 🧹 Safely cleaned up ${cleanedCount} finished audio elements (preserved active speech)`);
    }
  }

  // Register shutdown handlers for proper cleanup
  registerShutdownHandlers() {
    // Register Bark TTS server as a background service for cleanup
    if (window.electron?.registerBackgroundService) {
      window.electron.registerBackgroundService({
        name: 'Bark TTS Server',
        port: 8189,
        pattern: 'bark_tts_server.py',
        command: 'pkill -f "bark.*server" 2>/dev/null || pkill -f "python.*bark" 2>/dev/null || true'
      }).catch(error => {
        console.warn('[BarkVoiceService] Failed to register for cleanup:', error);
      });
    }
    
    // Handle page unload/refresh
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
    
    // Handle visibility change (app minimized/hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Don't stop audio when app is hidden, just cleanup finished audio
        this.cleanupOldAudioElements();
      }
    });
  }
  
  // Clean up all audio elements and stop cleanup routine
  destroy() {
    console.log('[BarkVoiceService] 🧹 Destroying service and cleaning up all audio');
    
    // Stop cleanup routine
    if (this.audioCleanupInterval) {
      clearInterval(this.audioCleanupInterval);
      this.audioCleanupInterval = null;
    }
    
    // Clean up all active audio elements
    if (this.activeAudioElements) {
      this.activeAudioElements.forEach(audio => {
        try {
          audio.pause();
          if (audio.src && audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
          }
        } catch (error) {
          console.warn('[BarkVoiceService] Error cleaning up audio element:', error);
        }
      });
      
      this.activeAudioElements.clear();
    }
    
    console.log('[BarkVoiceService] 🧹 Service destroyed and audio cleaned up');
  }
  
  // Force cleanup of Bark server processes
  async forceCleanupServer() {
    console.log('[BarkVoiceService] Force cleaning up Bark TTS server...');
    
    if (window.electron?.killProcess && window.electron?.killPort) {
      try {
        // Kill by port
        await window.electron.killPort(8189);
        console.log('[BarkVoiceService] Killed processes on port 8189');
        
        // Kill by process pattern
        await window.electron.killProcess('bark_tts_server.py');
        await window.electron.killProcess('python.*bark');
        console.log('[BarkVoiceService] Killed Bark processes by pattern');
        
        return true;
      } catch (error) {
        console.error('[BarkVoiceService] Failed to cleanup server:', error);
        return false;
      }
    } else {
      console.warn('[BarkVoiceService] Electron process management not available');
      return false;
    }
  }

  // Get service info
  // Add feminine context to ensure consistent female voice  
  addFeminineContext(text, voice) {
    // Define female speakers that need context reinforcement
    const femaleVoices = ['v2/en_speaker_3', 'v2/en_speaker_4', 'v2/en_speaker_5', 'v2/en_speaker_9'];
    
    if (!femaleVoices.includes(voice)) {
      return text; // Return unchanged for other voices
    }
    
    // CRITICAL: Clean text first to remove any identity confusion from stored patterns
    let cleanedText = text
      .replace(/Monica|Monic/gi, 'Aria')
      .replace(/I'm Monica/gi, "I'm Aria")
      .replace(/Hello! I'm Monica/gi, "Hello! I'm Aria")
      .replace(/This is Monica/gi, "This is Aria");
    
    // Only add identity context if the text doesn't already establish Aria's identity clearly
    if (cleanedText.toLowerCase().includes("i'm aria") || 
        cleanedText.toLowerCase().includes("i am aria") ||
        cleanedText.toLowerCase().includes("this is aria")) {
      return cleanedText; // Already has clear Aria identity
    }
    
    // For introduction or identity-related responses, be very explicit but simple
    if (cleanedText.toLowerCase().includes('hello') || 
        cleanedText.toLowerCase().includes('hi') ||
        cleanedText.toLowerCase().includes('assistant')) {
      // Don't add prefixes that might confuse the voice model
      return cleanedText;
    }
    
    // For other responses, just ensure clean output without prefixes that might confuse voice patterns
    return cleanedText;
  }

  getInfo() {
    return {
      name: 'Bark TTS',
      type: 'AI Voice Synthesis',
      quality: 'High',
      local: true,
      voices: this.voices.length,
      features: [
        'High-quality AI voices',
        'Multiple voice presets',
        'Emotional speech synthesis',
        'Local processing (privacy)',
        'No API costs'
      ],
      status: this.isServerRunning ? 'Running' : 'Offline'
    };
  }
}

export default BarkVoiceService;