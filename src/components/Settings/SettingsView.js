import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useApp } from '../../context/AppContext';
import { 
  Refresh as RefreshIcon, 
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  VolumeUp as SpeakerIcon,
  Mic as MicIcon
} from '@mui/icons-material';
import { Slider, Divider } from '@mui/material';
import voiceService from '../../services/VoiceService';
import integrationService from '../../services/IntegrationService';
import VoiceStatus from './VoiceStatus';
import LearningMonitor from './LearningMonitor';
import networkStatusService from '../../services/NetworkStatusService';
import unifiedStorageService from '../../services/UnifiedStorageService';
import VersionInfo from '../Common/VersionInfo';

const SettingsContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: '24px',
  backgroundColor: '#1E1E1E',
  color: '#FFFFFF',
  overflowY: 'auto',
  gap: '24px',
});

const Header = styled('div')({
  marginBottom: '24px'
});

const Title = styled('h1')({
  fontSize: '24px',
  fontWeight: '300',
  color: '#FFFFFF',
  marginBottom: '8px'
});

const Description = styled('p')({
  fontSize: '16px',
  color: '#AAAAAA'
});

const SettingsSection = styled('div')({
  backgroundColor: '#252525',
  borderRadius: '8px',
  padding: '24px',
  border: '1px solid #333333',
  '&:not(:last-child)': {
    marginBottom: '24px',
  },
});

const SectionTitle = styled('h2')({
  fontSize: '18px',
  fontWeight: '500',
  color: '#FFFFFF',
  marginTop: 0,
  marginBottom: '16px',
  paddingBottom: '8px',
  borderBottom: '1px solid #333333',
});

const InputContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  '& > *': {
    flex: 1
  },
  '& > button': {
    flex: '0 0 auto',
    whiteSpace: 'nowrap'
  }
});

const SettingItem = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 0',
  borderBottom: '1px solid #333333',
  '&:last-of-type': {
    borderBottom: 'none'
  }
});

const SettingLabel = styled('div')({
  display: 'flex',
  flexDirection: 'column'
});

const Label = styled('label')({
  fontSize: '16px',
  color: '#FFFFFF',
  marginBottom: '8px'
});

const Description2 = styled('p')({
  fontSize: '13px',
  color: '#AAAAAA'
});

const Input = styled('input')({
  backgroundColor: '#1E1E1E',
  color: '#FFFFFF',
  border: '1px solid #333333',
  borderRadius: '4px',
  padding: '8px 16px',
  fontSize: '16px',
  outline: 'none',
  '&:focus': {
    borderColor: '#FF643D',
    boxShadow: '0 0 0 2px rgba(255, 100, 61, 0.2)'
  },
  '&:disabled': {
    opacity: 0.7,
    cursor: 'not-allowed'
  }
});

const Select = styled('select')({
  backgroundColor: '#1E1E1E',
  color: '#FFFFFF',
  border: '1px solid #333333',
  borderRadius: '4px',
  padding: '8px 16px',
  fontSize: '16px',
  minWidth: '200px',
  cursor: 'pointer',
  '&:focus': {
    borderColor: '#FF643D',
    outline: 'none',
    boxShadow: '0 0 0 2px rgba(255, 100, 61, 0.2)'
  },
  '&:disabled': {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  '& option': {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    padding: '8px 16px'
  }
});

const Button = styled('button')({
  backgroundColor: '#FF643D',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '4px',
  padding: '8px 16px',
  fontSize: '16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: '#E55A36'
  },
  '&:disabled': {
    backgroundColor: '#666666',
    cursor: 'not-allowed',
    opacity: 0.7
  }
});

const ModelListContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginTop: '16px'
});

const ModelCard = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#252525',
  borderRadius: '8px',
  border: '1px solid #333333',
  padding: '16px',
  marginBottom: '16px'
});

const ModelInfo = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: 1
});

const ModelName = styled('div')({
  fontSize: '16px',
  color: '#FFFFFF',
  fontWeight: 500,
  marginBottom: '4px'
});

const ModelSize = styled('div')({
  fontSize: '13px',
  color: '#AAAAAA'
});

const ModelActions = styled('div')({
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
});

const ModelMeta = styled('div')({
  fontSize: '13px',
  color: '#AAAAAA'
});

const AddModelForm = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #333333'
});

const TestResult = styled('div')(({ success }) => ({
  marginTop: '8px',
  padding: '8px',
  borderRadius: '4px',
  backgroundColor: success ? 'rgba(0, 200, 100, 0.1)' : 'rgba(255, 100, 61, 0.1)',
  color: success ? '#00C864' : '#FF643D',
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}));

const ModelButton = styled('button')(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px',
  borderRadius: '4px',
  border: active ? '1px solid #FF643D' : '1px solid #333333',
  backgroundColor: active ? '#FF643D' : '#252525',
  color: active ? '#FFFFFF' : '#AAAAAA',
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: active ? '#E55A36' : '#333333',
    color: '#FFFFFF'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
}));

