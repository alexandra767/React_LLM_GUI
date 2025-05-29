/**
 * Bark TTS Voice Service
 * High-quality text-to-speech using Bark AI models
 * Provides multiple voice presets and advanced speech synthesis
 */

class BarkVoiceService {
  constructor() {
    this.baseUrl = 'http://localhost:8189';
    this.isSupported = true;
    this.voices = [];
    this.currentVoice = 'v2/en_speaker_1'; // Default to Sarah (Female)
    this.isServerRunning = false;
    
    // Initialize service
    this.init();
  }

  async init() {
    try {
      await this.checkServerStatus();
      await this.loadVoices();
      console.log('[BarkVoiceService] Initialized successfully');
    } catch (error) {
      console.warn('[BarkVoiceService] Server not running:', error.message);
      this.isServerRunning = false;
    }
  }

  async checkServerStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const status = await response.json();
      this.isServerRunning = status.status === 'running';
      
      console.log('[BarkVoiceService] Server status:', {
        running: this.isServerRunning,
        modelsLoaded: status.models_loaded,
        gpuAvailable: status.gpu_available,
        device: status.device
      });
      
      return status;
    } catch (error) {
      console.error('[BarkVoiceService] Server check failed:', error);
      this.isServerRunning = false;
      throw error;
    }
  }

  async loadVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`);
      if (!response.ok) {
        throw new Error(`Failed to load voices: ${response.status}`);
      }
      
      const data = await response.json();
      this.voices = Object.entries(data.voices).map(([id, info]) => ({
        id,
        name: info.name,
        language: info.language,
        gender: info.gender,
        style: info.style,
        localService: true
      }));
      
      console.log('[BarkVoiceService] Loaded voices:', this.voices.length);
      return this.voices;
    } catch (error) {
      console.error('[BarkVoiceService] Failed to load voices:', error);
      // Fallback to default voice list if server unavailable
      this.voices = [
        { id: 'v2/en_speaker_1', name: 'Sarah (Female)', language: 'English', gender: 'Female', style: 'Friendly', localService: true }
      ];
      return this.voices;
    }
  }

  async getVoices() {
    if (!this.isServerRunning) {
      await this.init();
    }
    return this.voices;
  }

  async speak(text, options = {}) {
    if (!this.isServerRunning) {
      throw new Error('Bark TTS server is not running. Start it with: ./start-bark-tts.sh');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const voice = options.voice || this.currentVoice;
    
    console.log('[BarkVoiceService] Generating speech:', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      voice,
      temperature: options.temperature || 0.7
    });

    try {
      const requestBody = {
        text: text.trim(),
        voice: voice,
        temperature: options.temperature || 0.7,
        silent: false
      };

      const response = await fetch(`${this.baseUrl}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(`TTS generation failed: ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`TTS generation failed: ${result.error || 'Unknown error'}`);
      }

      // Play the audio
      await this.playAudioData(result.audio_data);
      
      console.log('[BarkVoiceService] Speech completed:', {
        duration: result.duration,
        voice: result.voice_used
      });

      return {
        success: true,
        duration: result.duration,
        voice: result.voice_used
      };

    } catch (error) {
      console.error('[BarkVoiceService] Speech generation error:', error);
      throw error;
    }
  }

  async playAudioData(audioData) {
    return new Promise((resolve, reject) => {
      try {
        console.log('[BarkVoiceService] Processing audio data:', {
          type: typeof audioData,
          length: audioData?.length || 'unknown',
          isDataUrl: audioData?.startsWith?.('data:') || false,
          isBlob: audioData instanceof Blob,
          preview: typeof audioData === 'string' ? audioData.substring(0, 50) : 'not string'
        });
        
        let audioUrl;
        
        // Handle different audio data formats
        if (typeof audioData === 'string') {
          if (audioData.startsWith('data:audio/')) {
            // Already a data URL
            audioUrl = audioData;
          } else if (audioData.startsWith('http')) {
            // HTTP URL
            audioUrl = audioData;
          } else {
            // Assume base64 encoded audio, create proper data URL
            audioUrl = `data:audio/wav;base64,${audioData}`;
          }
        } else if (audioData instanceof Blob) {
          // Blob data
          audioUrl = URL.createObjectURL(audioData);
        } else {
          throw new Error('Unsupported audio data format');
        }
        
        console.log('[BarkVoiceService] Using audio URL:', audioUrl.substring(0, 100) + '...');
        
        const audio = new Audio(audioUrl);
        
        // Add more detailed event listeners for debugging
        audio.onloadstart = () => {
          console.log('[BarkVoiceService] Audio loading started');
        };
        
        audio.oncanplay = () => {
          console.log('[BarkVoiceService] Audio can start playing');
        };
        
        audio.oncanplaythrough = () => {
          console.log('[BarkVoiceService] Audio can play through without buffering');
        };
        
        audio.onplay = () => {
          console.log('[BarkVoiceService] Audio playback started');
        };
        
        audio.onended = () => {
          console.log('[BarkVoiceService] Audio playback completed');
          // Clean up blob URL if we created one
          if (audioData instanceof Blob) {
            URL.revokeObjectURL(audioUrl);
          }
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error('[BarkVoiceService] Audio playback error:', {
            error: error,
            audioError: audio.error,
            networkState: audio.networkState,
            readyState: audio.readyState,
            audioUrl: audioUrl.substring(0, 100)
          });
          
          // Clean up blob URL if we created one
          if (audioData instanceof Blob) {
            URL.revokeObjectURL(audioUrl);
          }
          
          reject(new Error(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`));
        };
        
        audio.onabort = () => {
          console.log('[BarkVoiceService] Audio playback aborted');
        };
        
        audio.onstalled = () => {
          console.warn('[BarkVoiceService] Audio playback stalled');
        };
        
        audio.onsuspend = () => {
          console.log('[BarkVoiceService] Audio playback suspended');
        };
        
        audio.onwaiting = () => {
          console.log('[BarkVoiceService] Audio playback waiting for data');
        };
        
        // Set volume and play
        audio.volume = 1.0; // Maximum volume to ensure audibility
        console.log('[BarkVoiceService] Starting audio playback with volume:', audio.volume);
        
        // Check browser autoplay policy
        audio.play().then(() => {
          console.log('[BarkVoiceService] Audio play() promise resolved successfully');
        }).catch((playError) => {
          console.error('[BarkVoiceService] Audio play() failed:', playError);
          
          // Clean up blob URL if we created one
          if (audioData instanceof Blob) {
            URL.revokeObjectURL(audioUrl);
          }
          
          if (playError.name === 'NotAllowedError') {
            reject(new Error('Audio playback blocked by browser autoplay policy. Please interact with the page first.'));
          } else {
            reject(new Error(`Audio playback failed: ${playError.message}`));
          }
        });
        
      } catch (error) {
        console.error('[BarkVoiceService] Error in playAudioData:', error);
        reject(error);
      }
    });
  }

  setVoice(voiceId) {
    const voice = this.voices.find(v => v.id === voiceId);
    if (voice) {
      this.currentVoice = voiceId;
      console.log('[BarkVoiceService] Voice changed to:', voice.name);
      return true;
    }
    console.warn('[BarkVoiceService] Voice not found:', voiceId);
    return false;
  }

  getCurrentVoice() {
    return this.voices.find(v => v.id === this.currentVoice) || this.voices[0];
  }

  async stop() {
    // Stop any currently playing audio
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    console.log('[BarkVoiceService] Stopped all audio playback');
  }

  async pause() {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => audio.pause());
    console.log('[BarkVoiceService] Paused audio playback');
  }

  async resume() {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (audio.paused && audio.currentTime > 0) {
        audio.play();
      }
    });
    console.log('[BarkVoiceService] Resumed audio playback');
  }

  // Test method to verify service is working
  async test() {
    try {
      const status = await this.checkServerStatus();
      if (!status.models_loaded) {
        return {
          success: false,
          message: 'Bark models are still loading. Please wait a moment and try again.'
        };
      }

      await this.speak('Hello, this is a test of the Bark voice service.', {
        voice: 'v2/en_speaker_1'
      });

      return {
        success: true,
        message: 'Bark TTS is working correctly!',
        voices: this.voices.length,
        currentVoice: this.getCurrentVoice().name
      };

    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  // Test system audio output
  async testSystemAudio() {
    return new Promise((resolve) => {
      try {
        console.log('[BarkVoiceService] Testing system audio output...');
        
        // Create a simple test tone
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5); // Play for 0.5 seconds
        
        oscillator.onended = () => {
          console.log('[BarkVoiceService] Test tone completed');
          audioContext.close();
          resolve({
            success: true,
            message: 'System audio test completed. Did you hear a brief tone?'
          });
        };
        
        // Fallback timeout
        setTimeout(() => {
          console.log('[BarkVoiceService] Audio test timeout');
          audioContext.close();
          resolve({
            success: false,
            message: 'Audio test timed out - possible audio system issue'
          });
        }, 2000);
        
      } catch (error) {
        console.error('[BarkVoiceService] System audio test failed:', error);
        resolve({
          success: false,
          message: `System audio test failed: ${error.message}`
        });
      }
    });
  }

  // Check audio output devices
  async checkAudioDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      
      console.log('[BarkVoiceService] Available audio output devices:', audioOutputs.map(d => ({
        deviceId: d.deviceId,
        label: d.label || 'Unknown device',
        groupId: d.groupId
      })));
      
      return {
        success: true,
        devices: audioOutputs,
        defaultDevice: audioOutputs.find(d => d.deviceId === 'default') || audioOutputs[0]
      };
    } catch (error) {
      console.error('[BarkVoiceService] Failed to enumerate audio devices:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get service info
  getInfo() {
    return {
      name: 'Bark TTS',
      type: 'AI Voice Synthesis',
      quality: 'High',
      local: true,
      voices: this.voices.length,
      features: [
        'High-quality AI voices',
        'Multiple voice presets',
        'Emotional speech synthesis',
        'Local processing (privacy)',
        'No API costs'
      ],
      status: this.isServerRunning ? 'Running' : 'Offline'
    };
  }
}

export default BarkVoiceService;