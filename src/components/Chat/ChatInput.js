import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import voiceService from '../../services/VoiceService';
import offlineVoiceService from '../../services/OfflineVoiceService';
import azureSpeechService from '../../services/AzureSpeechService';
import openAISpeechService from '../../services/OpenAISpeechService';
import voskSpeechService from '../../services/VoskSpeechService';
import { extractTextFromPDF } from '../../utils/pdfExtractor';
import integrationService from '../../services/IntegrationService';

const InputContainer = styled('div')({
  position: 'relative',
  padding: '0 24px 24px',
  backgroundColor: '#1E1E1E',
  overflow: 'visible'
});

const InputWrapper = styled('div')({
  position: 'relative',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.2s ease',
  overflow: 'visible',
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
  padding: '14px 188px 14px 20px', // Increased right padding for four buttons
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

const IntegrationsButton = styled('button')(({ disabled }) => ({
  backgroundColor: 'transparent',
  color: '#888888',
  border: '1px solid #444444',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: '#666666',
    color: '#AAAAAA'
  },
  '&:active:not(:disabled)': {
    transform: 'scale(0.95)'
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

const AttachButton = styled('button')(({ disabled }) => ({
  position: 'absolute',
  right: '100px',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'transparent',
  color: '#888888',
  border: '1px solid #444444',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: '#666666',
    color: '#AAAAAA'
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

const AttachmentsContainer = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '12px',
  padding: '0 24px'
});

const AttachmentChip = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: 'rgba(168, 85, 247, 0.1)',
  border: '1px solid rgba(168, 85, 247, 0.3)',
  borderRadius: '16px',
  padding: '4px 12px',
  fontSize: '13px',
  color: '#a855f7',
  '& .remove-btn': {
    cursor: 'pointer',
    marginLeft: '4px',
    opacity: 0.7,
    '&:hover': {
      opacity: 1
    }
  }
});

const IntegrationsDropdown = styled('div')(({ isOpen }) => ({
  position: 'absolute',
  bottom: 'calc(100% + 8px)',
  right: '-20px',
  backgroundColor: '#1a1a1a',
  border: '1px solid #333333',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  display: isOpen ? 'block' : 'none',
  minWidth: '320px',
  zIndex: 10000,
  padding: '8px 0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  maxHeight: '400px',
  overflowY: 'auto'
}));

const IntegrationOption = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '12px 20px',
  backgroundColor: 'transparent',
  border: 'none',
  color: '#E0E0E0',
  fontSize: '15px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  }
});

const IntegrationInfo = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flex: 1,
  '& svg': {
    width: '24px',
    height: '24px',
    flexShrink: 0
  }
});

const IntegrationLabel = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '& .beta-badge': {
    fontSize: '11px',
    color: '#3B82F6',
    fontWeight: '600',
    letterSpacing: '0.5px'
  }
});

const ToggleSwitch = styled('label')(({ checked }) => ({
  position: 'relative',
  display: 'inline-block',
  width: '44px',
  height: '24px',
  cursor: 'pointer',
  '& input': {
    opacity: 0,
    width: 0,
    height: 0,
  },
  '& .slider': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: checked ? '#3B82F6' : '#4B5563',
    transition: '.3s',
    borderRadius: '24px',
    '&:before': {
      position: 'absolute',
      content: '""',
      height: '18px',
      width: '18px',
      left: checked ? '23px' : '3px',
      bottom: '3px',
      backgroundColor: 'white',
      transition: '.3s',
      borderRadius: '50%',
    },
  },
}));

const MenuHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 20px 12px',
  color: '#9CA3AF',
  fontSize: '13px',
  borderBottom: '1px solid #333333',
  marginBottom: '8px',
  '& svg': {
    width: '16px',
    height: '16px'
  }
});

// Portal component for dropdown
const DropdownPortal = ({ children, targetRef, isOpen }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if (targetRef?.current && isOpen) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8, // 8px above the button
        left: rect.left + rect.width - 320 // Align right edge with button
      });
    }
  }, [targetRef, isOpen]);
  
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: `${position.top}px`,
      left: `${position.left}px`,
      transform: 'translateY(-100%)',
      zIndex: 10000
    }}>
      {children}
    </div>,
    document.body
  );
};