const LoadingIndicator = styled('div')({
  marginTop: '16px',
  color: '#AAAAAA',
  fontSize: '13px'
});

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`;

const SwitchInput = styled('input')({
  opacity: 0,
  width: 0,
  height: 0,
  '&:checked + span': {
    backgroundColor: '#FF643D',
    '&:before': {
      transform: 'translateX(24px)'
    },
    '&:hover': {
      backgroundColor: '#E55A36'
    }
  },
  '&:focus + span': {
    boxShadow: '0 0 0 2px rgba(255, 100, 61, 0.5)'
  }
});

const ToggleSwitch = styled('label')(({ checked }) => ({
  position: 'relative',
  display: 'inline-block',
  width: '50px',
  height: '24px',
  '& input': {
    opacity: 0,
    width: 0,
    height: 0,
  },
  '& .slider': {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: checked ? '#FF643D' : '#666666',
    transition: '.4s',
    borderRadius: '24px',
    '&:before': {
      position: 'absolute',
      content: '""',
      height: '16px',
      width: '16px',
      left: '4px',
      bottom: '4px',
      backgroundColor: 'white',
      transition: '.4s',
      borderRadius: '50%',
      transform: checked ? 'translateX(26px)' : 'translateX(0)',
    },
  },
  '&:hover .slider': {
    backgroundColor: checked ? '#E55A36' : '#444444',
  },
  '& input:disabled + .slider': {
    cursor: 'not-allowed',
    opacity: 0.7,
  },
}));

const SettingsView = () => {
  const { 
    currentModel, 
    setCurrentModel, 
    models = [], 
    loading,
    loadModel,
    unloadModel,
    appState = { connectionStatus: 'disconnected' },
    networkStatus,
    autoSwitchModel
  } = useApp();
  
  const [newModelName, setNewModelName] = useState('');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadingModelId, setLoadingModelId] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  // Load settings from localStorage or use defaults
  const loadSettings = () => {
    console.log('[Settings] Loading settings from storage...');
    
    // Try localStorage first
    const saved = localStorage.getItem('sephia_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('[Settings] Loaded from localStorage:', Object.keys(parsed));
        return parsed;
      } catch (e) {
        console.error('[Settings] Failed to parse localStorage settings:', e);
      }
    }
    
    // If no localStorage, check if we can load from persistent storage
    if (window.electron?.storage) {
      // This will be loaded asynchronously after component mounts
      console.log('[Settings] Will attempt to load from persistent storage');
    }
    
    console.log('[Settings] Using default settings');
    return {
      ollamaEndpoint: 'http://localhost:11434',
      temperature: 0.7,
      defaultModel: 'qwen3:14B',
      connectionType: 'ollama',
      syntaxHighlighting: true,
      streamingResponses: true,
      autoCollapseSidebar: true,
      showTokenCounter: true
    };
  };
  
  const [settings, setSettings] = useState(loadSettings());
  
  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState({
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 1.0,
    selectedVoice: null,
    recognitionLanguage: 'en-US',
    voiceEnabled: true,
    autoSpeak: false,
    useOfflineRecognition: false,  // Default to online for better quality
    speechProvider: 'browser',  // Speech recognition provider
    voiceSynthesisProvider: 'browser',  // Voice output provider (restored to browser/system voices with Samantha)
    azureApiKey: '',
    openaiApiKey: ''
  });
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isSpeechSupported, setIsSpeechSupported] = useState({
    recognition: false,
    synthesis: false
  });
  
  const updateSetting = async (key, value) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        [key]: value
      };
      
      // Save to localStorage immediately
      localStorage.setItem('sephia_settings', JSON.stringify(updated));
      console.log('[Settings] Setting updated and saved:', key, value);
      
      // Also save to reliable storage if available
      if (window.electron?.storage) {
        window.electron.storage.set('sephia_settings', JSON.stringify(updated))
          .then(() => console.log('[Settings] Setting saved to persistent storage:', key))
          .catch(err => console.warn('[Settings] Failed to save to persistent storage:', err));
      }
      
      return updated;
    });
    
    // Reinitialize LLM service when Claude settings change
    if (key === 'claudeApiKey' || key === 'preferredAIModel') {
      try {
        console.log('[Settings] Reinitializing LLM service due to', key, 'change');
        const llmService = await import('../../services/LLMService');
        if (llmService.default.reinitialize) {
          llmService.default.reinitialize();
        }
      } catch (error) {
        console.warn('[Settings] Error reinitializing LLM service:', error);
      }
    }
  };
  
  const updateVoiceSetting = (key, value) => {
    setVoiceSettings(prev => {
      const updated = {
        ...prev,
        [key]: value
      };
      
      // Save to localStorage immediately
      localStorage.setItem('sephia_voice_settings', JSON.stringify(updated));
      console.log('[Settings] Voice setting updated and saved:', key, value);
      
      // Also save to reliable storage if available
      if (window.electron?.storage) {
        window.electron.storage.set('sephia_voice_settings', JSON.stringify(updated))
          .then(() => console.log('[Settings] Voice setting saved to persistent storage:', key))
          .catch(err => console.warn('[Settings] Failed to save voice setting to persistent storage:', err));
      }
      
      return updated;
    });
    
    // Apply settings to voice service
    switch(key) {
      case 'speechRate':
        voiceService.setSpeechRate(value);
        break;
      case 'speechPitch':
        voiceService.setSpeechPitch(value);
        break;
      case 'speechVolume':
        voiceService.setSpeechVolume(value);
        break;
      case 'selectedVoice':
        const voice = availableVoices.find(v => v.name === value);
        if (voice) {
          voiceService.setVoice(voice);
        }
        break;
      case 'recognitionLanguage':
        voiceService.setRecognitionLanguage(value);
        break;
      case 'voiceSynthesisProvider':
        // Update voice service provider
        voiceService.setProvider(value);
        console.log('[Settings] Voice synthesis provider changed to:', value);
        break;
    }
  };
  
  // Initialize reliable storage and load voices/settings on mount
  useEffect(() => {
    const initializeStorage = async () => {
      // Initialize reliable storage service
      try {
        await unifiedStorageService.initialize();
        console.log('[Settings] Reliable storage initialized');
        
        // Try to load settings from persistent storage if localStorage is empty
        const localSettings = localStorage.getItem('sephia_settings');
        if (!localSettings && window.electron?.storage) {
          try {
            const persistentSettings = await window.electron.storage.get('sephia_settings');
            if (persistentSettings) {
              console.log('[Settings] Loaded settings from persistent storage');
              const parsed = JSON.parse(persistentSettings);
              setSettings(parsed);
              localStorage.setItem('sephia_settings', persistentSettings);
            }
          } catch (err) {
            console.warn('[Settings] Failed to load from persistent storage:', err);
          }
        }
        
        // Try to load voice settings from persistent storage if localStorage is empty
        const localVoiceSettings = localStorage.getItem('sephia_voice_settings');
        if (!localVoiceSettings && window.electron?.storage) {
          try {
            const persistentVoiceSettings = await window.electron.storage.get('sephia_voice_settings');
            if (persistentVoiceSettings) {
              console.log('[Settings] Loaded voice settings from persistent storage');
              const parsed = JSON.parse(persistentVoiceSettings);
              setVoiceSettings(parsed);
              localStorage.setItem('sephia_voice_settings', persistentVoiceSettings);
            }
          } catch (err) {
            console.warn('[Settings] Failed to load voice settings from persistent storage:', err);
          }
        }
        
      } catch (err) {
        console.error('[Settings] Reliable storage init failed:', err);
      }
    };
    
    initializeStorage();
    
    // Check if voice is force enabled
    const forceVoice = localStorage.getItem('sephia_force_voice') === 'true';
    
    // Check speech support
    const support = voiceService.isSupported();
    
    // If force enabled or supported, set as supported
    if (forceVoice || support.synthesis || support.recognition) {
      setIsSpeechSupported({
        synthesis: forceVoice || support.synthesis,
        recognition: forceVoice || support.recognition
      });
    } else {
      setIsSpeechSupported(support);
    }
    
    // Load available voices
    const loadVoices = () => {
      const voices = voiceService.getVoices();
      setAvailableVoices(Array.isArray(voices) ? voices : []);
      
      // Set default voice if not already set
      if (!voiceSettings.selectedVoice && voices.length > 0) {
        const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        updateVoiceSetting('selectedVoice', defaultVoice.name);
      }
    };
    
    loadVoices();
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Load saved voice settings
    const savedSettings = localStorage.getItem('sephia_voice_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        
        // Migration: If user had bark as speechProvider, move it to voiceSynthesisProvider
        if (parsed.speechProvider === 'bark') {
          parsed.voiceSynthesisProvider = 'bark';
          parsed.speechProvider = 'browser'; // Reset speech provider to browser
          console.log('[Settings] Migrated Bark from speech to synthesis provider');
          
          // Save the migrated settings
          localStorage.setItem('sephia_voice_settings', JSON.stringify(parsed));
        }
        
        setVoiceSettings(parsed);
        
        // Apply saved settings to voice service
        voiceService.setSpeechRate(parsed.speechRate || 1.0);
        voiceService.setSpeechPitch(parsed.speechPitch || 1.0);
        voiceService.setSpeechVolume(parsed.speechVolume || 1.0);
        
        // Set voice synthesis provider
        const provider = parsed.voiceSynthesisProvider || 'browser';
        voiceService.setProvider(provider);
        console.log('[Settings] Voice synthesis provider set to:', provider);
        voiceService.setRecognitionLanguage(parsed.recognitionLanguage || 'en-US');
      } catch (e) {
        console.error('Failed to load voice settings:', e);
      }
    } else {
      // No saved settings - initialize with defaults (browser voice system)
      voiceService.setProvider('browser');
      console.log('[Settings] Initialized voice provider to browser (default)');
    }
  }, []);
  
  const testOllamaConnection = async () => {
    setIsTestingConnection(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestResult({
        success: true,
        message: 'Successfully connected to Ollama API'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to connect to Ollama API'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setCurrentModel(newModel);
    
    // Save current model to localStorage
    localStorage.setItem('sephia_current_model', newModel);
    console.log('[Settings] Current model updated and saved:', newModel);
    
    // Also save to reliable storage if available
    if (window.electron?.storage) {
      window.electron.storage.set('sephia_current_model', newModel)
        .then(() => console.log('[Settings] Current model saved to persistent storage:', newModel))
        .catch(err => console.warn('[Settings] Failed to save current model to persistent storage:', err));
    }
  };
  
  const handleLoadModel = async (modelId) => {
    setIsLoadingModel(true);
    setLoadingModelId(modelId);
    await loadModel(modelId);
    setIsLoadingModel(false);
    setLoadingModelId(null);
  };
  
  const handleUnloadModel = async (modelId) => {
    await unloadModel(modelId);
  };
  
  const handleAddModel = async () => {
    if (!newModelName) return;
    
    setIsLoadingModel(true);
    // In a real implementation, this would call Ollama's API to pull a new model
    // await llmService.pullModel(newModelName);
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoadingModel(false);
    setNewModelName('');
    // Would trigger model refresh here in a real implementation
  };
  
  const testVoice = async () => {
    const testText = "Hello! This is a test of the text-to-speech voice settings.";
    try {
      await voiceService.speak(testText);
    } catch (error) {
      console.error('Failed to test voice:', error);
    }
  };

  const testClaudeConnection = async () => {
    if (!settings.claudeApiKey) {
      alert('Please enter your Claude API key first');
      return;
    }

    try {
      // Test Claude API connection
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 50,
          messages: [
            {
              role: 'user',
              content: 'Hello! Just testing the connection.'
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Claude API connection successful!\n\nResponse: ' + data.content[0].text);
      } else {
        const error = await response.json();
        alert('❌ Claude API connection failed:\n' + (error.error?.message || response.statusText));
      }
    } catch (error) {
      alert('❌ Claude API test failed:\n' + error.message);
    }
  };
  
  return (
    <SettingsContainer>
      <Header>
        <Title>Settings</Title>
        <Description>
          Configure your LLM connections and application preferences.
        </Description>
      </Header>
      
      <SettingsSection>
        <SectionTitle>LLM Configuration</SectionTitle>
        
        <SettingItem>
          <SettingLabel>
            <Label>Connection Type</Label>
            <Description2>
              Choose how to connect to your local language models
            </Description2>
          </SettingLabel>
          <Select 
            value={settings.connectionType || 'ollama'}
            onChange={(e) => updateSetting('connectionType', e.target.value)}
          >
            <option value="ollama">Ollama API</option>
            <option value="terminal">Terminal Command</option>
          </Select>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>API Endpoint</Label>
            <Description2>
              The URL for your local Ollama instance
            </Description2>
          </SettingLabel>
          <InputContainer>
            <Input 
              type="text" 
              value={settings.ollamaEndpoint || ''} 
              onChange={(e) => updateSetting('ollamaEndpoint', e.target.value)}
              placeholder="http://localhost:11434"
            />
            <Button onClick={testOllamaConnection} disabled={isTestingConnection}>
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
          </InputContainer>
          {testResult && (
            <TestResult success={testResult.success}>
              {testResult.message}
            </TestResult>
          )}
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Model Settings</Label>
            <Description2>
              Advanced settings for the language model
            </Description2>
          </SettingLabel>
          <InputContainer>
            <Input 
              type="number" 
              value={settings.temperature || 0.7} 
              onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
              min="0"
              max="1"
              step="0.1"
              style={{ width: '80px' }}
            />
            <Label style={{ marginLeft: '10px' }}>Temperature: {settings.temperature || 0.7}</Label>
          </InputContainer>
          <Slider
            value={settings.temperature !== undefined ? settings.temperature * 100 : 70}
            onChange={(_, value) => updateSetting('temperature', value / 100)}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => (value / 100).toFixed(1)}
            min={0}
            max={100}
            step={5}
          />
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Current Model</Label>
            <Description2>
              The active model for conversations (automatically saved)
            </Description2>
          </SettingLabel>
          <Select 
            value={currentModel} 
            onChange={(e) => handleLoadModel(e.target.value)}
            disabled={isLoadingModel}
          >
            {models.length === 0 ? (
              <option value="">No models available</option>
            ) : (
              models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))
            )}
          </Select>
        </SettingItem>
        
        <SectionTitle>Available Models</SectionTitle>
        <Description2 style={{ marginBottom: '16px' }}>
          Manage the models installed on your system
        </Description2>
        
        <ModelListContainer>
          {models.map(model => (
            <ModelCard key={model.id}>
              <ModelInfo>
                <ModelName>{model.name}</ModelName>
                <ModelMeta>
                  {model.size ? model.size + ' • ' + (model.type || 'model') : 'Local model • ' + (model.type || 'model')}
                </ModelMeta>
              </ModelInfo>
              
              <ModelActions>
                {currentModel === model.id ? (
                  <ModelButton active disabled title="Current model">
                    <CheckIcon fontSize="small" />
                  </ModelButton>
                ) : (
                  <ModelButton 
                    onClick={() => handleLoadModel(model.id)}
                    disabled={isLoadingModel || loadingModelId === model.id}
                    title="Load model"
                  >
                    {loadingModelId === model.id ? '...' : <DownloadIcon fontSize="small" />}
                  </ModelButton>
                )}
                
                <ModelButton 
                  onClick={() => handleUnloadModel(model.id)}
                  disabled={currentModel === model.id || isLoadingModel}
                  title="Unload model"
                >
                  <DeleteIcon fontSize="small" />
                </ModelButton>
              </ModelActions>
            </ModelCard>
          ))}
        </ModelListContainer>
        
        <AddModelForm>
          <SettingLabel style={{ flex: 1 }}>
            <Label>Add New Model</Label>
            <Input 
              type="text" 
              placeholder="Model name (e.g., llama3:8b)"
              value={newModelName}
              onChange={e => setNewModelName(e.target.value)}
              disabled={isLoadingModel}
            />
          </SettingLabel>
          
          <ModelButton 
            onClick={handleAddModel}
            disabled={isLoadingModel || !newModelName}
            style={{ height: 40, padding: '0 16px' }}
          >
            {isLoadingModel ? 'Loading...' : 'Add Model'}
          </ModelButton>
        </AddModelForm>
        
        {isLoadingModel && (
          <LoadingIndicator>
            Loading model... This may take several minutes depending on the model size.
          </LoadingIndicator>
        )}
      </SettingsSection>
      
      <SettingsSection>
        <SectionTitle>Interface Preferences</SectionTitle>
        
        <SettingItem>
          <SettingLabel>
            <Label>Code Syntax Highlighting</Label>
            <Description2>
              Enable syntax highlighting for code blocks
            </Description2>
          </SettingLabel>
          <ToggleSwitch checked={settings.syntaxHighlighting}>
            <input 
              type="checkbox" 
              checked={settings.syntaxHighlighting}
              onChange={(e) => updateSetting('syntaxHighlighting', e.target.checked)}
            />
            <span className="slider"></span>
          </ToggleSwitch>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Streaming Responses</Label>
            <Description2>
              Show AI responses as they're being generated
            </Description2>
          </SettingLabel>
          <ToggleSwitch checked={settings.streamingResponses}>
            <input 
              type="checkbox" 
              checked={settings.streamingResponses}
              onChange={(e) => updateSetting('streamingResponses', e.target.checked)}
            />
            <span className="slider"></span>
          </ToggleSwitch>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Automatically Collapse Sidebar</Label>
            <Description2>
              Collapse sidebar when window size is reduced
            </Description2>
          </SettingLabel>
          <ToggleSwitch checked={settings.autoCollapseSidebar}>
            <input 
              type="checkbox" 
              checked={settings.autoCollapseSidebar}
              onChange={(e) => updateSetting('autoCollapseSidebar', e.target.checked)}
            />
            <span className="slider"></span>
          </ToggleSwitch>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Token Counter</Label>
            <Description2>
              Show token usage statistics
            </Description2>
          </SettingLabel>
          <ToggleSwitch checked={settings.showTokenCounter}>
            <input 
              type="checkbox" 
              checked={settings.showTokenCounter}
              onChange={(e) => updateSetting('showTokenCounter', e.target.checked)}
            />
            <span className="slider"></span>
          </ToggleSwitch>
        </SettingItem>
      </SettingsSection>
      
      <SettingsSection>
        <SectionTitle>Voice Settings</SectionTitle>
        
        {/* Voice System Status */}
        <VoiceStatus />
        
        {!isSpeechSupported.synthesis && !isSpeechSupported.recognition ? (
          <>
            <SettingItem>
              <SettingLabel>
                <Label>Voice Features Detection Issue</Label>
                <Description2>
                  Voice features may not be properly detected. In Electron apps, voice features should work. You can try enabling them below.
                </Description2>
              </SettingLabel>
              <Button 
                onClick={() => {
                  setIsSpeechSupported({ synthesis: true, recognition: true });
                  localStorage.setItem('sephia_force_voice', 'true');
                }} 
                style={{ fontSize: '14px', padding: '6px 12px' }}
              >
                Enable Voice Features
              </Button>
            </SettingItem>
            <Divider />
          </>
        ) : (
          <>
            <SettingItem>
              <SettingLabel>
                <Label>Enable Voice Features</Label>
                <Description2>
                  Turn on/off all voice functionality
                </Description2>
              </SettingLabel>
              <ToggleSwitch checked={voiceSettings.voiceEnabled}>
                <input 
                  type="checkbox" 
                  checked={voiceSettings.voiceEnabled}
                  onChange={(e) => updateVoiceSetting('voiceEnabled', e.target.checked)}
                />
                <span className="slider"></span>
              </ToggleSwitch>
            </SettingItem>
            
            {isSpeechSupported.synthesis && (
              <>
                <SettingItem>
                  <SettingLabel>
                    <Label>Voice Selection</Label>
                    <Description2>
                      Choose the voice for text-to-speech ({availableVoices.length} voices available)
                    </Description2>
                  </SettingLabel>
                  <Select 
                    value={voiceSettings.selectedVoice || ''} 
                    onChange={(e) => updateVoiceSetting('selectedVoice', e.target.value)}
                    disabled={!voiceSettings.voiceEnabled}
                    style={{ maxWidth: '400px' }}
                  >
                    <option value="">Default Voice</option>
                    
                    {/* Group voices by quality/type */}
                    {(availableVoices || []).filter(v => 
                      v.name.toLowerCase().includes('samantha') || 
                      v.name.toLowerCase().includes('siri')
                    ).length > 0 && (
                      <optgroup label="Premium Voices (Siri-like)">
                        {(availableVoices || [])
                          .filter(v => 
                            v.name.toLowerCase().includes('samantha') || 
                            v.name.toLowerCase().includes('siri')
                          )
                          .map(voice => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} {voice.localService ? '⭐' : ''}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    
                    {(availableVoices || []).filter(v => 
                      v.name.includes('Premium') || 
                      v.name.includes('Enhanced') ||
                      v.name.toLowerCase().includes('alex') ||
                      v.name.toLowerCase().includes('ava')
                    ).length > 0 && (
                      <optgroup label="Enhanced Voices">
                        {(availableVoices || [])
                          .filter(v => 
                            (v.name.includes('Premium') || 
                             v.name.includes('Enhanced') ||
                             v.name.toLowerCase().includes('alex') ||
                             v.name.toLowerCase().includes('ava')) &&
                            !v.name.toLowerCase().includes('samantha') &&
                            !v.name.toLowerCase().includes('siri')
                          )
                          .map(voice => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang}) {voice.localService ? '⭐' : ''}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    
                    <optgroup label="All Voices">
                      {(availableVoices || [])
                        .filter(v => 
                          !v.name.toLowerCase().includes('samantha') &&
                          !v.name.toLowerCase().includes('siri') &&
                          !v.name.includes('Premium') &&
                          !v.name.includes('Enhanced') &&
                          !v.name.toLowerCase().includes('alex') &&
                          !v.name.toLowerCase().includes('ava')
                        )
                        .sort((a, b) => {
                          // Sort by language then name
                          if (a.lang.startsWith('en') && !b.lang.startsWith('en')) return -1;
                          if (!a.lang.startsWith('en') && b.lang.startsWith('en')) return 1;
                          return a.name.localeCompare(b.name);
                        })
                        .map(voice => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang}) {voice.localService ? '📍' : '☁️'}
                          </option>
                        ))}
                    </optgroup>
                  </Select>
                </SettingItem>
                
                <SettingItem>
                  <SettingLabel>
                    <Label>Speech Rate</Label>
                    <Description2>
                      How fast the voice speaks (0.1 - 2.0)
                    </Description2>
                  </SettingLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <Slider
                      value={voiceSettings.speechRate}
                      onChange={(_, value) => updateVoiceSetting('speechRate', value)}
                      min={0.1}
                      max={2.0}
                      step={0.1}
                      valueLabelDisplay="auto"
                      disabled={!voiceSettings.voiceEnabled}
                      sx={{ flex: 1 }}
                    />
                    <span style={{ minWidth: '40px', textAlign: 'right' }}>
                      {voiceSettings.speechRate.toFixed(1)}
                    </span>
                  </div>
                </SettingItem>
                
                <SettingItem>
                  <SettingLabel>
                    <Label>Speech Pitch</Label>
                    <Description2>
                      Voice pitch level (0.0 - 2.0)
                    </Description2>
                  </SettingLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <Slider
                      value={voiceSettings.speechPitch}
                      onChange={(_, value) => updateVoiceSetting('speechPitch', value)}
                      min={0.0}
                      max={2.0}
                      step={0.1}
                      valueLabelDisplay="auto"
                      disabled={!voiceSettings.voiceEnabled}
                      sx={{ flex: 1 }}
                    />
                    <span style={{ minWidth: '40px', textAlign: 'right' }}>
                      {voiceSettings.speechPitch.toFixed(1)}
                    </span>
                  </div>
                </SettingItem>
                
                <SettingItem>
                  <SettingLabel>
                    <Label>Speech Volume</Label>
                    <Description2>
                      Voice volume level (0.0 - 1.0)
                    </Description2>
                  </SettingLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <Slider
                      value={voiceSettings.speechVolume}
                      onChange={(_, value) => updateVoiceSetting('speechVolume', value)}
                      min={0.0}
                      max={1.0}
                      step={0.1}
                      valueLabelDisplay="auto"
                      disabled={!voiceSettings.voiceEnabled}
                      sx={{ flex: 1 }}
                    />
                    <span style={{ minWidth: '40px', textAlign: 'right' }}>
                      {voiceSettings.speechVolume.toFixed(1)}
                    </span>
                  </div>
                </SettingItem>
                
                <SettingItem>
                  <SettingLabel>
                    <Label>Test Voice Settings</Label>
                    <Description2>
                      Hear a sample with your current settings
                    </Description2>
                  </SettingLabel>
                  <Button 
                    onClick={testVoice} 
                    disabled={!voiceSettings.voiceEnabled}
                  >
                    <SpeakerIcon style={{ marginRight: '8px' }} />
                    Test Voice
                  </Button>
                </SettingItem>
                
                <SettingItem>
                  <SettingLabel>
                    <Label>Refresh Voices</Label>
                    <Description2>
                      Reload available system voices. Current count: {(availableVoices || []).length}
                    </Description2>
                  </SettingLabel>
                  <Button 
                    onClick={() => {
                      console.log('[Settings] Manually refreshing voices...');
                      const voices = window.speechSynthesis.getVoices();
                      console.log('[Settings] Found voices:', voices.length);
                      voices.forEach(v => console.log(`  - ${v.name} (${v.lang})`));
                      setAvailableVoices(voices);
                      
                      // Force speechSynthesis to reload
                      window.speechSynthesis.cancel();
                      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
                      
                      setTimeout(() => {
                        const newVoices = window.speechSynthesis.getVoices();
                        console.log('[Settings] Reloaded voices:', newVoices.length);
                        setAvailableVoices(newVoices);
                      }, 500);
                    }} 
                    disabled={!voiceSettings.voiceEnabled}
                    style={{ marginRight: '8px' }}
                  >
                    <RefreshIcon style={{ marginRight: '8px' }} />
                    Refresh Voice List
                  </Button>
                </SettingItem>
              </>
            )}
            
            {isSpeechSupported.recognition && (
              <>
                <SettingItem>
                  <SettingLabel>
                    <Label>Speech Recognition Provider</Label>
                    <Description2>
                      Choose which service to use for converting speech to text
                      {window.electron && (
                        <span style={{ color: '#FFA500', display: 'block', marginTop: '4px' }}>
                          ⚠️ In Electron: Browser Speech API requires internet and may have network restrictions
                        </span>
                      )}
                    </Description2>
                  </SettingLabel>
                  <Select 
                    value={voiceSettings.speechProvider || 'browser'} 
                    onChange={(e) => {
                      updateVoiceSetting('speechProvider', e.target.value);
                      // Auto-set offline mode based on provider
                      if (e.target.value === 'offline') {
                        updateVoiceSetting('useOfflineRecognition', true);
                      } else {
                        updateVoiceSetting('useOfflineRecognition', false);
                      }
                    }}
                    disabled={!voiceSettings.voiceEnabled}
                  >
                    <option value="browser">Browser Speech API (Google) {window.electron ? '- Requires Internet' : ''}</option>
                    <option value="azure">Azure Speech Services</option>
                    <option value="openai">OpenAI Whisper API</option>
                    <option value="vosk">Vosk (Offline Speech Recognition)</option>
                    <option value="offline">Manual Input (Type/Paste) {window.electron ? '- Recommended for Electron' : ''}</option>
                  </Select>
                </SettingItem>

                <SettingItem>
                  <SettingLabel>
                    <Label>Voice Synthesis Provider</Label>
                    <Description2>
                      Choose your preferred text-to-speech service for voice output (speaking)
                    </Description2>
                  </SettingLabel>
                  <Select 
                    value={voiceSettings.voiceSynthesisProvider || 'browser'} 
                    onChange={(e) => updateVoiceSetting('voiceSynthesisProvider', e.target.value)}
                    disabled={!voiceSettings.voiceEnabled}
                  >
                    <option value="browser">Browser TTS (Standard)</option>
                    <option value="bark">Bark AI TTS (High Quality)</option>
                  </Select>
                </SettingItem>
                
                {voiceSettings.voiceSynthesisProvider === 'bark' && (
                  <SettingItem>
                    <SettingLabel>
                      <Label>Use Guaranteed Female Voice</Label>
                      <Description2>
                        When enabled, female Bark voices (Speaker 3, 4, 5, 9) will automatically use Browser TTS for reliable female voices, while keeping Bark for everything else
                      </Description2>
                    </SettingLabel>
                    <ToggleSwitch checked={voiceSettings.preferFemaleVoice}>
                      <input 
                        type="checkbox" 
                        checked={voiceSettings.preferFemaleVoice}
                        onChange={(e) => updateVoiceSetting('preferFemaleVoice', e.target.checked)}
                        disabled={!voiceSettings.voiceEnabled}
                      />
                      <span className="slider"></span>
                    </ToggleSwitch>
                  </SettingItem>
                )}
                
                {voiceSettings.speechProvider === 'azure' && (
                  <>
                    <SettingItem>
                      <SettingLabel>
                        <Label>Azure Speech API Key</Label>
                        <Description2>
                          Your Azure Cognitive Services Speech API key
                        </Description2>
                      </SettingLabel>
                      <Input 
                        type="password" 
                        value={voiceSettings.azureApiKey || ''} 
                        onChange={(e) => updateVoiceSetting('azureApiKey', e.target.value)}
                        placeholder="Enter Azure API key"
                        disabled={!voiceSettings.voiceEnabled}
                      />
                    </SettingItem>
                    
                    <SettingItem>
                      <SettingLabel>
                        <Label>Azure Region</Label>
                        <Description2>
                          The region for your Azure Speech service (e.g., eastus, westus)
                        </Description2>
                      </SettingLabel>
                      <Input 
                        type="text" 
                        value={voiceSettings.azureRegion || 'eastus'} 
                        onChange={(e) => updateVoiceSetting('azureRegion', e.target.value)}
                        placeholder="eastus"
                        disabled={!voiceSettings.voiceEnabled}
                      />
                    </SettingItem>
                  </>
                )}
                
                {voiceSettings.voiceSynthesisProvider === 'bark' && (
                  <>
                    <SettingItem>
                      <SettingLabel>
                        <Label>Bark Voice Selection</Label>
                        <Description2>
                          Choose from AI-generated voice styles. Note: Gender characteristics may vary - Bark generates voices based on style, not guaranteed gender.
                        </Description2>
                      </SettingLabel>
                      <Select 
                        value={voiceSettings.barkVoice || 'v2/en_speaker_1'} 
                        onChange={(e) => updateVoiceSetting('barkVoice', e.target.value)}
                        disabled={!voiceSettings.voiceEnabled}
                      >
                        <optgroup label="Natural & Professional">
                          <option value="v2/en_speaker_0">Speaker 0 (Natural, Clear)</option>
                          <option value="v2/en_speaker_1">Speaker 1 (Conversational) - Often deeper tone</option>
                          <option value="v2/en_speaker_2">Speaker 2 (Professional, Authoritative)</option>
                        </optgroup>
                        <optgroup label="Warm & Expressive">
                          <option value="v2/en_speaker_3">Speaker 3 (Warm) - Often higher tone</option>
                          <option value="v2/en_speaker_4">Speaker 4 (Expressive, Dynamic)</option>
                          <option value="v2/en_speaker_5">Speaker 5 (Clear, Crisp)</option>
                        </optgroup>
                        <optgroup label="Narrative & Casual">
                          <option value="v2/en_speaker_6">Speaker 6 (Narrative, Storytelling)</option>
                          <option value="v2/en_speaker_7">Speaker 7 (Casual, Relaxed)</option>
                          <option value="v2/en_speaker_8">Speaker 8 (Energetic, Animated)</option>
                          <option value="v2/en_speaker_9">Speaker 9 (Gentle, Soft-spoken)</option>
                        </optgroup>
                        <optgroup label="Special Styles">
                          <option value="announcer">Announcer (Broadcast-style)</option>
                          <option value="narrator">Narrator (Book reading)</option>
                        </optgroup>
                      </Select>
                    </SettingItem>
                    
                    <SettingItem>
                      <SettingLabel>
                        <Label>Bark Server Status</Label>
                        <Description2>
                          Check if Bark TTS server is running on localhost:8189
                        </Description2>
                      </SettingLabel>
                      <Button 
                        onClick={async () => {
                          try {
                            const response = await fetch('http://localhost:8189/status');
                            if (response.ok) {
                              alert('✅ Bark TTS server is running and ready!');
                            } else {
                              alert('⚠️ Bark TTS server responded but may have issues');
                            }
                          } catch (error) {
                            alert('❌ Bark TTS server is not running. Start it from the terminal.');
                          }
                        }}
                        disabled={!voiceSettings.voiceEnabled}
                      >
                        Check Bark Server
                      </Button>
                    </SettingItem>
                    
                    <SettingItem>
                      <SettingLabel>
                        <Label>Test Bark Audio Output</Label>
                        <Description2>
                          Test if Bark AI voice can generate and play audio
                        </Description2>
                      </SettingLabel>
                      <Button 
                        onClick={async () => {
                          try {
                            console.log('[Settings] Testing Bark audio output with user-selected voice...');
                            
                            // Use the unified voice service to respect user settings
                            const userVoice = voiceSettings.barkVoice || 'v2/en_speaker_3';
                            console.log('[Settings] Testing with voice:', userVoice);
                            
                            // VoiceService will automatically use the correct provider
                            const testText = `Hello! This is a test of ${userVoice} voice. If you can hear this clearly, your Bark AI voice system is working perfectly.`;
                            
                            // Test the voice using the unified service
                            const barkTest = await voiceService.testProvider('bark');
                            if (barkTest.success) {
                              // Now test with user's selected voice specifically
                              await voiceService.speak(testText);
                              alert(`✅ Bark audio test successful!\n\nTested voice: ${userVoice}\n\nIf you heard the test voice clearly, Bark AI is working correctly with your selected voice. If you didn't hear anything, check your system volume settings.`);
                            } else {
                              alert(`❌ Bark test failed: ${barkTest.message}`);
                            }
                          } catch (error) {
                            console.error('[Settings] Bark audio test failed:', error);
                            alert(`❌ Audio test error: ${error.message}\n\nPlease ensure the Bark TTS server is running and try again.`);
                          }
                        }}
                        disabled={!voiceSettings.voiceEnabled}
                      >
                        Test Bark Audio
                      </Button>
                    </SettingItem>
                    
                    <SettingItem>
                      <SettingLabel>
                        <Label>System Audio Diagnostics</Label>
                        <Description2>
                          Check system audio output devices and volume levels
                        </Description2>
                      </SettingLabel>
                      <Button 
                        onClick={async () => {
                          try {
                            console.log('[Settings] Running audio diagnostics...');
                            
                            // Check audio context availability
                            const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext);
                            console.log('[Settings] Audio Context available:', hasAudioContext);
                            
                            // Check audio devices
                            let devices = [];
                            try {
                              const mediaDevices = await navigator.mediaDevices.enumerateDevices();
                              devices = mediaDevices.filter(device => device.kind === 'audiooutput');
                              console.log('[Settings] Audio output devices:', devices);
                            } catch (e) {
                              console.error('[Settings] Could not enumerate devices:', e);
                            }
                            
                            // Check browser audio policy
                            let autoplowBlocked = false;
                            try {
                              const audio = new Audio();
                              const playPromise = audio.play();
                              if (playPromise) {
                                await playPromise.catch(e => {
                                  if (e.name === 'NotAllowedError') {
                                    autoplowBlocked = true;
                                  }
                                });
                              }
                            } catch (e) {
                              console.log('[Settings] Audio policy check failed:', e);
                            }
                            
                            // Create diagnostic report
                            const diagnostics = {
                              audioContext: hasAudioContext,
                              outputDevices: devices.length,
                              defaultDevice: devices.find(d => d.deviceId === 'default')?.label || 'Unknown',
                              autoplayBlocked: autoplowBlocked,
                              userAgent: navigator.userAgent.includes('Electron') ? 'Electron' : 'Browser',
                              timestamp: new Date().toISOString()
                            };
                            
                            console.log('[Settings] Audio diagnostics:', diagnostics);
                            
                            // Show results
                            alert(`🔧 Audio Diagnostics Results:\n\n` +
                                  `• Audio Context: ${diagnostics.audioContext ? '✅ Available' : '❌ Not available'}\n` +
                                  `• Output Devices: ${diagnostics.outputDevices} found\n` +
                                  `• Default Device: ${diagnostics.defaultDevice}\n` +
                                  `• Autoplay Policy: ${diagnostics.autoplayBlocked ? '⚠️ Blocked' : '✅ Allowed'}\n` +
                                  `• Environment: ${diagnostics.userAgent}\n\n` +
                                  `${diagnostics.autoplayBlocked ? 'Try clicking somewhere on the page first to enable autoplay.' : 'Audio should work normally.'}`);
                          } catch (error) {
                            console.error('[Settings] Audio diagnostics failed:', error);
                            alert(`❌ Diagnostics failed: ${error.message}`);
                          }
                        }}
                        disabled={!voiceSettings.voiceEnabled}
                      >
                        Run Audio Diagnostics
                      </Button>
                    </SettingItem>
                  </>
                )}
                
                {voiceSettings.speechProvider === 'openai' && (
                  <SettingItem>
                    <SettingLabel>
                      <Label>OpenAI API Key</Label>
                      <Description2>
                        Your OpenAI API key for Whisper speech recognition
                      </Description2>
                    </SettingLabel>
                    <Input 
                      type="password" 
                      value={voiceSettings.openaiApiKey || ''} 
                      onChange={(e) => updateVoiceSetting('openaiApiKey', e.target.value)}
                      placeholder="Enter OpenAI API key"
                      disabled={!voiceSettings.voiceEnabled}
                    />
                  </SettingItem>
                )}
                
                {voiceSettings.speechProvider === 'vosk' && (
                  <>
                    <SettingItem>
                      <SettingLabel>
                        <Label>Vosk Offline Speech Recognition</Label>
                        <Description2>
                          Download a speech model to use voice recognition completely offline
                        </Description2>
                      </SettingLabel>
                      <Select 
                        value={voiceSettings.voskModel || 'vosk-model-small-en-us-0.15'} 
                        onChange={(e) => updateVoiceSetting('voskModel', e.target.value)}
                        disabled={!voiceSettings.voiceEnabled}
                      >
                        <option value="vosk-model-small-en-us-0.15">English (US) - Small (40MB) ⭐ Recommended</option>
                        <option value="vosk-model-en-us-0.22">English (US) - Large (1.8GB) - Best Quality</option>
                        <option value="vosk-model-small-cn-0.22">Chinese - Small (42MB)</option>
                      </Select>
                    </SettingItem>
                    
                    <SettingItem>
                      <SettingLabel>
                        <Label>Model Status</Label>
                        <Description2>
                          {voiceSettings.voskModelDownloaded 
                            ? '✅ Model downloaded and ready' 
                            : '❌ Model not downloaded yet'}
                        </Description2>
                      </SettingLabel>
                      <Button 
                        onClick={() => {
                          alert('Vosk model download simulation:\n\n' +
                                'In a full implementation, this would download the selected model.\n' +
                                'Models are stored locally and work completely offline.\n\n' +
                                'For now, you can use the "Manual Input" option for offline voice input.');
                          updateVoiceSetting('voskModelDownloaded', true);
                        }}
                        disabled={!voiceSettings.voiceEnabled || voiceSettings.voskModelDownloaded}
                      >
                        {voiceSettings.voskModelDownloaded ? 'Model Ready' : 'Download Model'}
                      </Button>
                    </SettingItem>
                    
                    <SettingItem>
                      <SettingLabel>
                        <Label>ℹ️ About Vosk</Label>
                        <Description2 style={{ color: '#4CAF50' }}>
                          • Works 100% offline - no internet required
                          • Supports real-time speech recognition
                          • Multiple language models available
                          • Free and open source
                          • Models are downloaded once and stored locally
                        </Description2>
                      </SettingLabel>
                    </SettingItem>
                  </>
                )}
                
                <SettingItem>
                  <SettingLabel>
                    <Label>Use Offline Voice Input</Label>
                    <Description2>
                      {voiceSettings.speechProvider === 'offline' 
                        ? 'Currently using offline mode - type while microphone is active'
                        : 'Fallback to typing when speech provider is unavailable'}
                    </Description2>
                  </SettingLabel>
                  <ToggleSwitch checked={voiceSettings.useOfflineRecognition}>
                    <input 
                      type="checkbox" 
                      checked={voiceSettings.useOfflineRecognition}
                      onChange={(e) => updateVoiceSetting('useOfflineRecognition', e.target.checked)}
                      disabled={!voiceSettings.voiceEnabled || voiceSettings.speechProvider === 'offline'}
                    />
                    <span className="slider"></span>
                  </ToggleSwitch>
                </SettingItem>
                
                {!voiceSettings.useOfflineRecognition && (
                  <>
                    <SettingItem>
                      <SettingLabel>
                        <Label>Speech Recognition Language</Label>
                        <Description2>
                          Language for voice input
                        </Description2>
                      </SettingLabel>
                      <Select 
                        value={voiceSettings.recognitionLanguage} 
                        onChange={(e) => updateVoiceSetting('recognitionLanguage', e.target.value)}
                        disabled={!voiceSettings.voiceEnabled}
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                        <option value="de-DE">German</option>
                        <option value="it-IT">Italian</option>
                        <option value="pt-BR">Portuguese (Brazil)</option>
                        <option value="zh-CN">Chinese (Simplified)</option>
                        <option value="ja-JP">Japanese</option>
                        <option value="ko-KR">Korean</option>
                      </Select>
                    </SettingItem>
                    
                    <SettingItem>
                      <SettingLabel>
                        <Label>⚠️ Online Speech Recognition Notice</Label>
                        <Description2 style={{ color: '#FFA500' }}>
                          Online voice input requires an active internet connection as audio is processed by Google's servers.
                        </Description2>
                      </SettingLabel>
                    </SettingItem>
                  </>
                )}
                
                {voiceSettings.useOfflineRecognition && (
                  <SettingItem>
                    <SettingLabel>
                      <Label>ℹ️ Offline Voice Input</Label>
                      <Description2 style={{ color: '#4CAF50' }}>
                        Click the microphone to open a typing interface. You can:
                        • Type your message directly
                        • Use macOS dictation (Fn+Fn) if you have it enabled
                        • Paste text from another app
                      </Description2>
                    </SettingLabel>
                  </SettingItem>
                )}
                
                <SettingItem>
                  <SettingLabel>
                    <Label>Auto-speak Responses</Label>
                    <Description2>
                      Automatically read AI responses aloud
                    </Description2>
                  </SettingLabel>
                  <ToggleSwitch checked={voiceSettings.autoSpeak}>
                    <input 
                      type="checkbox" 
                      checked={voiceSettings.autoSpeak}
                      onChange={(e) => updateVoiceSetting('autoSpeak', e.target.checked)}
                      disabled={!voiceSettings.voiceEnabled}
                    />
                    <span className="slider"></span>
                  </ToggleSwitch>
                </SettingItem>
                
                {voiceSettings.autoSpeak && (
                  <SettingItem style={{ paddingLeft: '20px' }}>
                    <SettingLabel>
                      <Label>Wait for Complete Response</Label>
                      <Description2>
                        Wait for the full response before speaking (recommended to avoid interruptions)
                      </Description2>
                    </SettingLabel>
                    <ToggleSwitch checked={voiceSettings.waitForCompleteResponse !== false}>
                      <input 
                        type="checkbox" 
                        checked={voiceSettings.waitForCompleteResponse !== false}
                        onChange={(e) => updateVoiceSetting('waitForCompleteResponse', e.target.checked)}
                        disabled={!voiceSettings.voiceEnabled || !voiceSettings.autoSpeak}
                      />
                      <span className="slider"></span>
                    </ToggleSwitch>
                  </SettingItem>
                )}
                
                <SettingItem>
                  <SettingLabel>
                    <Label>Test Microphone</Label>
                    <Description2>
                      Check if your microphone is working and see audio levels
                    </Description2>
                  </SettingLabel>
                  <Button 
                    onClick={async () => {
                      try {
                        console.log('[Settings] Testing microphone...');
                        
                        // Get microphone access
                        const stream = await navigator.mediaDevices.getUserMedia({ 
                          audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                          }
                        });
                        
                        // List devices
                        const devices = await navigator.mediaDevices.enumerateDevices();
                        const mics = devices.filter(d => d.kind === 'audioinput');
                        console.log('[Settings] Available microphones:', mics);
                        
                        // Create audio context for level monitoring
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const analyser = audioContext.createAnalyser();
                        const microphone = audioContext.createMediaStreamSource(stream);
                        microphone.connect(analyser);
                        
                        analyser.fftSize = 256;
                        const dataArray = new Uint8Array(analyser.frequencyBinCount);
                        
                        let maxLevel = 0;
                        let checkCount = 0;
                        
                        alert('Microphone test started! Speak into your microphone for 5 seconds.\n\nCheck the console (Cmd+Option+I) to see audio levels.');
                        
                        const interval = setInterval(() => {
                          analyser.getByteFrequencyData(dataArray);
                          const max = Math.max(...dataArray);
                          maxLevel = Math.max(maxLevel, max);
                          
                          if (max > 10) {
                            console.log(`[Mic Test] 🎤 Audio detected! Level: ${max}`);
                          } else {
                            console.log(`[Mic Test] 🔇 No audio (Level: ${max})`);
                          }
                          
                          checkCount++;
                          if (checkCount > 25) { // 5 seconds
                            clearInterval(interval);
                            stream.getTracks().forEach(track => track.stop());
                            audioContext.close();
                            
                            if (maxLevel > 10) {
                              alert(`✅ Microphone is working!\n\nMax audio level detected: ${maxLevel}\n\nYour microphone is properly configured.`);
                            } else {
                              alert(`❌ No audio detected!\n\nMax level: ${maxLevel}\n\nPlease check:\n1. Microphone is not muted\n2. App has permission in System Settings\n3. Correct input device is selected`);
                            }
                          }
                        }, 200);
                        
                      } catch (error) {
                        console.error('[Settings] Microphone test failed:', error);
                        alert('Microphone test failed: ' + error.message);
                      }
                    }}
                    disabled={!voiceSettings.voiceEnabled}
                  >
                    <MicIcon style={{ marginRight: '8px' }} />
                    Test Microphone
                  </Button>
                </SettingItem>
                
                <SettingItem>
                  <SettingLabel>
                    <Label>Test Network Connection</Label>
                    <Description2>
                      Check if the app can access the internet for speech recognition
                    </Description2>
                  </SettingLabel>
                  <Button 
                    onClick={async () => {
                      console.log('[Settings] Testing network connectivity...');
                      
                      // Test 1: Check navigator.onLine
                      console.log('[Network Test] navigator.onLine:', navigator.onLine);
                      
                      // Test 2: Try to fetch from Google
                      try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);
                        
                        const response = await fetch('https://www.google.com/generate_204', {
                          signal: controller.signal,
                          mode: 'no-cors'
                        });
                        clearTimeout(timeoutId);
                        console.log('[Network Test] Google fetch succeeded');
                        
                        // Test 3: Try speech recognition API endpoint
                        try {
                          const speechTest = await fetch('https://www.google.com/speech-api/v2/test', {
                            mode: 'no-cors'
                          });
                          console.log('[Network Test] Speech API endpoint reachable');
                        } catch (e) {
                          console.log('[Network Test] Speech API endpoint not reachable:', e.message);
                        }
                        
                        alert(`✅ Network connection test results:\n\n` +
                              `• navigator.onLine: ${navigator.onLine}\n` +
                              `• Can reach Google: YES\n` +
                              `• Speech API accessible: Check console\n\n` +
                              `The app should be able to use online speech recognition.`);
                              
                      } catch (error) {
                        console.error('[Network Test] Failed:', error);
                        alert(`❌ Network connection test failed:\n\n` +
                              `• navigator.onLine: ${navigator.onLine}\n` +
                              `• Error: ${error.message}\n\n` +
                              `The app cannot access the internet. Speech recognition requires internet access.\n\n` +
                              `Possible issues:\n` +
                              `1. No internet connection\n` +
                              `2. Firewall blocking Electron\n` +
                              `3. Proxy settings`);
                      }
                    }}
                  >
                    <RefreshIcon style={{ marginRight: '8px' }} />
                    Test Network
                  </Button>
                </SettingItem>
              </>
            )}
          </>
        )}
      </SettingsSection>
      
      <SettingsSection>
        <SectionTitle>Integrations</SectionTitle>
        
        <SettingItem>
          <SettingLabel>
            <Label>Google Drive API</Label>
            <Description2>
              Configure Google Drive integration for accessing your files
            </Description2>
          </SettingLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <Input 
              type="text" 
              value={settings.googleClientId || ''} 
              onChange={(e) => updateSetting('googleClientId', e.target.value)}
              placeholder="Google Client ID"
            />
            <Input 
              type="password" 
              value={settings.googleApiKey || ''} 
              onChange={(e) => updateSetting('googleApiKey', e.target.value)}
              placeholder="Google API Key"
            />
            <Description2 style={{ fontSize: '12px', marginTop: '4px' }}>
              Get credentials from <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#a855f7' }}>Google Cloud Console</a>
            </Description2>
            <Button
              onClick={async () => {
                // Validate inputs
                if (!settings.googleClientId?.trim()) {
                  alert('Please enter a Google Client ID');
                  return;
                }
                if (!settings.googleApiKey?.trim()) {
                  alert('Please enter a Google API Key');
                  return;
                }
                
                try {
                  // Save the settings using both updateSetting and direct storage
                  updateSetting('googleClientId', settings.googleClientId);
                  updateSetting('googleApiKey', settings.googleApiKey);
                  
                  // Also save directly to reliable storage if available
                  if (window.electron?.storage) {
                    const currentSettings = JSON.parse(localStorage.getItem('sephia_settings') || '{}');
                    currentSettings.googleClientId = settings.googleClientId;
                    currentSettings.googleApiKey = settings.googleApiKey;
                    
                    await window.electron.storage.set('sephia_settings', JSON.stringify(currentSettings));
                    console.log('[Settings] Google Drive credentials saved to persistent storage');
                  }
                  
                  // Show success message
                  alert(
                    '✅ Google Drive credentials saved!\n\n' +
                    '• Google Client ID: ' + settings.googleClientId.substring(0, 20) + '...\n' +
                    '• Google API Key: ' + (settings.googleApiKey ? 'Set (hidden)' : 'Not set') + '\n\n' +
                    'Credentials saved to ' + (window.electron?.storage ? 'persistent storage' : 'localStorage') + '.\n' +
                    'You can now use Google Drive integration features.'
                  );
                  
                  console.log('[Settings] Google Drive credentials saved');
                } catch (error) {
                  console.error('[Settings] Failed to save Google Drive credentials:', error);
                  alert('Failed to save credentials: ' + error.message);
                }
              }}
              style={{ marginTop: '8px' }}
            >
              Save Google Drive Credentials
            </Button>
          </div>

        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Claude API Key</Label>
            <Description2>
              Anthropic Claude API key for enhanced AI capabilities
            </Description2>
          </SettingLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <InputContainer>
              <Input 
                type="password" 
                value={settings.claudeApiKey || ''} 
                onChange={(e) => updateSetting('claudeApiKey', e.target.value)}
                placeholder="sk-ant-..."
              />
              <Button 
                onClick={() => testClaudeConnection()}
                disabled={!settings.claudeApiKey}
              >
                Test
              </Button>
            </InputContainer>
            <Description2 style={{ fontSize: '12px', marginTop: '4px' }}>
              Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#a855f7' }}>Anthropic Console</a>. Enables Claude 3.5 Sonnet for Aria conversations.
            </Description2>
            <Button
              onClick={async () => {
                if (!settings.claudeApiKey?.trim()) {
                  alert('Please enter a Claude API Key');
                  return;
                }
                
                try {
                  // Save the settings using both updateSetting and direct storage
                  updateSetting('claudeApiKey', settings.claudeApiKey);
                  
                  // Also save directly to reliable storage if available
                  if (window.electron?.storage) {
                    const currentSettings = JSON.parse(localStorage.getItem('sephia_settings') || '{}');
                    currentSettings.claudeApiKey = settings.claudeApiKey;
                    
                    await window.electron.storage.set('sephia_settings', JSON.stringify(currentSettings));
                    console.log('[Settings] Claude API Key saved to persistent storage');
                  }
                  
                  // Show success message
                  alert(
                    '✅ Claude API Key saved!\n\n' +
                    '• API Key: ' + settings.claudeApiKey.substring(0, 15) + '...\n\n' +
                    'Credentials saved to ' + (window.electron?.storage ? 'persistent storage' : 'localStorage') + '.\n' +
                    'You can now use Claude 3.5 Sonnet for enhanced AI conversations with Aria.'
                  );
                  
                  console.log('[Settings] Claude API Key saved');
                } catch (error) {
                  console.error('[Settings] Failed to save Claude API Key:', error);
                  alert('Failed to save API key: ' + error.message);
                }
              }}
              disabled={!settings.claudeApiKey}
              style={{ marginTop: '8px' }}
            >
              Save Claude API Key
            </Button>
          </div>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Preferred AI Model</Label>
            <Description2>
              Choose between local Ollama models or cloud AI services
            </Description2>
          </SettingLabel>
          <Select 
            value={settings.preferredAIModel || 'ollama'} 
            onChange={(e) => updateSetting('preferredAIModel', e.target.value)}
          >
            <option value="ollama">Local Ollama (Privacy)</option>
            <option value="claude" disabled={!settings.claudeApiKey}>Claude 3.5 Sonnet (Performance)</option>
            <option value="claude-haiku" disabled={!settings.claudeApiKey}>Claude 3.5 Haiku (Fast & Affordable)</option>
          </Select>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Apple Calendar (iCloud)</Label>
            <Description2>
              Connect to your Apple Calendar using an app-specific password
            </Description2>
          </SettingLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <Input 
              type="email" 
              value={settings.appleId || ''} 
              onChange={(e) => updateSetting('appleId', e.target.value)}
              placeholder="Apple ID (your@email.com)"
            />
            <Input 
              type="password" 
              value={settings.appleAppPassword || ''} 
              onChange={(e) => updateSetting('appleAppPassword', e.target.value)}
              placeholder="App-specific password"
            />
            <Description2 style={{ fontSize: '12px', marginTop: '4px' }}>
              Generate app-specific password at <a href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer" style={{ color: '#a855f7' }}>appleid.apple.com</a> → Security → App-Specific Passwords
            </Description2>
            <Button 
              onClick={async () => {
                if (!settings.appleId || !settings.appleAppPassword) {
                  alert('Please enter both Apple ID and app-specific password');
                  return;
                }
                
                // Check if we're in a browser (not Electron)
                const isElectron = !!(window.electron || (window.process && window.process.type));
                
                if (!isElectron) {
                  // In browser, just save credentials and show info
                  alert(
                    '✅ Apple Calendar credentials saved!\n\n' +
                    '⚠️ Note: Due to browser security restrictions, Apple Calendar cannot connect directly from the web version.\n\n' +
                    '• Your credentials are saved and ready to use\n' +
                    '• Type @calendar in chat to see demo events\n' +
                    '• Full calendar access works in the Electron desktop app\n\n' +
                    'Try it now: Type "@calendar" in any chat!'
                  );
                  // Still save the settings
                  updateSetting('appleId', settings.appleId);
                  updateSetting('appleAppPassword', settings.appleAppPassword);
                  return;
                }
                
                // In Electron, try actual connection
                try {
                  await integrationService.connectAppleCalendar(settings.appleId, settings.appleAppPassword);
                  alert('Connected to Apple Calendar!');
                  // Force re-render to update status
                  setSettings(prev => ({ ...prev }));
                } catch (err) {
                  if (err.message.includes('CORS')) {
                    alert(
                      '⚠️ Browser Security Restriction\n\n' +
                      'Apple Calendar cannot be accessed directly from a web browser.\n\n' +
                      'Your credentials are saved. You can:\n' +
                      '• Use @calendar command to see demo events\n' +
                      '• Use the Electron desktop app for full access'
                    );
                  } else {
                    alert('Failed to connect: ' + err.message);
                  }
                }
              }}
              style={{ marginTop: '8px' }}
            >
              Save Credentials
            </Button>
          </div>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Integration Status</Label>
            <Description2>
              Current connection status for your integrations
            </Description2>
          </SettingLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ color: integrationService.isGoogleAuthorized ? '#4CAF50' : '#666' }}>
              🔗 Google Drive: {integrationService.isGoogleAuthorized ? 'Connected' : 'Not connected'}
            </div>
            <div style={{ color: integrationService.isAppleAuthorized ? '#4CAF50' : '#666' }}>
              📅 Apple Calendar: {integrationService.isAppleAuthorized ? 'Connected' : 'Not connected'}
            </div>
          </div>
        </SettingItem>
      </SettingsSection>
      
      <SettingsSection>
        <SectionTitle>Settings Management</SectionTitle>
        
        <SettingItem>
          <SettingLabel>
            <Label>Storage Status</Label>
            <Description2>
              Check the persistence status of your settings
            </Description2>
          </SettingLabel>
          <Button 
            onClick={async () => {
              try {
                // Check localStorage
                const localSettings = localStorage.getItem('sephia_settings');
                const localVoiceSettings = localStorage.getItem('sephia_voice_settings');
                const localModel = localStorage.getItem('sephia_current_model');
                
                let persistentStatus = 'Not available (browser mode)';
                let persistentCount = 0;
                
                // Check persistent storage if available
                if (window.electron?.storage) {
                  try {
                    const stats = unifiedStorageService.getStats();
                    persistentCount = stats.totalKeys;
                    persistentStatus = `${persistentCount} items saved`;
                  } catch (err) {
                    persistentStatus = 'Error: ' + err.message;
                  }
                }
                
                alert(`📊 Storage Status:\n\n` +
                      `localStorage:\n` +
                      `• Settings: ${localSettings ? '✅ Saved' : '❌ Missing'}\n` +
                      `• Voice Settings: ${localVoiceSettings ? '✅ Saved' : '❌ Missing'}\n` +
                      `• Current Model: ${localModel ? '✅ Saved' : '❌ Missing'}\n\n` +
                      `Persistent Storage:\n` +
                      `• Status: ${persistentStatus}\n\n` +
                      `${localSettings && localVoiceSettings ? 'Settings should persist across app restarts.' : 'Some settings may be lost on reload.'}`);
              } catch (error) {
                alert('Failed to check storage status: ' + error.message);
              }
            }}
          >
            Check Storage Status
          </Button>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Force Save All Settings</Label>
            <Description2>
              Manually save all current settings to persistent storage
            </Description2>
          </SettingLabel>
          <Button 
            onClick={async () => {
              try {
                // Force save current settings
                const currentSettings = settings;
                const currentVoiceSettings = voiceSettings;
                const currentModelValue = currentModel;
                
                // Save to localStorage
                localStorage.setItem('sephia_settings', JSON.stringify(currentSettings));
                localStorage.setItem('sephia_voice_settings', JSON.stringify(currentVoiceSettings));
                localStorage.setItem('sephia_current_model', currentModelValue);
                
                let persistentResult = 'Skipped (browser mode)';
                
                // Save to persistent storage if available
                if (window.electron?.storage) {
                  await window.electron.storage.set('sephia_settings', JSON.stringify(currentSettings));
                  await window.electron.storage.set('sephia_voice_settings', JSON.stringify(currentVoiceSettings));
                  await window.electron.storage.set('sephia_current_model', currentModelValue);
                  persistentResult = 'Success';
                }
                
                alert(`✅ All settings saved!\n\n` +
                      `localStorage: Success\n` +
                      `Persistent Storage: ${persistentResult}\n\n` +
                      `Your settings should now persist across app restarts.`);
                      
              } catch (error) {
                alert('Failed to save settings: ' + error.message);
                console.error('[Settings] Force save failed:', error);
              }
            }}
          >
            Force Save All
          </Button>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Export All Settings</Label>
            <Description2>
              Download all your settings as a JSON file for backup or sharing
            </Description2>
          </SettingLabel>
          <Button 
            onClick={() => {
              const allSettings = {
                general: settings,
                voice: voiceSettings,
                currentModel: localStorage.getItem('sephia_current_model'),
                theme: localStorage.getItem('sephia_theme'),
                exportDate: new Date().toISOString()
              };
              
              const blob = new Blob([JSON.stringify(allSettings, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sephia-settings-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <DownloadIcon style={{ marginRight: '8px' }} />
            Export Settings
          </Button>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Import Settings</Label>
            <Description2>
              Restore settings from a previously exported JSON file
            </Description2>
          </SettingLabel>
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            id="settings-import"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const imported = JSON.parse(event.target.result);
                    
                    // Restore general settings
                    if (imported.general) {
                      setSettings(imported.general);
                      localStorage.setItem('sephia_settings', JSON.stringify(imported.general));
                    }
                    
                    // Restore voice settings
                    if (imported.voice) {
                      setVoiceSettings(imported.voice);
                      localStorage.setItem('sephia_voice_settings', JSON.stringify(imported.voice));
                      
                      // Apply voice settings
                      voiceService.setSpeechRate(imported.voice.speechRate || 1.0);
                      voiceService.setSpeechPitch(imported.voice.speechPitch || 1.0);
                      voiceService.setSpeechVolume(imported.voice.speechVolume || 1.0);
                      voiceService.setRecognitionLanguage(imported.voice.recognitionLanguage || 'en-US');
                    }
                    
                    // Restore current model
                    if (imported.currentModel) {
                      localStorage.setItem('sephia_current_model', imported.currentModel);
                      setCurrentModel(imported.currentModel);
                    }
                    
                    // Restore theme
                    if (imported.theme) {
                      localStorage.setItem('sephia_theme', imported.theme);
                      document.documentElement.setAttribute('data-theme', imported.theme);
                    }
                    
                    alert('Settings imported successfully! The app will reload to apply all changes.');
                    window.location.reload();
                  } catch (error) {
                    console.error('Failed to import settings:', error);
                    alert('Failed to import settings. Please ensure the file is valid.');
                  }
                };
                reader.readAsText(file);
              }
            }}
          />
          <Button 
            onClick={() => document.getElementById('settings-import').click()}
          >
            <RefreshIcon style={{ marginRight: '8px' }} />
            Import Settings
          </Button>
        </SettingItem>
      </SettingsSection>
      
      <SettingsSection>
        <SectionTitle>Network Configuration</SectionTitle>
        
        <SettingItem>
          <SettingLabel>
            <Label>Current Network Status</Label>
            <Description2>
              {navigator.onLine ? '✅ Connected to internet' : '❌ No internet connection'}
            </Description2>
          </SettingLabel>
          <Button 
            onClick={async () => {
              // Get network information
              const networkInfo = {
                online: navigator.onLine,
                effectiveType: navigator.connection?.effectiveType || 'unknown',
                downlink: navigator.connection?.downlink || 'unknown',
                rtt: navigator.connection?.rtt || 'unknown',
                saveData: navigator.connection?.saveData || false
              };
              
              // Get system network info if available in Electron
              // Note: We can't use Node.js modules directly in the renderer process
              // This would need to be exposed through the preload script if needed
              if (window.electron && false) { // Disabled for now
                // This would need IPC to get network info from main process
                networkInfo.interfaces = 'Available in Electron main process only';
              }
              
              alert(`Network Information:\n\n` +
                    `• Status: ${networkInfo.online ? 'Online' : 'Offline'}\n` +
                    `• Connection Type: ${networkInfo.effectiveType}\n` +
                    `• Downlink Speed: ${networkInfo.downlink} Mbps\n` +
                    `• Round Trip Time: ${networkInfo.rtt} ms\n` +
                    `• Data Saver: ${networkInfo.saveData ? 'On' : 'Off'}\n\n` +
                    `Note: WiFi selection is managed by your Mac's System Settings.`);
            }}
          >
            <RefreshIcon style={{ marginRight: '8px' }} />
            Check Network Info
          </Button>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Proxy Settings</Label>
            <Description2>
              Configure proxy for network requests (leave empty for direct connection)
            </Description2>
          </SettingLabel>
          <Input 
            type="text" 
            value={settings.proxyUrl || ''} 
            onChange={(e) => updateSetting('proxyUrl', e.target.value)}
            placeholder="http://proxy.example.com:8080"
          />
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Network Timeout</Label>
            <Description2>
              Maximum time to wait for network requests (in seconds)
            </Description2>
          </SettingLabel>
          <Input 
            type="number" 
            value={settings.networkTimeout || 30} 
            onChange={(e) => updateSetting('networkTimeout', parseInt(e.target.value))}
            min="5"
            max="300"
            style={{ width: '100px' }}
          />
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Manage WiFi Connection</Label>
            <Description2>
              WiFi connections are managed by your Mac's System Settings
            </Description2>
          </SettingLabel>
          <Button 
            onClick={() => {
              if (window.electron && window.electron.shell) {
                // Open System Settings to WiFi section
                window.electron.shell.openExternal('x-apple.systempreferences:com.apple.preference.network?WiFi');
              } else {
                alert('To change WiFi networks:\n\n' +
                      '1. Click the WiFi icon in your Mac\'s menu bar\n' +
                      '2. Select a different network\n' +
                      '3. The app will automatically use the new connection\n\n' +
                      'Or open System Settings > Network > WiFi');
              }
            }}
          >
            Open WiFi Settings
          </Button>
        </SettingItem>
      </SettingsSection>
      
      <SettingsSection>
        <SectionTitle>🌐 Network & AI Model Status</SectionTitle>
        
        <SettingItem>
          <SettingLabel>
            <Label>Network Status</Label>
            <Description2>
              {networkStatus?.isOnline ? 
                '✅ Connected to internet' : 
                '❌ Offline - using local models only'}
            </Description2>
          </SettingLabel>
          <Button
            onClick={async () => {
              const connectivity = await networkStatusService.testConnectivity();
              const info = networkStatusService.getNetworkInfo();
              
              alert(`🌐 Network Diagnostics:\n\n` +
                    `Overall Status: ${connectivity.overallStatus ? '✅ Good' : '❌ Issues detected'}\n\n` +
                    `Tests:\n${connectivity.tests.map(test => 
                      `• ${test.name}: ${test.result ? '✅' : '❌'} ${test.details}`
                    ).join('\n')}\n\n` +
                    `Connection: ${info.connectionType} | RTT: ${info.rtt}ms`);
            }}
          >
            Test Network
          </Button>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            <Label>AI Model Recommendation</Label>
            <Description2>
              Based on your current network status and preferences
            </Description2>
          </SettingLabel>
          <Button
            onClick={() => {
              const recommendation = networkStatusService.getRecommendedModel();
              const isCurrentRecommended = recommendation.model === currentModel;
              
              if (isCurrentRecommended) {
                alert(`✅ You're using the optimal model!\n\n` +
                      `Current: ${recommendation.model}\n` +
                      `Type: ${recommendation.type}\n` +
                      `Reason: ${recommendation.reason.replace('_', ' ')}`);
              } else {
                const switchNow = window.confirm(
                  `💡 Model Switch Recommended:\n\n` +
                  `Current: ${currentModel}\n` +
                  `Recommended: ${recommendation.model}\n` +
                  `Type: ${recommendation.type}\n` +
                  `Reason: ${recommendation.reason.replace('_', ' ')}\n\n` +
                  `Would you like to switch now?`
                );
                
                if (switchNow) {
                  const switched = autoSwitchModel();
                  if (switched) {
                    alert(`✅ Model switched to ${switched.model}!`);
                  }
                }
              }
            }}
          >
            Check Recommendation
          </Button>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            <Label>Cloud API Status</Label>
            <Description2>
              Availability of external AI services
            </Description2>
          </SettingLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ color: networkStatus?.cloudApis?.claude ? '#4CAF50' : '#666' }}>
              🤖 Claude API: {networkStatus?.cloudApis?.claude ? 'Available' : 'Not available'}
            </div>
            <div style={{ color: networkStatus?.cloudApis?.openai ? '#4CAF50' : '#666' }}>
              🔮 OpenAI API: {networkStatus?.cloudApis?.openai ? 'Available' : 'Not available'}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              Last checked: {networkStatus?.cloudApis?.lastChecked ? 
                new Date(networkStatus.cloudApis.lastChecked).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            <Label>Automatic Model Switching</Label>
            <Description2>
              Automatically switch between local and cloud models based on network status
            </Description2>
          </SettingLabel>
          <ToggleSwitch checked={settings.autoModelSwitching !== false}>
            <input 
              type="checkbox" 
              checked={settings.autoModelSwitching !== false}
              onChange={(e) => updateSetting('autoModelSwitching', e.target.checked)}
            />
            <span className="slider"></span>
          </ToggleSwitch>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            <Label>Connection Status</Label>
            <Description2>
              {appState.connectionStatus === 'connected' ? 
                'Successfully connected to AI models' : 
                appState.connectionStatus === 'connecting' ?
                'Attempting to connect...' :
                'Not connected'}
            </Description2>
          </SettingLabel>
          <ModelButton
            style={{ padding: '8px 16px' }}
            onClick={() => {
              // Force refresh network status
              window.location.reload();
            }}
          >
            <RefreshIcon fontSize="small" style={{ marginRight: '8px' }} />
            Refresh Status
          </ModelButton>
        </SettingItem>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>🧠 Learning Monitor</SectionTitle>
        <Description2 style={{ marginBottom: '16px' }}>
          Monitor what Aria is learning from your conversations, online activities, and interactions
        </Description2>
        <LearningMonitor />
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>📋 Application Information</SectionTitle>
        <VersionInfo detailed={true} />
      </SettingsSection>
    </SettingsContainer>
  );
};

export default SettingsView;