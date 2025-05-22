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

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 900px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.large};
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.header.size};
  font-weight: ${props => props.theme.typography.header.weight};
  color: ${props => props.theme.colors.primaryText};
  margin-bottom: ${props => props.theme.spacing.small};
`;

const Description = styled.p`
  font-size: ${props => props.theme.typography.regularText.size};
  color: ${props => props.theme.colors.tertiaryText};
`;

const SettingsSection = styled.div`
  background-color: ${props => props.theme.colors.secondaryBg};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.large};
  margin-bottom: ${props => props.theme.spacing.large};
`;

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.sectionTitle.size};
  font-weight: ${props => props.theme.typography.sectionTitle.weight};
  color: ${props => props.theme.colors.primaryText};
  margin-bottom: ${props => props.theme.spacing.medium};
  padding-bottom: ${props => props.theme.spacing.small};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.medium} 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-of-type {
    border-bottom: none;
  }
`;

const SettingLabel = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: ${props => props.theme.typography.regularText.size};
  color: ${props => props.theme.colors.primaryText};
  margin-bottom: ${props => props.theme.spacing.small};
`;

const Description2 = styled.p`
  font-size: ${props => props.theme.typography.secondaryInfo.size};
  color: ${props => props.theme.colors.tertiaryText};
`;

const Input = styled.input`
  background-color: ${props => props.theme.colors.primaryBg};
  color: ${props => props.theme.colors.primaryText};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: ${props => props.theme.spacing.small} ${props => props.theme.spacing.medium};
  font-size: ${props => props.theme.typography.regularText.size};
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme.colors.accent};
  }
`;

const Select = styled.select`
  background-color: ${props => props.theme.colors.primaryBg};
  color: ${props => props.theme.colors.primaryText};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: ${props => props.theme.spacing.small} ${props => props.theme.spacing.medium};
  font-size: ${props => props.theme.typography.regularText.size};
  min-width: 200px;
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme.colors.accent};
  }
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: ${props => props.theme.colors.accent};
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.colors.border};
  transition: .4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;

const ModelListContainer = styled.div`
  margin-top: ${props => props.theme.spacing.medium};
`;

const ModelCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${props => props.theme.colors.primaryBg};
  border-radius: ${props => props.theme.borderRadius.medium};
  border: 1px solid ${props => props.theme.colors.border};
  padding: ${props => props.theme.spacing.medium};
  margin-bottom: ${props => props.theme.spacing.medium};
`;

const ModelInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ModelName = styled.div`
  font-size: ${props => props.theme.typography.regularText.size};
  font-weight: 500;
  color: ${props => props.theme.colors.primaryText};
`;

const ModelMeta = styled.div`
  font-size: ${props => props.theme.typography.secondaryInfo.size};
  color: ${props => props.theme.colors.tertiaryText};
`;

const ModelActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.small};
`;

const ModelButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.small};
  background-color: ${props => props.active ? props.theme.colors.accent : props.theme.colors.secondaryBg};
  color: ${props => props.active ? 'white' : props.theme.colors.tertiaryText};
  border: none;
  border-radius: ${props => props.theme.borderRadius.small};
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? props.theme.colors.accent : props.theme.colors.border};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddModelForm = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.medium};
  margin-top: ${props => props.theme.spacing.medium};
  align-items: flex-end;
`;

const LoadingIndicator = styled.div`
  margin-top: ${props => props.theme.spacing.medium};
  color: ${props => props.theme.colors.tertiaryText};
  font-size: ${props => props.theme.typography.secondaryInfo.size};
`;

const SettingsView = () => {
  const { theme } = useTheme();
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
      <Header theme={theme}>
        <Title theme={theme}>Settings</Title>
        <Description theme={theme}>
          Configure your LLM connections and application preferences.
        </Description>
      </Header>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>LLM Configuration</SectionTitle>
        
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
            <ModelCard key={model.id} theme={theme}>
              <ModelInfo>
                <ModelName theme={theme}>{model.name}</ModelName>
                <ModelMeta theme={theme}>
                  {model.size ? `${model.size}` : 'Local model'} • {model.type}
                </ModelMeta>
              </ModelInfo>
              
              <ModelActions theme={theme}>
                {currentModel === model.id ? (
                  <ModelButton theme={theme} active disabled title="Current model">
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