const ChatInput = React.forwardRef(({ onSendMessage, disabled }, ref) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [integrationStates, setIntegrationStates] = useState({
    webSearch: true,
    driveSearch: true,
    gmailSearch: true,
    calendarSearch: true
  });
  const theme = useTheme();
  const { appState } = useApp();
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const integrationsButtonRef = useRef(null);
  
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
  const [useOfflineRecognition, setUseOfflineRecognition] = useState(true); // Default to offline recognition
  const [speechProvider, setSpeechProvider] = useState('browser');
  const [apiKeys, setApiKeys] = useState({ azure: '', openai: '' });
  
  // Load voice settings and monitor online status
  useEffect(() => {
    console.log('[ChatInput] Loading voice settings...');
    const savedSettings = localStorage.getItem('sephia_voice_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        console.log('[ChatInput] Loaded settings:', parsed);
        setVoiceEnabled(parsed.voiceEnabled !== false);
        setUseOfflineRecognition(parsed.useOfflineRecognition !== false);
        setSpeechProvider(parsed.speechProvider || 'browser');
        setApiKeys({
          azure: parsed.azureApiKey || '',
          openai: parsed.openaiApiKey || ''
        });
        
        // Configure services with API keys
        if (parsed.azureApiKey) {
          azureSpeechService.setApiKey(parsed.azureApiKey);
        }
        if (parsed.openaiApiKey) {
          openAISpeechService.setApiKey(parsed.openaiApiKey);
        }
      } catch (e) {
        console.error('Failed to load voice settings:', e);
      }
    } else {
      console.log('[ChatInput] No saved voice settings found, using defaults');
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

  // Handle click outside to close integrations dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showIntegrations && 
          !integrationsButtonRef.current?.contains(e.target) &&
          !e.target.closest('[data-integrations-dropdown]')) {
        setShowIntegrations(false);
      }
    };
    
    if (showIntegrations) {
      // Small delay to prevent immediate close on open
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showIntegrations]);

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
      let selectedService;
      switch (speechProvider) {
        case 'azure':
          selectedService = azureSpeechService;
          break;
        case 'openai':
          selectedService = openAISpeechService;
          break;
        case 'vosk':
          selectedService = voskSpeechService;
          break;
        case 'offline':
          selectedService = offlineVoiceService;
          break;
        default:
          selectedService = useOfflineRecognition ? offlineVoiceService : voiceService;
      }
      
      selectedService.stopListening();
      setIsListening(false);
      
      // Send the message if we have any text in the input
      // Get the current value from the textarea directly to avoid stale state
      const currentMessage = inputRef.current?.value || message;
      if (currentMessage.trim()) {
        onSendMessage(currentMessage.trim());
        setTranscript('');
        setMessage('');
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    } else {
      // Start listening
      try {
        // Remove the prompt fallback - we'll use proper offline mode instead
        // First check if we have microphone permission
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            console.log('[ChatInput] Requesting microphone permission...');
            // Request permission with specific constraints for built-in microphone
            const audioConstraints = {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                deviceId: 'default' // Use default (built-in) microphone
              }
            };
            
            await navigator.mediaDevices.getUserMedia(audioConstraints);
            console.log('[ChatInput] Microphone permission granted');
            
            // List available audio devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            console.log('[ChatInput] Available microphones:', audioInputs);
            
            // Test microphone by checking audio level
            const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            
            // Check audio levels with more detail
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let checkCount = 0;
            let maxLevel = 0;
            
            const checkInterval = setInterval(() => {
              analyser.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
              const max = Math.max(...dataArray);
              maxLevel = Math.max(maxLevel, max);
              
              console.log('[ChatInput] Microphone levels:', {
                average: average.toFixed(2),
                max: max,
                maxEver: maxLevel,
                isActive: max > 10 ? 'YES' : 'NO'
              });
              
              // Show visual feedback if audio is detected
              if (max > 10) {
                console.log('[ChatInput] 🎤 Audio detected! Level:', max);
              }
              
              checkCount++;
              if (checkCount > 10) { // Check for 2 seconds
                clearInterval(checkInterval);
                stream.getTracks().forEach(track => track.stop());
                audioContext.close();
                
                if (maxLevel < 10) {
                  console.warn('[ChatInput] ⚠️ No audio detected from microphone. Please check:');
                  console.warn('1. Microphone is not muted in System Settings');
                  console.warn('2. App has microphone permission in System Settings > Privacy & Security > Microphone');
                  console.warn('3. Correct microphone is selected as default input device');
                }
              }
            }, 200);
            
          } catch (permError) {
            console.error('[ChatInput] Microphone permission denied:', permError);
            alert('Microphone access is required for voice input. Please grant permission and try again.');
            return;
          }
        }
        
        setIsListening(true);
        setTranscript('');
        setMessage(''); // Clear message when starting
        
        // Select the appropriate service based on provider
        let selectedService;
        switch (speechProvider) {
          case 'azure':
            selectedService = azureSpeechService;
            break;
          case 'openai':
            selectedService = openAISpeechService;
            break;
          case 'vosk':
            selectedService = voskSpeechService;
            break;
          case 'offline':
            selectedService = offlineVoiceService;
            break;
          default:
            selectedService = useOfflineRecognition ? offlineVoiceService : voiceService;
        }
        
        console.log('[ChatInput] Using speech provider:', speechProvider);
        console.log('[ChatInput] Service object:', selectedService);
        
        await selectedService.startListening({
          onStart: () => {
            console.log('[ChatInput] Voice recognition started');
          },
          onResult: (result) => {
            console.log('[ChatInput] Voice result:', result);
            console.log('[ChatInput] Current message state before update:', message);
            if (result.isFinal) {
              setTranscript(result.transcript);
              setMessage(result.transcript);
              console.log('[ChatInput] Set final transcript:', result.transcript);
            } else {
              // Show interim results
              setMessage(result.transcript);
              console.log('[ChatInput] Set interim message:', result.transcript);
            }
            // Force update the textarea value directly as a workaround
            const textarea = inputRef.current;
            if (textarea) {
              textarea.value = result.transcript;
              // Trigger React's onChange handler to sync state
              const event = new Event('input', { bubbles: true });
              textarea.dispatchEvent(event);
              console.log('[ChatInput] Directly set textarea value and triggered event:', result.transcript);
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
  
  const handleFileAttach = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const newFiles = await Promise.all(files.map(async (file) => {
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        content: null
      };
      
      // Read file content based on type
      if (file.type.startsWith('text/') || 
          file.name.endsWith('.txt') || 
          file.name.endsWith('.md') || 
          file.name.endsWith('.json') ||
          file.name.endsWith('.js') ||
          file.name.endsWith('.py') ||
          file.name.endsWith('.java') ||
          file.name.endsWith('.c') ||
          file.name.endsWith('.cpp') ||
          file.name.endsWith('.h') ||
          file.name.endsWith('.cs') ||
          file.name.endsWith('.html') ||
          file.name.endsWith('.css') ||
          file.name.endsWith('.xml') ||
          file.name.endsWith('.yaml') ||
          file.name.endsWith('.yml')) {
        // Read as text
        fileData.content = await file.text();
      } else if (file.type.startsWith('image/')) {
        // Convert to base64 for images
        const reader = new FileReader();
        fileData.content = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Extract text from PDF
        try {
          fileData.content = await extractTextFromPDF(file);
        } catch (error) {
          console.error('Failed to extract PDF text:', error);
          fileData.content = `[PDF file: ${file.name} - Failed to extract text]`;
        }
      } else {
        // For other files, just store metadata
        fileData.content = `[Binary file: ${file.name}]`;
      }
      
      return fileData;
    }));
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeAttachment = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const toggleIntegration = (key) => {
    setIntegrationStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Debug log when dropdown state changes
  useEffect(() => {
    console.log('[ChatInput] Integrations dropdown is:', showIntegrations ? 'OPEN' : 'CLOSED');
  }, [showIntegrations]);
  
  const handleWebSearch = async () => {
    if (!integrationStates.webSearch) return;
    
    const searchQuery = prompt('What would you like to search for?');
    if (!searchQuery) return;
    
    setMessage(prev => {
      const newMessage = prev + (prev ? '\n\n' : '') + 
        `🔍 Web Search: "${searchQuery}"\n[Searching the web for relevant information...]`;
      return newMessage;
    });
    setShowIntegrations(false);
  };
  
  const handleGmailSearch = async () => {
    if (!integrationStates.gmailSearch) return;
    
    const searchQuery = prompt('Search Gmail for:');
    if (!searchQuery) return;
    
    setMessage(prev => {
      const newMessage = prev + (prev ? '\n\n' : '') + 
        `📧 Gmail Search: "${searchQuery}"\n[Searching your Gmail for relevant emails...]`;
      return newMessage;
    });
    setShowIntegrations(false);
  };
  
  const handleGoogleDriveClick = async () => {
    if (!integrationStates.driveSearch) return;
    
    setShowIntegrations(false);
    try {
      // Check if already authorized
      if (!integrationService.isGoogleAuthorized) {
        await integrationService.signInGoogle();
      }
      
      // Get recent files
      const files = await integrationService.listGoogleDriveFiles();
      
      // Show file picker dialog
      const selectedFile = await showGoogleDriveFilePicker(files);
      if (selectedFile) {
        // Get file content
        const fileData = await integrationService.getGoogleDriveFile(selectedFile.id);
        
        // Add to attachments
        setAttachedFiles(prev => [...prev, {
          name: fileData.name,
          size: parseInt(fileData.size || 0),
          type: fileData.mimeType,
          content: fileData.content || `[Google Drive file: ${fileData.name}]`,
          source: 'google-drive'
        }]);
      }
    } catch (error) {
      console.error('Google Drive integration error:', error);
      alert('Failed to connect to Google Drive. Please check your settings and try again.');
    }
  };
  
  const handleAppleCalendarClick = async () => {
    if (!integrationStates.calendarSearch) return;
    
    setShowIntegrations(false);
    try {
      // Check if we need to connect first
      if (!integrationService.isAppleAuthorized) {
        // Get credentials from settings
        const settings = JSON.parse(localStorage.getItem('sephia_settings') || '{}');
        if (!settings.appleId || !settings.appleAppPassword) {
          alert('Please configure your Apple ID and app-specific password in Settings first.');
          return;
        }
        
        // Try to connect
        await integrationService.connectAppleCalendar(settings.appleId, settings.appleAppPassword);
      }
      
      // Get calendar events for the next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      
      const events = await integrationService.getAppleCalendarEvents(startDate, endDate);
      const formattedEvents = integrationService.formatCalendarEvents(events);
      
      // Add calendar summary to message
      setMessage(prev => {
        const newMessage = prev + (prev ? '\n\n' : '') + 
          '--- Apple Calendar (Next 7 Days) ---\n' + formattedEvents;
        return newMessage;
      });
    } catch (error) {
      console.error('Apple Calendar integration error:', error);
      if (error.message.includes('CORS')) {
        alert('Apple Calendar requires running in Electron app or using a proxy server due to browser security restrictions.\n\nFor now, demo calendar data will be shown.');
        // Still show demo data
        const demoEvents = [
          {
            title: 'Demo: Team Meeting',
            start: new Date().toISOString(),
            end: new Date(Date.now() + 3600000).toISOString(),
            location: 'Conference Room'
          }
        ];
        const formattedEvents = integrationService.formatCalendarEvents(demoEvents);
        setMessage(prev => prev + (prev ? '\n\n' : '') + 
          '--- Apple Calendar (Demo) ---\n' + formattedEvents);
      } else {
        alert('Failed to connect to Apple Calendar. Please check your settings and try again.');
      }
    }
  };
  
  // Simple file picker for Google Drive (in real app, this would be a modal)
  const showGoogleDriveFilePicker = async (files) => {
    const fileList = files.map((file, index) => 
      `${index + 1}. ${file.name} (${file.mimeType})`
    ).join('\n');
    
    const selection = prompt(
      `Select a file from Google Drive:\n\n${fileList}\n\nEnter file number (1-${files.length}):`
    );
    
    if (selection) {
      const index = parseInt(selection) - 1;
      if (index >= 0 && index < files.length) {
        return files[index];
      }
    }
    return null;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[ChatInput] handleSubmit called with message:', message);
    
    if ((message.trim() || attachedFiles.length > 0) && !disabled) {
      // Prepare message with attachments
      let fullMessage = message.trim();
      
      console.log('[ChatInput] Sending message:', fullMessage);
      
      if (attachedFiles.length > 0) {
        fullMessage += '\n\n--- Attached Files ---\n';
        attachedFiles.forEach(file => {
          fullMessage += `\n📎 ${file.name} (${formatFileSize(file.size)})\n`;
          if (file.content && typeof file.content === 'string' && !file.content.startsWith('data:')) {
            // For text files, include content
            fullMessage += '```\n' + file.content + '\n```\n';
          } else if (file.content && file.content.startsWith('data:image/')) {
            // For images, indicate it's attached
            fullMessage += '[Image attached]\n';
          }
        });
      }
      
      console.log('[ChatInput] Calling onSendMessage with:', fullMessage);
      onSendMessage(fullMessage, attachedFiles);
      setMessage('');
      setAttachedFiles([]);
      
      // Keep focus on input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } else {
      console.log('[ChatInput] Message is empty or disabled:', { message, disabled });
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleTextareaChange = (e) => {
    console.log('[ChatInput] Textarea change:', e.target.value);
    setMessage(e.target.value);
    
    // Auto-adjust height
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };
  
  return (
    <>
      {attachedFiles.length > 0 && (
        <AttachmentsContainer>
          {attachedFiles.map((file, index) => (
            <AttachmentChip key={index}>
              <span>📎 {file.name} ({formatFileSize(file.size)})</span>
              <span 
                className="remove-btn" 
                onClick={() => removeAttachment(index)}
                style={{ cursor: 'pointer' }}
              >
                ✕
              </span>
            </AttachmentChip>
          ))}
        </AttachmentsContainer>
      )}
      
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
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileAttach}
            accept="*/*"
          />
          
          <div style={{ 
            position: 'absolute',
            right: '144px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}>
            <IntegrationsButton
              ref={integrationsButtonRef}
              type="button"
              onClick={() => setShowIntegrations(!showIntegrations)}
              disabled={disabled}
              title="Integrations"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20.5 7.5l-4.5 4.5M7.5 16.5l-4 4M16.5 16.5l4 4M7.5 7.5l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </IntegrationsButton>
          </div>
          
          <DropdownPortal targetRef={integrationsButtonRef} isOpen={showIntegrations}>
            <IntegrationsDropdown isOpen={true} data-integrations-dropdown>
              <MenuHeader>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Search menu
              </MenuHeader>
              
              <IntegrationOption onClick={handleWebSearch}>
                <IntegrationInfo>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 2C14.5 6 15.5 9 15.5 12c0 3-1 6-3.5 10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <IntegrationLabel>
                    <span>Web search</span>
                  </IntegrationLabel>
                </IntegrationInfo>
                <ToggleSwitch checked={integrationStates.webSearch}>
                  <input 
                    type="checkbox" 
                    checked={integrationStates.webSearch}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleIntegration('webSearch');
                    }}
                  />
                  <span className="slider"></span>
                </ToggleSwitch>
              </IntegrationOption>
              
              <IntegrationOption onClick={handleGoogleDriveClick}>
                <IntegrationInfo>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.5 12.5L15.5 4H8L1 12.5L4.5 18.5H12L8.5 12.5Z" fill="#4285F4"/>
                    <path d="M15.5 4L8.5 12.5L12 18.5L19 10L15.5 4Z" fill="#34A853"/>
                    <path d="M12 18.5L8.5 12.5L1 12.5L4.5 18.5H12Z" fill="#FBBC04"/>
                    <path d="M19 10L12 18.5H19.5L23 12.5L19 10Z" fill="#EA4335"/>
                  </svg>
                  <IntegrationLabel>
                    <span>Google Drive</span>
                    <span className="beta-badge">BETA</span>
                  </IntegrationLabel>
                </IntegrationInfo>
                <ToggleSwitch checked={integrationStates.driveSearch}>
                  <input 
                    type="checkbox" 
                    checked={integrationStates.driveSearch}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleIntegration('driveSearch');
                    }}
                  />
                  <span className="slider"></span>
                </ToggleSwitch>
              </IntegrationOption>
              
              <IntegrationOption onClick={handleGmailSearch}>
                <IntegrationInfo>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="#EA4335"/>
                    <path d="M22 6l-10 7L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <IntegrationLabel>
                    <span>Gmail search</span>
                    <span className="beta-badge">BETA</span>
                  </IntegrationLabel>
                </IntegrationInfo>
                <ToggleSwitch checked={integrationStates.gmailSearch}>
                  <input 
                    type="checkbox" 
                    checked={integrationStates.gmailSearch}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleIntegration('gmailSearch');
                    }}
                  />
                  <span className="slider"></span>
                </ToggleSwitch>
              </IntegrationOption>
              
              <IntegrationOption onClick={handleAppleCalendarClick}>
                <IntegrationInfo>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" fill="#3B82F6" stroke="#3B82F6" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2"/>
                    <text x="12" y="17" fill="white" fontSize="10" textAnchor="middle" fontWeight="bold">31</text>
                  </svg>
                  <IntegrationLabel>
                    <span>Google Calendar</span>
                    <span className="beta-badge">BETA</span>
                  </IntegrationLabel>
                </IntegrationInfo>
                <ToggleSwitch checked={integrationStates.calendarSearch}>
                  <input 
                    type="checkbox" 
                    checked={integrationStates.calendarSearch}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleIntegration('calendarSearch');
                    }}
                  />
                  <span className="slider"></span>
                </ToggleSwitch>
              </IntegrationOption>
            </IntegrationsDropdown>
          </DropdownPortal>
          
          <AttachButton
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Attach files"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </AttachButton>
          
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
            disabled={(!message.trim() && attachedFiles.length === 0) || disabled || isListening}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </SendButton>
        </InputWrapper>
      </form>
    </InputContainer>
    </>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;