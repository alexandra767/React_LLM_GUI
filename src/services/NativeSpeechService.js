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
      
      // Show clear instructions for macOS dictation
      if (callbacks.onResult) {
        callbacks.onResult({
          transcript: '📝 To use macOS dictation:\n1. Press Fn+Fn (or your dictation shortcut)\n2. Speak your message\n3. Click "Done" when finished\n4. Your text will appear in the input field',
          isFinal: false
        });
      }
      
      // Don't try to capture anything - just return empty
      // The user will use macOS dictation manually
      const result = await window.electron.startNativeSpeech();
      
      console.log('[NativeSpeech] Native speech result:', result);
      
      // Always show the instructions since we can't capture dictation directly
      if (callbacks.onResult) {
        callbacks.onResult({
          transcript: '💡 Tip: After dictating, your text will appear in the input field automatically',
          isFinal: true
        });
      }
      
      this.isListening = false;
      callbacks.onEnd?.();
      
    } catch (error) {
      console.error('[NativeSpeech] Error:', error);
      this.isListening = false;
      
      // Provide helpful error message
      const errorMsg = `macOS Dictation Guide:
1. Press Fn+Fn (or your custom shortcut) to start dictation
2. Speak your message clearly
3. Click "Done" or press Fn+Fn again to stop
4. The text will appear in the input field

Note: Make sure dictation is enabled in System Settings → Keyboard → Dictation`;
      
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