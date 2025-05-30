import BarkVoiceService from './BarkVoiceService';

class VoiceService {
  constructor() {
    console.log('[VoiceService] Initializing...');
    console.log('[VoiceService] Environment:', {
      isElectron: !!(window.electron || (window.process && window.process.type)),
      hasSpeechSynthesis: 'speechSynthesis' in window,
      hasSpeechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      userAgent: navigator.userAgent
    });
    
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    this.voices = [];
    this.selectedVoice = null;
    this.speechRate = 1.0;
    this.speechPitch = 1.0;
    this.speechVolume = 1.0;
    
    this.initializeSpeechRecognition();
    this.loadVoices();
  }

  initializeSpeechRecognition() {
    // Check if we're in Electron
    const isElectron = window.electron || (window.process && window.process.type);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition && !isElectron) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    try {
      // Use the already defined SpeechRecognition which includes the webkit prefix
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true; // Better for Electron
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        // Try to configure for offline/local use in Electron
        if ('webkitSpeechRecognition' in window && isElectron) {
          try {
            // For Electron, try to use local recognition
            console.log('[VoiceService] Configuring WebKit Speech Recognition for Electron');
            // Disable network-based services if possible
            this.recognition.serviceURI = ''; // Try to disable remote service
            console.log('[VoiceService] Attempted to disable remote service');
          } catch (e) {
            console.log('[VoiceService] Could not configure offline mode:', e);
          }
        }
      } else {
        console.warn('No SpeechRecognition API available');
        this.recognition = null;
      }
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      this.recognition = null;
    }
  }

  loadVoices() {
    const loadVoicesList = () => {
      try {
        this.voices = this.synthesis.getVoices();
        console.log('[VoiceService] Loaded voices:', this.voices.length);
        
        // Log all available voices for debugging
        console.log('[VoiceService] Available voices:');
        this.voices.forEach(voice => {
          console.log(`  - ${voice.name} (${voice.lang}) ${voice.localService ? '[Local]' : '[Remote]'}`);
        });
        
        // Try to select a premium/natural voice by default
        // Priority: Samantha (Siri-like) > Premium > Enhanced > Natural > Any English
        this.selectedVoice = 
          this.voices.find(voice => voice.name.toLowerCase().includes('samantha')) ||
          this.voices.find(voice => voice.name.toLowerCase().includes('siri')) ||
          this.voices.find(voice => voice.name.toLowerCase().includes('alex')) ||
          this.voices.find(voice => voice.name.toLowerCase().includes('ava')) ||
          this.voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.includes('Premium') || voice.name.includes('Enhanced'))
          ) ||
          this.voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.includes('Natural')
          ) || 
          this.voices.find(voice => 
            voice.lang.startsWith('en')
          ) || 
          this.voices[0];
        
        if (this.selectedVoice) {
          console.log('[VoiceService] Selected default voice:', this.selectedVoice.name);
        }
      } catch (error) {
        console.error('[VoiceService] Error loading voices:', error);
      }
    };

    // Initial load
    loadVoicesList();
    
    // Chrome/Electron loads voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoicesList;
    }
    
    // Fallback: Try loading voices after a delay
    setTimeout(loadVoicesList, 100);
    setTimeout(loadVoicesList, 500);
    setTimeout(loadVoicesList, 1000);
  }

  // Speech-to-Text Methods
  async startListening(callbacks = {}) {
    console.log('[VoiceService] startListening called');
    console.log('[VoiceService] Recognition object exists:', !!this.recognition);
    console.log('[VoiceService] Environment check:', {
      isElectron: !!(window.electron || (window.process && window.process.type)),
      hasSpeechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      userAgent: navigator.userAgent.substring(0, 100)
    });
    
    if (!this.recognition) {
      const errorMsg = 'Speech recognition not supported or failed to initialize';
      console.error('[VoiceService]', errorMsg);
      callbacks.onError?.(errorMsg);
      return Promise.reject(errorMsg);
    }

    if (this.isListening) {
      console.log('[VoiceService] Already listening');
      return Promise.resolve();
    }

    // Test network connectivity (skip in Electron as it may fail due to CSP)
    if (!window.electron) {
      try {
        console.log('[VoiceService] Testing network connectivity...');
        await this.testNetworkAccess();
        console.log('[VoiceService] Network test passed');
      } catch (networkError) {
        console.error('[VoiceService] Network test failed:', networkError);
        // Continue anyway as this might be a false negative
      }
    } else {
      console.log('[VoiceService] Skipping network test in Electron');
    }

    // First ensure we have microphone permission and the correct device
    try {
      console.log('[VoiceService] Checking microphone access...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log('[VoiceService] Found audio inputs:', audioInputs.map(d => ({
        label: d.label,
        deviceId: d.deviceId,
        groupId: d.groupId
      })));
      
      // Find built-in microphone (usually contains "Built-in" or "Internal" in the label)
      const builtInMic = audioInputs.find(device => 
        device.label.toLowerCase().includes('built-in') || 
        device.label.toLowerCase().includes('internal') ||
        device.label.toLowerCase().includes('macbook')
      ) || audioInputs[0];
      
      if (builtInMic) {
        console.log('[VoiceService] Using microphone:', builtInMic.label);
      }
    } catch (error) {
      console.error('[VoiceService] Error checking microphones:', error);
    }

    return new Promise((resolve, reject) => {
      this.isListening = true;

      this.recognition.onstart = () => {
        console.log('[VoiceService] Speech recognition started');
        callbacks.onStart?.();
        resolve();
      };

      this.recognition.onresult = (event) => {
        console.log('[VoiceService] 🎤 Got result event:', event);
        console.log('[VoiceService] 📊 Results length:', event.results.length);
        
        if (event.results.length === 0) {
          console.warn('[VoiceService] ⚠️ No results in event');
          return;
        }
        
        const last = event.results.length - 1;
        const result = event.results[last];
        
        if (!result || result.length === 0) {
          console.warn('[VoiceService] ⚠️ Empty result at index', last);
          return;
        }
        
        const transcript = result[0].transcript;
        const isFinal = result.isFinal;

        console.log('[VoiceService] 🗣️ Speech result:', { 
          transcript, 
          isFinal,
          confidence: result[0].confidence,
          alternatives: result.length,
          resultIndex: last,
          totalResults: event.results.length
        });

        console.log('[VoiceService] 📞 Calling onResult callback with transcript:', transcript);
        try {
          callbacks.onResult?.({
            transcript,
            isFinal,
            confidence: result[0].confidence
          });
          console.log('[VoiceService] ✅ onResult callback completed');
        } catch (error) {
          console.error('[VoiceService] ❌ Error in onResult callback:', error);
        }
      };
      
      // Add more event handlers for debugging
      this.recognition.onsoundstart = () => {
        console.log('[VoiceService] Sound detected');
      };
      
      this.recognition.onsoundend = () => {
        console.log('[VoiceService] Sound ended');
      };
      
      this.recognition.onspeechstart = () => {
        console.log('[VoiceService] Speech detected - recognition should start processing');
      };
      
      this.recognition.onspeechend = () => {
        console.log('[VoiceService] Speech ended - waiting for results');
      };
      
      this.recognition.onaudioend = () => {
        console.log('[VoiceService] Audio capture ended');
      };

      this.recognition.onerror = (event) => {
        console.error('[VoiceService] Speech recognition error:', event.error, event);
        console.error('[VoiceService] Error details:', {
          error: event.error,
          message: event.message,
          type: event.type,
          timestamp: new Date().toISOString()
        });
        
        this.isListening = false;
        const errorMessage = this.getErrorMessage(event.error);
        
        // For network errors in Electron, automatically switch to offline mode
        if (event.error === 'network' && window.electron) {
          console.log('[VoiceService] Network error in Electron - switching to offline mode automatically');
          this.isListening = false;
          
          // Instead of prompt, trigger the offline voice service or manual input mode
          setTimeout(() => {
            console.log('[VoiceService] Network error - offering alternative input methods');
            callbacks.onError?.('network'); // This will be handled by ChatInput to enable typing mode
          }, 100);
          
          return; // Don't reject immediately
        } else {
          callbacks.onError?.(errorMessage);
          reject(new Error(errorMessage));
        }
      };

      this.recognition.onend = () => {
        console.log('[VoiceService] 🏁 Speech recognition ended');
        this.isListening = false;
        console.log('[VoiceService] 📞 Calling onEnd callback...');
        try {
          callbacks.onEnd?.();
          console.log('[VoiceService] ✅ onEnd callback completed');
        } catch (error) {
          console.error('[VoiceService] ❌ Error in onEnd callback:', error);
        }
      };

      this.recognition.onaudiostart = () => {
        console.log('[VoiceService] Audio capture started');
      };

      this.recognition.onnomatch = () => {
        console.log('[VoiceService] No speech match');
      };

      try {
        // Add extra configuration for Electron
        if (window.electron) {
          console.log('[VoiceService] 🖥️ Configuring recognition for Electron environment');
          this.recognition.interimResults = true;
          this.recognition.maxAlternatives = 1;
          this.recognition.continuous = false;
        }
        
        console.log('[VoiceService] 🚀 Starting speech recognition...');
        this.recognition.start();
        console.log('[VoiceService] ✅ Recognition start() called successfully');
      } catch (error) {
        console.error('[VoiceService] Failed to start recognition:', error);
        this.isListening = false;
        
        // In Electron, if speech recognition fails, provide a clear workaround
        if (window.electron) {
          const electronWorkaround = 'Speech recognition is blocked in Electron.\n\nWorkaround:\n1. Go to Settings → Voice\n2. Set Speech Recognition Provider to "offline"\n3. Click mic button again\n\nThis will enable typing mode where you can type or paste your message.';
          callbacks.onError?.(electronWorkaround);
        } else {
          callbacks.onError?.('Failed to start speech recognition: ' + error.message);
        }
        reject(error);
      }
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.log('[VoiceService] Error stopping recognition:', e);
      }
      this.isListening = false;
    }
  }

  // Text-to-Speech Methods
  speak(text, options = {}) {
    if (!text || this.isSpeaking) {
      return Promise.resolve();
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    // Check if text is too long for browser speech synthesis
    // Different browsers have different limits, typically 4000-32000 characters
    const maxLength = 12000; // Increased limit to reduce unnecessary chunking
    
    if (text.length > maxLength) {
      console.log('[VoiceService] Text too long for single utterance, chunking...', text.length, 'characters');
      return this.speakLongText(text, options);
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice properties
      utterance.voice = options.voice || this.selectedVoice;
      utterance.rate = options.rate || this.speechRate;
      utterance.pitch = options.pitch || this.speechPitch;
      utterance.volume = options.volume || this.speechVolume;
      utterance.lang = options.lang || 'en-US';

      utterance.onstart = () => {
        this.isSpeaking = true;
        options.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        options.onError?.(event.error);
        reject(event.error);
      };

      utterance.onpause = () => {
        options.onPause?.();
      };

      utterance.onresume = () => {
        options.onResume?.();
      };

      this.synthesis.speak(utterance);
    });
  }

  // Handle long text by chunking for browser speech synthesis
  async speakLongText(text, options = {}) {
    console.log('[VoiceService] Processing long text in chunks for browser TTS');
    
    // Split text into chunks at sentence boundaries
    const chunks = this.chunkTextAtSentences(text, 10000); // Increased chunk size to match new limit
    console.log('[VoiceService] Split into', chunks.length, 'chunks');
    
    this.isSpeaking = true;
    
    try {
      options.onStart?.();
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`[VoiceService] Speaking chunk ${i + 1}/${chunks.length}:`, chunk.substring(0, 50) + '...');
        
        // Create utterance for this chunk
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.voice = options.voice || this.selectedVoice;
        utterance.rate = options.rate || this.speechRate;
        utterance.pitch = options.pitch || this.speechPitch;
        utterance.volume = options.volume || this.speechVolume;
        utterance.lang = options.lang || 'en-US';
        
        // Wait for this chunk to complete before starting next
        await new Promise((resolve, reject) => {
          utterance.onend = () => {
            console.log(`[VoiceService] ✅ Chunk ${i + 1}/${chunks.length} completed`);
            
            // Call progress callback if provided
            if (options.onProgress) {
              options.onProgress({
                current: i + 1,
                total: chunks.length,
                percentage: Math.round(((i + 1) / chunks.length) * 100)
              });
            }
            
            resolve();
          };
          
          utterance.onerror = (event) => {
            console.warn(`[VoiceService] ⚠️ Chunk ${i + 1} failed:`, event.error);
            // Continue with next chunk instead of stopping
            resolve();
          };
          
          this.synthesis.speak(utterance);
        });
        
        // Small pause between chunks
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log('[VoiceService] Long text speech completed');
      options.onEnd?.();
      
    } catch (error) {
      console.error('[VoiceService] Long text speech failed:', error);
      options.onError?.(error);
      throw error;
    } finally {
      this.isSpeaking = false;
    }
    
    return Promise.resolve();
  }

  // Chunk text at sentence boundaries
  chunkTextAtSentences(text, maxLength) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      // If adding this sentence would exceed max length, save current chunk
      if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
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
    
    // If no chunks were created, just add the whole text
    if (chunks.length === 0 && text.trim()) {
      chunks.push(text.trim());
    }
    
    return chunks;
  }

  stopSpeaking() {
    if (this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  pauseSpeaking() {
    if (this.isSpeaking && this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  resumeSpeaking() {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  // Utility Methods
  getVoices() {
    return this.voices;
  }

  setVoice(voice) {
    this.selectedVoice = voice;
  }

  setSpeechRate(rate) {
    this.speechRate = Math.max(0.1, Math.min(2, rate));
  }

  setSpeechPitch(pitch) {
    this.speechPitch = Math.max(0, Math.min(2, pitch));
  }

  setSpeechVolume(volume) {
    this.speechVolume = Math.max(0, Math.min(1, volume));
  }

  setRecognitionLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  isSupported() {
    // Check if we're in Electron
    const isElectron = !!(window.electron || (window.process && window.process.type) || navigator.userAgent.includes('Electron'));
    
    console.log('[VoiceService] isSupported check:', {
      isElectron,
      hasElectronGlobal: !!window.electron,
      hasProcessType: !!(window.process && window.process.type),
      userAgent: navigator.userAgent,
      hasSpeechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      hasSpeechSynthesis: 'speechSynthesis' in window
    });
    
    // In Electron, we should have access to Web Speech API through Chromium
    if (isElectron) {
      // Still check if the APIs are actually available
      const hasRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      const hasSynthesis = 'speechSynthesis' in window;
      
      console.log('[VoiceService] Electron detected, API availability:', {
        hasRecognition,
        hasSynthesis
      });
      
      return {
        speechRecognition: hasRecognition,
        speechSynthesis: hasSynthesis
      };
    }
    
    // For regular browsers
    return {
      speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      speechSynthesis: 'speechSynthesis' in window
    };
  }

  getErrorMessage(error) {
    const errorMessages = {
      'no-speech': 'No speech was detected. Please try again.',
      'audio-capture': 'No microphone was found. Please check your microphone.',
      'not-allowed': 'Microphone permission was denied. Please allow microphone access.',
      'network': 'network',
      'aborted': 'Speech recognition was aborted.',
      'language-not-supported': 'Language not supported.',
      'service-not-allowed': 'Speech recognition service not allowed. The app may need network permissions.',
      'bad-grammar': 'Speech grammar error.'
    };

    return errorMessages[error] || `Speech recognition error: ${error}`;
  }
  
  // Test network connectivity
  async testNetworkAccess() {
    try {
      console.log('[VoiceService] Testing network access...');
      const response = await fetch('https://www.google.com/speech-api/v2/test', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      console.log('[VoiceService] Network test completed');
      return true;
    } catch (error) {
      console.error('[VoiceService] Network test failed:', error);
      return false;
    }
  }
}

// Import moved to top

// Enhanced Voice Service Factory
class VoiceServiceFactory {
  constructor() {
    this.browserVoice = new VoiceService();
    this.barkVoice = new BarkVoiceService();
    this.currentProvider = 'browser'; // 'browser' or 'bark'
    this.isSpeaking = false; // Prevent concurrent speech
    this.voiceLock = null; // Lock to prevent race conditions
    
    console.log('[VoiceServiceFactory] Initialized with providers:', {
      browser: !!this.browserVoice,
      bark: !!this.barkVoice
    });
  }

  // Get the active voice service
  getActiveService() {
    return this.currentProvider === 'bark' ? this.barkVoice : this.browserVoice;
  }

  // Switch provider
  setProvider(provider) {
    if (provider === 'bark' || provider === 'browser') {
      this.currentProvider = provider;
      console.log('[VoiceServiceFactory] Switched to provider:', provider);
      return true;
    }
    console.warn('[VoiceServiceFactory] Invalid provider:', provider);
    return false;
  }

  // Get available providers
  async getProviders() {
    const providers = [
      {
        id: 'browser',
        name: 'Browser TTS',
        type: 'Browser API',
        available: true,
        voices: this.browserVoice.getVoices().length
      }
    ];

    // Check if Bark is available
    try {
      const barkStatus = await this.barkVoice.checkServerStatus();
      providers.push({
        id: 'bark',
        name: 'Bark AI TTS',
        type: 'AI Voice Synthesis',
        available: barkStatus.status === 'running',
        modelsLoaded: barkStatus.models_loaded,
        voices: this.barkVoice.voices.length,
        quality: 'High',
        local: true
      });
    } catch (error) {
      providers.push({
        id: 'bark',
        name: 'Bark AI TTS',
        type: 'AI Voice Synthesis',
        available: false,
        modelsLoaded: false,
        error: error.message || 'Server not running',
        voices: 0
      });
    }

    return providers;
  }

  // Unified speak method - always respect user's provider choice and prevent conflicts
  async speak(text, options = {}) {
    // Only stop voices if we're switching providers or if explicitly requested
    const voiceSettings = JSON.parse(localStorage.getItem('sephia_voice_settings') || '{}');
    const preferredProvider = voiceSettings.voiceSynthesisProvider || 'bark';
    
    // Only stop all voices if switching providers or if currently speaking with a different provider
    if (preferredProvider !== this.currentProvider || (this.isSpeaking && this.currentProvider !== preferredProvider)) {
      console.log('[VoiceServiceFactory] Stopping all voice services due to provider change');
      await this.stopAllVoices();
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      console.log('[VoiceServiceFactory] Keeping current provider, no need to stop');
    }

    // Set speaking flag to prevent concurrent calls
    this.isSpeaking = true;
    
    try {
      
      // Only switch provider if it's different from current
      if (preferredProvider !== this.currentProvider) {
        console.log('[VoiceServiceFactory] Switching provider from', this.currentProvider, 'to', preferredProvider);
        // Stop current provider before switching
        await this.stop();
        this.setProvider(preferredProvider);
      }
      
      console.log('[VoiceServiceFactory] Using provider:', this.currentProvider, 'with voice:', voiceSettings.barkVoice || 'default');
      
      // Use the selected provider without overrides
      const service = this.getActiveService();
      const result = await service.speak(text, {
        ...options,
        onStart: () => {
          console.log('[VoiceServiceFactory] Speech started with', this.currentProvider);
          options.onStart?.();
        },
        onEnd: () => {
          console.log('[VoiceServiceFactory] Speech ended');
          this.isSpeaking = false; // Clear speaking flag
          options.onEnd?.();
        },
        onError: (error) => {
          console.error('[VoiceServiceFactory] Speech error:', error);
          this.isSpeaking = false; // Clear speaking flag on error
          options.onError?.(error);
        }
      });
      
      return result;
    } catch (error) {
      this.isSpeaking = false; // Clear speaking flag on error
      throw error;
    }
  }

  // Unified voice methods
  async getVoices() {
    const service = this.getActiveService();
    return await service.getVoices();
  }

  setVoice(voice) {
    const service = this.getActiveService();
    if (this.currentProvider === 'bark') {
      return service.setVoice(voice);
    } else {
      service.setVoice(voice);
      return true;
    }
  }

  // Stop ALL voice services to prevent dual voices
  async stopAllVoices() {
    this.isSpeaking = false; // Clear speaking flag
    
    try {
      // Stop browser voice
      this.browserVoice.stopSpeaking();
      console.log('[VoiceServiceFactory] Stopped browser voice');
      
      // Stop Bark voice
      await this.barkVoice.stop();
      console.log('[VoiceServiceFactory] Stopped Bark voice');
      
      // Stop any HTML audio elements that might be playing
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      console.log('[VoiceServiceFactory] Stopped', audioElements.length, 'audio elements');
      
    } catch (error) {
      console.warn('[VoiceServiceFactory] Error stopping voices:', error);
    }
  }

  // Stop/pause/resume methods
  async stop() {
    return await this.stopAllVoices();
  }

  async pause() {
    const service = this.getActiveService();
    if (this.currentProvider === 'bark') {
      return await service.pause();
    } else {
      service.pauseSpeaking();
    }
  }

  async resume() {
    const service = this.getActiveService();
    if (this.currentProvider === 'bark') {
      return await service.resume();
    } else {
      service.resumeSpeaking();
    }
  }

  // Speech recognition (only browser for now)
  async startListening(callbacks = {}) {
    return await this.browserVoice.startListening(callbacks);
  }

  stopListening() {
    this.browserVoice.stopListening();
  }

  // Test methods
  async testProvider(provider) {
    if (provider === 'bark') {
      return await this.barkVoice.test();
    } else {
      // Simple browser test
      try {
        await this.browserVoice.speak('Testing browser voice.', { 
          onEnd: () => console.log('Browser voice test completed') 
        });
        return { success: true, message: 'Browser TTS is working!' };
      } catch (error) {
        return { success: false, message: `Browser test failed: ${error.message}` };
      }
    }
  }

  // Get service info
  getInfo() {
    const active = this.getActiveService();
    
    if (this.currentProvider === 'bark') {
      return active.getInfo();
    } else {
      return {
        name: 'Browser TTS',
        type: 'Browser API',
        quality: 'Standard',
        local: true,
        voices: this.browserVoice.getVoices().length,
        features: [
          'Built-in browser voices',
          'No setup required',
          'Works offline',
          'Multiple languages'
        ],
        status: 'Available'
      };
    }
  }

  // Delegate other methods to browser service (for compatibility)
  isSupported() {
    return this.browserVoice.isSupported();
  }

  setSpeechRate(rate) {
    this.browserVoice.setSpeechRate(rate);
  }

  setSpeechPitch(pitch) {
    this.browserVoice.setSpeechPitch(pitch);
  }

  setSpeechVolume(volume) {
    this.browserVoice.setSpeechVolume(volume);
  }

  setRecognitionLanguage(lang) {
    this.browserVoice.setRecognitionLanguage(lang);
  }
}

// Create singleton instance
const voiceService = new VoiceServiceFactory();

export default voiceService;