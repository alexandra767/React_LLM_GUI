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

  // Unified speak method - always respect user's provider choice
  async speak(text, options = {}) {
    const voiceSettings = JSON.parse(localStorage.getItem('sephia_voice_settings') || '{}');
    
    console.log('[VoiceServiceFactory] Using user-selected provider:', this.currentProvider, 'with voice:', voiceSettings.barkVoice || 'default');
    
    // Use the selected provider without overrides
    const service = this.getActiveService();
    return await service.speak(text, options);
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

  // Stop/pause/resume methods
  async stop() {
    const service = this.getActiveService();
    if (this.currentProvider === 'bark') {
      return await service.stop();
    } else {
      service.stopSpeaking();
    }
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