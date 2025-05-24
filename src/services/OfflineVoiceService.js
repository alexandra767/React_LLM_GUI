// Offline voice service that uses native macOS speech recognition
class OfflineVoiceService {
  constructor() {
    this.isListening = false;
    this.synthesis = window.speechSynthesis;
    this.recognition = null;
    this.initializeOfflineRecognition();
  }

  initializeOfflineRecognition() {
    // Check if we're in Electron
    if (window.electron) {
      console.log('[OfflineVoice] Running in Electron, setting up offline recognition');
      this.setupElectronRecognition();
    } else {
      console.log('[OfflineVoice] Not in Electron, falling back to web speech API');
      this.setupWebRecognition();
    }
  }

  setupElectronRecognition() {
    // We'll use Electron IPC to communicate with native speech recognition
    this.recognition = {
      start: () => {
        console.log('[OfflineVoice] Starting offline recognition via Electron');
        if (window.electron && window.electron.startSpeechRecognition) {
          window.electron.startSpeechRecognition();
        } else {
          // Fallback to using native macOS dictation command
          this.useMacOSDictation();
        }
      },
      stop: () => {
        console.log('[OfflineVoice] Stopping offline recognition');
        if (window.electron && window.electron.stopSpeechRecognition) {
          window.electron.stopSpeechRecognition();
        }
      }
    };
  }

  setupWebRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  // Alternative: Use macOS dictation via keyboard shortcut
  useMacOSDictation() {
    console.log('[OfflineVoice] Using macOS dictation');
    // This will trigger the native macOS dictation
    // User needs to have dictation enabled in System Preferences
    
    // Create a temporary input field to receive dictation
    const tempInput = document.createElement('textarea');
    tempInput.style.position = 'fixed';
    tempInput.style.left = '50%';
    tempInput.style.top = '50%';
    tempInput.style.transform = 'translate(-50%, -50%)';
    tempInput.style.width = '300px';
    tempInput.style.height = '100px';
    tempInput.style.padding = '10px';
    tempInput.style.border = '2px solid #a855f7';
    tempInput.style.borderRadius = '8px';
    tempInput.style.backgroundColor = '#2A2A2A';
    tempInput.style.color = '#FFFFFF';
    tempInput.style.fontSize = '16px';
    tempInput.style.zIndex = '10000';
    tempInput.placeholder = 'Press Fn+Fn or your dictation key to start speaking...';
    
    document.body.appendChild(tempInput);
    tempInput.focus();
    
    // Listen for input changes
    tempInput.addEventListener('input', (e) => {
      if (this.callbacks && this.callbacks.onResult) {
        this.callbacks.onResult({
          transcript: e.target.value,
          isFinal: true
        });
      }
    });
    
    // Add done button
    const doneButton = document.createElement('button');
    doneButton.textContent = 'Done';
    doneButton.style.position = 'fixed';
    doneButton.style.left = '50%';
    doneButton.style.top = 'calc(50% + 70px)';
    doneButton.style.transform = 'translateX(-50%)';
    doneButton.style.padding = '8px 20px';
    doneButton.style.backgroundColor = '#a855f7';
    doneButton.style.color = '#FFFFFF';
    doneButton.style.border = 'none';
    doneButton.style.borderRadius = '6px';
    doneButton.style.cursor = 'pointer';
    doneButton.style.zIndex = '10001';
    
    doneButton.onclick = () => {
      const text = tempInput.value;
      document.body.removeChild(tempInput);
      document.body.removeChild(doneButton);
      
      if (text && this.callbacks && this.callbacks.onResult) {
        this.callbacks.onResult({
          transcript: text,
          isFinal: true
        });
      }
      
      if (this.callbacks && this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
      
      this.isListening = false;
    };
    
    document.body.appendChild(doneButton);
  }

  async startListening(callbacks = {}) {
    if (this.isListening) {
      return Promise.resolve();
    }

    this.isListening = true;
    this.callbacks = callbacks;

    return new Promise((resolve, reject) => {
      try {
        callbacks.onStart?.();
        
        if (this.recognition && this.recognition.start) {
          this.recognition.start();
        } else {
          // Use macOS dictation as fallback
          this.useMacOSDictation();
        }
        
        resolve();
      } catch (error) {
        this.isListening = false;
        callbacks.onError?.('Failed to start speech recognition: ' + error.message);
        reject(error);
      }
    });
  }

  stopListening() {
    if (this.recognition && this.recognition.stop) {
      this.recognition.stop();
    }
    this.isListening = false;
  }

  // Text-to-speech methods (same as original)
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
      speechRecognition: true, // We provide offline alternatives
      speechSynthesis: 'speechSynthesis' in window
    };
  }
}

export default new OfflineVoiceService();