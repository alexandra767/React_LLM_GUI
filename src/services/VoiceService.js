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
        
        // Try to use offline recognition if available
        if ('webkitSpeechRecognition' in window) {
          try {
            // Some browsers support offline mode
            console.log('[VoiceService] WebKit Speech Recognition available');
          } catch (e) {
            console.log('[VoiceService] Could not set offline mode:', e);
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
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition not supported');
      return Promise.reject('Speech recognition not supported');
    }

    if (this.isListening) {
      return Promise.resolve();
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
        console.log('[VoiceService] Got result event:', event);
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        const isFinal = event.results[last].isFinal;

        console.log('[VoiceService] Speech result:', { transcript, isFinal });

        callbacks.onResult?.({
          transcript,
          isFinal,
          confidence: event.results[last][0].confidence
        });
      };
      
      // Add more event handlers for debugging
      this.recognition.onsoundstart = () => {
        console.log('[VoiceService] Sound detected');
      };
      
      this.recognition.onsoundend = () => {
        console.log('[VoiceService] Sound ended');
      };
      
      this.recognition.onspeechstart = () => {
        console.log('[VoiceService] Speech detected');
      };
      
      this.recognition.onspeechend = () => {
        console.log('[VoiceService] Speech ended');
      };

      this.recognition.onerror = (event) => {
        console.error('[VoiceService] Speech recognition error:', event.error, event);
        this.isListening = false;
        const errorMessage = this.getErrorMessage(event.error);
        callbacks.onError?.(errorMessage);
        reject(errorMessage);
      };

      this.recognition.onend = () => {
        console.log('[VoiceService] Speech recognition ended');
        this.isListening = false;
        callbacks.onEnd?.();
      };

      this.recognition.onaudiostart = () => {
        console.log('[VoiceService] Audio capture started');
      };

      this.recognition.onnomatch = () => {
        console.log('[VoiceService] No speech match');
      };

      try {
        this.recognition.start();
      } catch (error) {
        console.error('[VoiceService] Failed to start recognition:', error);
        this.isListening = false;
        callbacks.onError?.('Failed to start speech recognition: ' + error.message);
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
      'network': 'Network error: Speech recognition requires internet access. The app may be blocked from accessing Google\'s speech servers. Please check your firewall/network settings.',
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

// Create singleton instance
const voiceService = new VoiceService();

export default voiceService;