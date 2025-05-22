import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { 
  Refresh as RefreshIcon, 
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { Slider } from '@mui/material';

// Helper function to safely get theme values with defaults
const getThemeValue = (theme, path, defaultValue) => {
  const keys = path.split('.');
  let value = theme;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value || defaultValue;
};

const SettingsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxWidth: '900px',
  margin: '0 auto',
  backgroundColor: getThemeValue(theme, 'colors.primaryBg', '#1E1E1E'),
  color: getThemeValue(theme, 'colors.primaryText', '#FFFFFF'),
  padding: getThemeValue(theme, 'spacing(2)', '16px')
}));

const Header = styled('div')(({ theme }) => ({
  marginBottom: getThemeValue(theme, 'spacing.large', '24px')
}));

const Title = styled('h1')(({ theme }) => ({
  fontSize: getThemeValue(theme, 'typography.header.size', '24px'),
  fontWeight: getThemeValue(theme, 'typography.header.weight', '300'),
  color: getThemeValue(theme, 'colors.primaryText', '#FFFFFF'),
  marginBottom: getThemeValue(theme, 'spacing.small', '8px')
}));

const Description = styled('p')(({ theme }) => ({
  fontSize: getThemeValue(theme, 'typography.regularText.size', '16px'),
  color: getThemeValue(theme, 'colors.tertiaryText', '#AAAAAA')
}));

const SettingsSection = styled('div')(({ theme }) => ({
  backgroundColor: getThemeValue(theme, 'colors.secondaryBg', '#252525'),
  borderRadius: getThemeValue(theme, 'borderRadius.medium', '8px'),
  padding: getThemeValue(theme, 'spacing.large', '24px'),
  marginBottom: getThemeValue(theme, 'spacing.large', '24px')
}));

const SectionTitle = styled('h2')(({ theme }) => ({
  fontSize: getThemeValue(theme, 'typography.sectionTitle.size', '18px'),
  fontWeight: getThemeValue(theme, 'typography.sectionTitle.weight', '500'),
  color: getThemeValue(theme, 'colors.primaryText', '#FFFFFF'),
  marginBottom: getThemeValue(theme, 'spacing.medium', '16px'),
  paddingBottom: getThemeValue(theme, 'spacing.small', '8px'),
  borderBottom: `1px solid ${getThemeValue(theme, 'colors.border', '#333333')}`
}));

