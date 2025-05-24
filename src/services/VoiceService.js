class VoiceService {
  constructor() {
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }

  loadVoices() {
    const loadVoicesList = () => {
      this.voices = this.synthesis.getVoices();
      // Try to select a natural-sounding English voice by default
      this.selectedVoice = this.voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Natural')
      ) || this.voices.find(voice => 
        voice.lang.startsWith('en')
      ) || this.voices[0];
    };

    loadVoicesList();
    
    // Chrome loads voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoicesList;
    }
  }

  // Speech-to-Text Methods
  startListening(callbacks = {}) {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition not supported');
      return Promise.reject('Speech recognition not supported');
    }

    if (this.isListening) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.isListening = true;

      this.recognition.onstart = () => {
        callbacks.onStart?.();
        resolve();
      };

      this.recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        const isFinal = event.results[last].isFinal;

        callbacks.onResult?.({
          transcript,
          isFinal,
          confidence: event.results[last][0].confidence
        });
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        const errorMessage = this.getErrorMessage(event.error);
        callbacks.onError?.(errorMessage);
        reject(errorMessage);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        callbacks.onEnd?.();
      };

      this.recognition.start();
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
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
      'network': 'Network error occurred. Please check your connection.',
      'aborted': 'Speech recognition was aborted.',
      'language-not-supported': 'Language not supported.',
      'service-not-allowed': 'Speech recognition service not allowed.',
      'bad-grammar': 'Speech grammar error.'
    };

    return errorMessages[error] || `Speech recognition error: ${error}`;
  }
}

// Create singleton instance
const voiceService = new VoiceService();

export default voiceService;