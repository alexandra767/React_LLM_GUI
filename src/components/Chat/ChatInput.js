import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import voiceService from '../../services/VoiceService';
import offlineVoiceService from '../../services/OfflineVoiceService';

const InputContainer = styled('div')({
  position: 'relative',
  padding: '0 24px 24px',
  backgroundColor: '#1E1E1E'
});

const InputWrapper = styled('div')({
  position: 'relative',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.2s ease',
  overflow: 'hidden',
  '&:focus-within': {
    borderColor: 'rgba(168, 85, 247, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  }
});

const Textarea = styled('textarea')({
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#F0F0F0',
  fontSize: '15px',
  fontFamily: 'inherit',
  padding: '14px 100px 14px 20px', // Increased right padding for both buttons
  resize: 'none',
  lineHeight: 1.5,
  minHeight: '52px',
  maxHeight: '200px',
  '&::placeholder': {
    color: '#888888'
  },
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5
  }
});

const SendButton = styled('button')(({ disabled }) => ({
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: disabled ? '#666666' : '#a855f7',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: '#9333ea',
    transform: 'translateY(-50%) scale(1.05)'
  },
  '&:active:not(:disabled)': {
    transform: 'translateY(-50%) scale(0.95)'
  },
  '& svg': {
    width: '20px',
    height: '20px'
  }
}));

const MicButton = styled('button')(({ isListening, disabled }) => ({
  position: 'absolute',
  right: '56px',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: isListening ? '#ef4444' : 'transparent',
  color: isListening ? '#FFFFFF' : '#888888',
  border: '1px solid',
  borderColor: isListening ? '#ef4444' : '#444444',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: isListening ? '#dc2626' : 'rgba(255, 255, 255, 0.05)',
    borderColor: isListening ? '#dc2626' : '#666666',
    color: isListening ? '#FFFFFF' : '#AAAAAA'
  },
  '&:active:not(:disabled)': {
    transform: 'translateY(-50%) scale(0.95)'
  },
  '& svg': {
    width: '20px',
    height: '20px'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
}));

const VoiceIndicator = styled('div')(({ isListening }) => ({
  position: 'absolute',
  right: '56px',
  top: '-30px',
  backgroundColor: '#1E1E1E',
  border: '1px solid #ef4444',
  borderRadius: '16px',
  padding: '4px 12px',
  fontSize: '12px',
  color: '#ef4444',
  display: isListening ? 'flex' : 'none',
  alignItems: 'center',
  gap: '6px',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-5px',
    right: '14px',
    width: '10px',
    height: '10px',
    backgroundColor: '#1E1E1E',
    borderRight: '1px solid #ef4444',
    borderBottom: '1px solid #ef4444',
    transform: 'rotate(45deg)'
  }
}));

const PulsingDot = styled('span')({
  width: '6px',
  height: '6px',
  backgroundColor: '#ef4444',
  borderRadius: '50%',
  animation: 'pulse 1.5s ease-in-out infinite'
});