const SettingItem = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${getThemeValue(theme, 'spacing.medium', '16px')} 0`,
  borderBottom: `1px solid ${getThemeValue(theme, 'colors.border', '#333333')}`,
  '&:last-of-type': {
    borderBottom: 'none'
  }
}));

const SettingLabel = styled('div')({
  display: 'flex',
  flexDirection: 'column'
});

const Label = styled('label')(({ theme }) => ({
  fontSize: getThemeValue(theme, 'typography.regularText.size', '16px'),
  color: getThemeValue(theme, 'colors.primaryText', '#FFFFFF'),
  marginBottom: getThemeValue(theme, 'spacing.small', '8px')
}));

const Description2 = styled('p')(({ theme }) => ({
  fontSize: getThemeValue(theme, 'typography.secondaryInfo.size', '13px'),
  color: getThemeValue(theme, 'colors.tertiaryText', '#AAAAAA')
}));

const Input = styled('input')(({ theme }) => ({
  backgroundColor: getThemeValue(theme, 'colors.primaryBg', '#1E1E1E'),
  color: getThemeValue(theme, 'colors.primaryText', '#FFFFFF'),
  border: `1px solid ${getThemeValue(theme, 'colors.border', '#333333')}`,
  borderRadius: getThemeValue(theme, 'borderRadius.small', '4px'),
  padding: `${getThemeValue(theme, 'spacing.small', '8px')} ${getThemeValue(theme, 'spacing.medium', '16px')}`,
  fontSize: getThemeValue(theme, 'typography.regularText.size', '16px'),
  outline: 'none',
  '&:focus': {
    borderColor: getThemeValue(theme, 'colors.accent', '#FF643D')
  }
}));

const Select = styled('select')(({ theme }) => ({
  backgroundColor: getThemeValue(theme, 'colors.primaryBg', '#1E1E1E'),
  color: getThemeValue(theme, 'colors.primaryText', '#FFFFFF'),
  border: `1px solid ${getThemeValue(theme, 'colors.border', '#333333')}`,
  borderRadius: getThemeValue(theme, 'borderRadius.small', '4px'),
  padding: `${getThemeValue(theme, 'spacing.small', '8px')} ${getThemeValue(theme, 'spacing.medium', '16px')}`,
  fontSize: getThemeValue(theme, 'typography.regularText.size', '16px'),
  minWidth: '200px',
  '&:focus': {
    borderColor: getThemeValue(theme, 'colors.accent', '#FF643D'),
    outline: 'none'
  },
  '& option': {
    backgroundColor: getThemeValue(theme, 'colors.primaryBg', '#1E1E1E'),
    color: getThemeValue(theme, 'colors.primaryText', '#FFFFFF')
  }
}));

const Button = styled('button')(({ theme }) => ({
  backgroundColor: getThemeValue(theme, 'colors.accent', '#FF643D'),
  color: getThemeValue(theme, 'colors.buttonText', '#FFFFFF'),
  border: 'none',
  borderRadius: getThemeValue(theme, 'borderRadius.small', '4px'),
  padding: `${getThemeValue(theme, 'spacing.small', '8px')} ${getThemeValue(theme, 'spacing.medium', '16px')}`,
  fontSize: getThemeValue(theme, 'typography.regularText.size', '16px'),
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: getThemeValue(theme, 'spacing.small', '8px'),
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: getThemeValue(theme, 'colors.accentHover', '#E55A36')
  },
  '&:disabled': {
    backgroundColor: getThemeValue(theme, 'colors.disabled', '#666666'),
    cursor: 'not-allowed'
  }
}));

const ModelListContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: getThemeValue(theme, 'spacing.small', '8px'),
  marginTop: getThemeValue(theme, 'spacing.medium', '16px')
}));

const ModelCard = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: getThemeValue(theme, 'colors.secondaryBg', '#252525'),
  borderRadius: getThemeValue(theme, 'borderRadius.medium', '8px'),
  border: `1px solid ${getThemeValue(theme, 'colors.border', '#333333')}`,
  padding: getThemeValue(theme, 'spacing.medium', '16px'),
  marginBottom: getThemeValue(theme, 'spacing.medium', '16px')
}));

const ModelInfo = styled('div')({
  display: 'flex',
  flexDirection: 'column'
});

const ModelName = styled('div')(({ theme }) => ({
  fontSize: getThemeValue(theme, 'typography.regularText.size', '16px'),
  fontWeight: 500,
  color: getThemeValue(theme, 'colors.primaryText', '#FFFFFF'),
  marginBottom: getThemeValue(theme, 'spacing.xsmall', '4px')
}));

const ModelMeta = styled('div')(({ theme }) => ({
  fontSize: getThemeValue(theme, 'typography.secondaryInfo.size', '13px'),
  color: getThemeValue(theme, 'colors.tertiaryText', '#AAAAAA')
}));

const ModelActions = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: getThemeValue(theme, 'spacing.small', '8px')
}));

const ModelButton = styled('button')(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: getThemeValue(theme, 'spacing.small', '8px'),
  background: active ? getThemeValue(theme, 'colors.accent', '#FF643D') : getThemeValue(theme, 'colors.secondaryBg', '#252525'),
  color: active ? 'white' : getThemeValue(theme, 'colors.tertiaryText', '#AAAAAA'),
  border: 'none',
  borderRadius: getThemeValue(theme, 'borderRadius.small', '4px'),
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    background: active ? getThemeValue(theme, 'colors.accent', '#FF643D') : getThemeValue(theme, 'colors.border', '#333333')
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
}));

const AddModelForm = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: getThemeValue(theme, 'spacing.medium', '16px'),
  marginTop: getThemeValue(theme, 'spacing.medium', '16px'),
  alignItems: 'flex-end'
}));

const LoadingIndicator = styled('div')(({ theme }) => ({
  marginTop: getThemeValue(theme, 'spacing.medium', '16px'),
  color: getThemeValue(theme, 'colors.tertiaryText', '#AAAAAA'),
  fontSize: getThemeValue(theme, 'typography.secondaryInfo.size', '13px')
}));

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`;

const SwitchInput = styled('input')(({ theme }) => ({
  opacity: 0,
  width: 0,
  height: 0,
  '&:checked + span': {
    backgroundColor: getThemeValue(theme, 'colors.accent', '#FF643D'),
    '&:before': {
      transform: 'translateX(24px)'
    }
  }
}));

