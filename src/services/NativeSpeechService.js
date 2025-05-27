// Native Speech Service for Electron using AppleScript
class NativeSpeechService {
  constructor() {
    this.isListening = false;
    this.synthesis = window.speechSynthesis;
    this.callbacks = null;
  }

  async startListening(callbacks = {}) {
    console.log('[NativeSpeech] Starting native speech recognition');
    
    if (this.isListening) {
      return Promise.resolve();
    }

    if (!window.electron) {
      callbacks.onError?.('Native speech only available in Electron');
      return Promise.reject('Not in Electron');
    }

    this.isListening = true;
    this.callbacks = callbacks;

    try {
      callbacks.onStart?.();
      console.log('[NativeSpeech] Attempting to trigger dictation...');
      
      // Show instructions to user
      if (callbacks.onResult) {
        callbacks.onResult({
          transcript: '🎤 Speak now... (Dictation should start automatically)',
          isFinal: false
        });
      }
      
      // Try to start native speech recognition
      const result = await window.electron.startNativeSpeech();
      
      console.log('[NativeSpeech] Native speech result:', result);
      
      if (result && result.trim()) {
        // We got a result from native speech
        if (callbacks.onResult) {
          callbacks.onResult({
            transcript: result.trim(),
            isFinal: true
          });
        }
      } else {
        // No result - show fallback instructions
        if (callbacks.onResult) {
          callbacks.onResult({
            transcript: 'Press Control+Control or use Edit menu → Start Dictation',
            isFinal: false
          });
        }
      }
      
      this.isListening = false;
      callbacks.onEnd?.();
      
    } catch (error) {
      console.error('[NativeSpeech] Error:', error);
      this.isListening = false;
      
      // Provide helpful error message
      const errorMsg = `Speech recognition failed. Try manually: 
1. Press Control+Control to start dictation
2. Or use Edit menu → Start Dictation
3. Speak your message
4. Press Control+Control again to stop`;
      
      callbacks.onError?.(errorMsg);
    }
  }

  stopListening() {
    console.log('[NativeSpeech] Stopping listening');
    this.isListening = false;
    this.callbacks?.onEnd?.();
    this.callbacks = null;
  }

  // Text-to-speech methods (same as other services)
  speak(text, options = {}) {
    if (!text || this.isSpeaking) {
      return Promise.resolve();
    }

    this.synthesis.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.voice = options.voice || this.selectedVoice;
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;
      
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

      this.synthesis.speak(utterance);
      this.isSpeaking = true;
    });
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
  }

  isSupported() {
    return {
      speechRecognition: !!window.electron,
      speechSynthesis: 'speechSynthesis' in window
    };
  }
}

export default new NativeSpeechService();