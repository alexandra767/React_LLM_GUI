// Offline voice service that monitors textarea changes for dictation
class OfflineVoiceService {
  constructor() {
    this.isListening = false;
    this.synthesis = window.speechSynthesis;
    this.callbacks = null;
    this.monitorInterval = null;
    this.lastValue = '';
  }

  async startListening(callbacks = {}) {
    if (this.isListening) {
      return Promise.resolve();
    }

    this.isListening = true;
    this.callbacks = callbacks;

    return new Promise((resolve) => {
      try {
        // Find the chat input textarea
        const chatInput = document.querySelector('textarea[placeholder*="Type a message"]');
        if (!chatInput) {
          console.error('[OfflineVoice] Could not find chat input');
          callbacks.onError?.('Could not find chat input field');
          this.isListening = false;
          return resolve();
        }
        
        // Store current value
        this.lastValue = chatInput.value;
        
        // Focus the input to prepare for dictation
        chatInput.focus();
        
        // Show user instructions
        const originalPlaceholder = chatInput.placeholder;
        chatInput.placeholder = 'Press Fn+Fn to start dictating...';
        
        // Add visual indicator
        chatInput.style.borderColor = '#ef4444';
        chatInput.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
        
        callbacks.onStart?.();
        
        // Monitor the textarea for changes
        this.monitorInterval = setInterval(() => {
          const currentValue = chatInput.value;
          
          if (currentValue !== this.lastValue) {
            console.log('[OfflineVoice] Detected change:', currentValue);
            this.lastValue = currentValue;
            
            // Send the update
            callbacks.onResult?.({
              transcript: currentValue,
              isFinal: false
            });
            
            // Reset visual indicators when text appears
            if (currentValue.length > 0) {
              chatInput.placeholder = originalPlaceholder;
              chatInput.style.borderColor = '';
              chatInput.style.boxShadow = '';
            }
          }
        }, 100);
        
        // Store cleanup function
        this.cleanup = () => {
          if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
          }
          chatInput.placeholder = originalPlaceholder;
          chatInput.style.borderColor = '';
          chatInput.style.boxShadow = '';
        };
        
        resolve();
      } catch (error) {
        this.isListening = false;
        callbacks.onError?.('Failed to start monitoring: ' + error.message);
        resolve();
      }
    });
  }

  stopListening() {
    console.log('[OfflineVoice] Stopping listening');
    
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
    
    // Send final value if any
    if (this.lastValue && this.callbacks?.onResult) {
      this.callbacks.onResult({
        transcript: this.lastValue,
        isFinal: true
      });
    }
    
    this.callbacks?.onEnd?.();
    this.isListening = false;
    this.callbacks = null;
  }

  // Text-to-speech methods
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
      speechRecognition: true,
      speechSynthesis: 'speechSynthesis' in window
    };
  }
}

export default new OfflineVoiceService();