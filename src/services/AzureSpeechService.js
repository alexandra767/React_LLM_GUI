// Azure Speech Service for speech recognition
class AzureSpeechService {
  constructor() {
    this.isListening = false;
    this.apiKey = null;
    this.region = 'eastus'; // Default region
    this.recognizer = null;
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  setRegion(region) {
    this.region = region;
  }

  async startListening(callbacks = {}) {
    if (this.isListening) {
      return Promise.resolve();
    }

    if (!this.apiKey) {
      callbacks.onError?.('Azure API key not configured. Please add your API key in Settings.');
      return Promise.reject('No API key');
    }

    this.isListening = true;

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context for recording
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create a processor to capture audio
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      let audioData = [];
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioData.push(...inputData);
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      callbacks.onStart?.();
      console.log('[AzureSpeech] Started recording');
      
      // Store cleanup function
      this.cleanup = () => {
        processor.disconnect();
        source.disconnect();
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
      };
      
      // Store audio data for later processing
      this.audioData = audioData;
      this.audioContext = audioContext;
      
      return Promise.resolve();
    } catch (error) {
      this.isListening = false;
      callbacks.onError?.('Failed to access microphone: ' + error.message);
      return Promise.reject(error);
    }
  }

  async stopListening() {
    if (!this.isListening) return;
    
    console.log('[AzureSpeech] Stopping recording');
    this.isListening = false;
    
    if (this.cleanup) {
      this.cleanup();
    }
    
    // Convert audio data to WAV
    const wavBuffer = this.createWavBuffer(this.audioData, this.audioContext.sampleRate);
    
    // Send to Azure Speech API
    try {
      const response = await fetch(
        `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Content-Type': 'audio/wav',
            'Accept': 'application/json'
          },
          body: wavBuffer
        }
      );
      
      if (!response.ok) {
        throw new Error(`Azure API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[AzureSpeech] Recognition result:', result);
      
      if (result.RecognitionStatus === 'Success') {
        return result.DisplayText;
      } else {
        console.warn('[AzureSpeech] Recognition failed:', result);
        return null;
      }
    } catch (error) {
      console.error('[AzureSpeech] API error:', error);
      throw error;
    }
  }

  createWavBuffer(audioData, sampleRate) {
    const length = audioData.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return arrayBuffer;
  }

  isSupported() {
    return {
      speechRecognition: true,
      speechSynthesis: false
    };
  }
}

export default new AzureSpeechService();