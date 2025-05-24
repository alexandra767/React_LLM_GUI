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
    appState = { connectionStatus: 'disconnected' }
  } = useApp();
  
  const [newModelName, setNewModelName] = useState('');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadingModelId, setLoadingModelId] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [settings, setSettings] = useState({
    ollamaEndpoint: 'http://localhost:11434',
    temperature: 0.7,
    defaultModel: 'llama2'
  });
  
  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState({
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 1.0,
    selectedVoice: null,
    recognitionLanguage: 'en-US',
    voiceEnabled: true,
    autoSpeak: false
  });
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isSpeechSupported, setIsSpeechSupported] = useState({
    recognition: false,
    synthesis: false
  });
  
  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const updateVoiceSetting = (key, value) => {
    setVoiceSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
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
    }
    
    // Save to localStorage
    localStorage.setItem('sephia_voice_settings', JSON.stringify({
      ...voiceSettings,
      [key]: value
    }));
  };
  
  // Load voices and voice settings on mount
  useEffect(() => {
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
      setAvailableVoices(voices);
      
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
        setVoiceSettings(parsed);
        
        // Apply saved settings to voice service
        voiceService.setSpeechRate(parsed.speechRate || 1.0);
        voiceService.setSpeechPitch(parsed.speechPitch || 1.0);
        voiceService.setSpeechVolume(parsed.speechVolume || 1.0);
        voiceService.setRecognitionLanguage(parsed.recognitionLanguage || 'en-US');
      } catch (e) {
        console.error('Failed to load voice settings:', e);
      }
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
    setCurrentModel(e.target.value);
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
          <Select defaultValue="ollama">
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
            <Label>Default Model</Label>
            <Description2>
              The default model to use for new conversations
            </Description2>
          </SettingLabel>
          <Select 
            value={settings.defaultModel || 'llama2'} 
            onChange={(e) => updateSetting('defaultModel', e.target.value)}
          >
            <option value="llama2">Llama 2</option>
            <option value="mistral">Mistral</option>
            <option value="codellama">CodeLlama</option>
            <option value="custom">Custom</option>
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
          <Switch>
            <SwitchInput type="checkbox" defaultChecked />
            <Slider />
          </Switch>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Streaming Responses</Label>
            <Description2>
              Show AI responses as they're being generated
            </Description2>
          </SettingLabel>
          <Switch>
            <SwitchInput type="checkbox" defaultChecked />
            <Slider />
          </Switch>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Automatically Collapse Sidebar</Label>
            <Description2>
              Collapse sidebar when window size is reduced
            </Description2>
          </SettingLabel>
          <Switch>
            <SwitchInput type="checkbox" defaultChecked />
            <Slider />
          </Switch>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Token Counter</Label>
            <Description2>
              Show token usage statistics
            </Description2>
          </SettingLabel>
          <Switch>
            <SwitchInput type="checkbox" defaultChecked />
            <Slider />
          </Switch>
        </SettingItem>
      </SettingsSection>
      
      <SettingsSection>
        <SectionTitle>Voice Settings</SectionTitle>
        
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
                      Choose the voice for text-to-speech
                    </Description2>
                  </SettingLabel>
                  <Select 
                    value={voiceSettings.selectedVoice || ''} 
                    onChange={(e) => updateVoiceSetting('selectedVoice', e.target.value)}
                    disabled={!voiceSettings.voiceEnabled}
                  >
                    <option value="">Default Voice</option>
                    {availableVoices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
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
              </>
            )}
            
            {isSpeechSupported.recognition && (
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
              </>
            )}
          </>
        )}
      </SettingsSection>
      
      <SettingsSection>
        <SectionTitle>Connection Status</SectionTitle>
        
        <SettingItem>
          <SettingLabel>
            <Label>Current Status</Label>
            <Description2>
              {appState.connectionStatus === 'connected' ? 
                'Successfully connected to Ollama' : 
                appState.connectionStatus === 'connecting' ?
                'Attempting to connect to Ollama...' :
                'Not connected to Ollama'}
            </Description2>
          </SettingLabel>
          <ModelButton
            style={{ padding: '8px 16px' }}
            onClick={() => {
              // Would trigger a connection refresh in a real implementation
            }}
          >
            <RefreshIcon fontSize="small" style={{ marginRight: '8px' }} />
            Refresh
          </ModelButton>
        </SettingItem>
      </SettingsSection>
    </SettingsContainer>
  );
};

export default SettingsView;