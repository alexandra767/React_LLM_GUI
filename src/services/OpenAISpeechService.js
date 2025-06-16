// OpenAI Whisper API Service for speech recognition
class OpenAISpeechService {
  constructor() {
    this.isListening = false;
    this.apiKey = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  async startListening(callbacks = {}) {
    if (this.isListening) {
      return Promise.resolve();
    }

    if (!this.apiKey) {
      callbacks.onError?.('OpenAI API key not configured. Please add your API key in Settings.');
      return Promise.reject('No API key');
    }

    this.isListening = true;
    this.audioChunks = [];

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16
        } 
      });
      
      // Create MediaRecorder for easier audio capture
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        console.log('[OpenAISpeech] Recording stopped, processing audio...');
        
        // Create blob from chunks
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Send to OpenAI Whisper API
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          formData.append('model', 'whisper-1');
          formData.append('language', 'en');
          
          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: formData
          });
          
          if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
          }
          
          const result = await response.json();
          console.log('[OpenAISpeech] Transcription result:', result);
          
          if (result.text) {
            callbacks.onResult?.({
              transcript: result.text,
              isFinal: true
            });
          }
        } catch (error) {
          console.error('[OpenAISpeech] API error:', error);
          callbacks.onError?.(error.message);
        }
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      this.mediaRecorder.start();
      callbacks.onStart?.();
      console.log('[OpenAISpeech] Started recording');
      
      return Promise.resolve();
    } catch (error) {
      this.isListening = false;
      callbacks.onError?.('Failed to access microphone: ' + error.message);
      return Promise.reject(error);
    }
  }

  stopListening() {
    if (!this.isListening || !this.mediaRecorder) return;
    
    console.log('[OpenAISpeech] Stopping recording');
    this.isListening = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  isSupported() {
    return {
      speechRecognition: true,
      speechSynthesis: false
    };
  }
}

export default new OpenAISpeechService();