const ChatInput = React.forwardRef(({ onSendMessage, disabled }, ref) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const theme = useTheme();
  const { appState } = useApp();
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Expose focus method
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));
  
  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Check if voice is supported and enabled
  const isVoiceSupported = voiceService.isSupported().speechRecognition;
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [useOfflineRecognition, setUseOfflineRecognition] = useState(true);
  
  // Load voice settings and monitor online status
  useEffect(() => {
    const savedSettings = localStorage.getItem('sephia_voice_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setVoiceEnabled(parsed.voiceEnabled !== false);
        setUseOfflineRecognition(parsed.useOfflineRecognition !== false);
      } catch (e) {
        console.error('Failed to load voice settings:', e);
      }
    }
    
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleVoiceInput = async () => {
    if (!isVoiceSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    
    if (!voiceEnabled) {
      alert('Voice features are disabled. Enable them in Settings.');
      return;
    }
    
    // Only check online status if using online recognition
    if (!useOfflineRecognition && !isOnline) {
      alert('Online speech recognition requires an internet connection. Enable offline recognition in Settings or connect to the internet.');
      return;
    }

    if (isListening) {
      // Stop listening
      const selectedService = useOfflineRecognition ? offlineVoiceService : voiceService;
      selectedService.stopListening();
      setIsListening(false);
      
      // Send the message if we have a transcript
      if (transcript.trim()) {
        onSendMessage(transcript.trim());
        setTranscript('');
        setMessage('');
      }
    } else {
      // Start listening
      try {
        // First check if we have microphone permission
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            console.log('[ChatInput] Requesting microphone permission...');
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('[ChatInput] Microphone permission granted');
          } catch (permError) {
            console.error('[ChatInput] Microphone permission denied:', permError);
            alert('Microphone access is required for voice input. Please grant permission and try again.');
            return;
          }
        }
        
        setIsListening(true);
        setTranscript('');
        
        // Use offline or online service based on settings
        const selectedService = useOfflineRecognition ? offlineVoiceService : voiceService;
        
        await selectedService.startListening({
          onStart: () => {
            console.log('[ChatInput] Voice recognition started');
          },
          onResult: (result) => {
            console.log('[ChatInput] Voice result:', result);
            if (result.isFinal) {
              setTranscript(result.transcript);
              setMessage(result.transcript);
            } else {
              // Show interim results
              setMessage(result.transcript);
            }
          },
          onError: (error) => {
            console.error('[ChatInput] Voice recognition error:', error);
            setIsListening(false);
            
            // Provide more helpful error messages
            if (error.includes('network')) {
              alert('Network error: Speech recognition requires an internet connection for processing. Please check your connection and try again.');
            } else if (error.includes('not-allowed')) {
              alert('Microphone permission denied. Please allow microphone access in your system settings.');
            } else {
              alert(error);
            }
          },
          onEnd: () => {
            console.log('[ChatInput] Voice recognition ended');
            setIsListening(false);
          }
        });
      } catch (error) {
        console.error('[ChatInput] Failed to start voice recognition:', error);
        alert('Failed to start voice recognition: ' + error.message);
        setIsListening(false);
      }
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // Keep focus on input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-adjust height
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };
  
  return (
    <InputContainer>
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.7;
          }
        }
      `}</style>
      <form onSubmit={handleSubmit}>
        <InputWrapper>
          <VoiceIndicator isListening={isListening}>
            <PulsingDot />
            Listening...
          </VoiceIndicator>
          
          <Textarea
            ref={inputRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Type a message..."}
            disabled={disabled || isListening}
            rows={1}
          />
          
          <MicButton
            type="button"
            onClick={handleVoiceInput}
            isListening={isListening}
            disabled={disabled || (!useOfflineRecognition && !isOnline)}
            title={
              useOfflineRecognition 
                ? (isListening ? "Stop recording" : "Start voice input (Offline mode)")
                : (!isOnline ? "Offline - Internet required for online voice input" : (isListening ? "Stop recording" : "Start voice input"))
            }
            style={{ opacity: (!useOfflineRecognition && !isOnline) ? 0.5 : 1 }}
          >
            {isListening ? (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" fill="currentColor"/>
                <path d="M17 11V12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12V11H5V12C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12V11H17Z" fill="currentColor"/>
              </svg>
            )}
          </MicButton>
          
          {!isOnline && (
            <div style={{
              position: 'absolute',
              right: '56px',
              bottom: '-20px',
              fontSize: '10px',
              color: '#ff6b6b',
              whiteSpace: 'nowrap',
              background: '#1E1E1E',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #ff6b6b'
            }}>
              Offline - Voice input disabled
            </div>
          )}
          
          <SendButton 
            type="submit" 
            disabled={!message.trim() || disabled || isListening}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </SendButton>
        </InputWrapper>
      </form>
    </InputContainer>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;