const SettingsView = () => {
  const theme = useTheme(); // Use the theme directly
  const { 
    currentModel, 
    setCurrentModel, 
    models, 
    loading,
    loadModel,
    unloadModel,
    appState
  } = useApp();
  
  const [newModelName, setNewModelName] = useState('');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadingModelId, setLoadingModelId] = useState(null);
  
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
        
        <SettingItem theme={theme}>
          <SettingLabel>
            <Label theme={theme}>Connection Type</Label>
            <Description2 theme={theme}>
              Choose how to connect to your local language models
            </Description2>
          </SettingLabel>
          <Select theme={theme} defaultValue="ollama">
            <option value="ollama">Ollama API</option>
            <option value="terminal">Terminal Command</option>
          </Select>
        </SettingItem>
        
        <SettingItem theme={theme}>
          <SettingLabel>
            <Label theme={theme}>API Endpoint</Label>
            <Description2 theme={theme}>
              The URL for your local Ollama instance
            </Description2>
          </SettingLabel>
          <Input 
            theme={theme} 
            type="text" 
            defaultValue="http://localhost:11434/api"
          />
        </SettingItem>
        
        <SettingItem theme={theme}>
          <SettingLabel>
            <Label theme={theme}>Default Model</Label>
            <Description2 theme={theme}>
              The model to use by default for new chats
            </Description2>
          </SettingLabel>
          <Select 
            theme={theme}
            value={currentModel}
            onChange={handleModelChange}
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </Select>
        </SettingItem>
        
        <SectionTitle theme={theme}>Available Models</SectionTitle>
        <Description2 theme={theme} style={{ marginBottom: theme.spacing.medium }}>
          Manage the models installed on your system
        </Description2>
        
        <ModelListContainer theme={theme}>
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
                    theme={theme} 
                    onClick={() => handleLoadModel(model.id)}
                    disabled={isLoadingModel || loadingModelId === model.id}
                    title="Load model"
                  >
                    {loadingModelId === model.id ? '...' : <DownloadIcon fontSize="small" />}
                  </ModelButton>
                )}
                
                <ModelButton 
                  theme={theme}
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
        
        <AddModelForm theme={theme}>
          <SettingLabel style={{ flex: 1 }}>
            <Label theme={theme}>Add New Model</Label>
            <Input 
              theme={theme} 
              type="text" 
              placeholder="Model name (e.g., llama3:8b)"
              value={newModelName}
              onChange={e => setNewModelName(e.target.value)}
              disabled={isLoadingModel}
            />
          </SettingLabel>
          
          <ModelButton 
            theme={theme}
            onClick={handleAddModel}
            disabled={isLoadingModel || !newModelName}
            style={{ height: 40, padding: '0 16px' }}
          >
            {isLoadingModel ? 'Loading...' : 'Add Model'}
          </ModelButton>
        </AddModelForm>
        
        {isLoadingModel && (
          <LoadingIndicator theme={theme}>
            Loading model... This may take several minutes depending on the model size.
          </LoadingIndicator>
        )}
      </SettingsSection>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>Interface Preferences</SectionTitle>
        
        <SettingItem theme={theme}>
          <SettingLabel>
            <Label theme={theme}>Code Syntax Highlighting</Label>
            <Description2 theme={theme}>
              Enable syntax highlighting for code blocks
            </Description2>
          </SettingLabel>
          <Switch theme={theme}>
            <SwitchInput type="checkbox" defaultChecked theme={theme} />
            <Slider theme={theme} />
          </Switch>
        </SettingItem>
        
        <SettingItem theme={theme}>
          <SettingLabel>
            <Label theme={theme}>Streaming Responses</Label>
            <Description2 theme={theme}>
              Show AI responses as they're being generated
            </Description2>
          </SettingLabel>
          <Switch theme={theme}>
            <SwitchInput type="checkbox" defaultChecked theme={theme} />
            <Slider theme={theme} />
          </Switch>
        </SettingItem>
        
        <SettingItem theme={theme}>
          <SettingLabel>
            <Label theme={theme}>Automatically Collapse Sidebar</Label>
            <Description2 theme={theme}>
              Collapse sidebar when window size is reduced
            </Description2>
          </SettingLabel>
          <Switch theme={theme}>
            <SwitchInput type="checkbox" defaultChecked theme={theme} />
            <Slider theme={theme} />
          </Switch>
        </SettingItem>
        
        <SettingItem theme={theme}>
          <SettingLabel>
            <Label theme={theme}>Token Counter</Label>
            <Description2 theme={theme}>
              Show token usage statistics
            </Description2>
          </SettingLabel>
          <Switch theme={theme}>
            <SwitchInput type="checkbox" defaultChecked theme={theme} />
            <Slider theme={theme} />
          </Switch>
        </SettingItem>
      </SettingsSection>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>Connection Status</SectionTitle>
        
        <SettingItem theme={theme}>
          <SettingLabel>
            <Label theme={theme}>Current Status</Label>
            <Description2 theme={theme}>
              {appState.connectionStatus === 'connected' ? 
                'Successfully connected to Ollama' : 
                appState.connectionStatus === 'connecting' ?
                'Attempting to connect to Ollama...' :
                'Not connected to Ollama'}
            </Description2>
          </SettingLabel>
          <ModelButton
            theme={theme}
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