import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import ChatView from '../Chat/ChatView';
import ProjectsView from '../Projects/ProjectsView';
import SettingsView from '../Settings/SettingsView';
import OllamaChatView from '../../views/OllamaChatView';
import TerminalView from '../../views/TerminalView';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: ${props => props.theme.colors.primaryBg};
  padding: 0;
`;

const MainLayout = () => {
  const { theme } = useTheme();
  const { appState } = useApp();
  
  // State for model selection
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Fetch available models from Ollama
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        
        const availableModels = data.models.map(model => ({
          name: model.name,
          size: (model.size / 1024 / 1024 / 1024).toFixed(1) + 'GB',
          modified: new Date(model.modified_at).toLocaleDateString()
        }));
        
        setModels(availableModels);
        if (availableModels.length > 0) {
          setSelectedModel(availableModels[0].name);
        }
      } catch (err) {
        console.error('Error fetching models:', err);
        // Fallback to default models if API call fails
        const defaultModels = [
          { name: 'llama3:8b', size: '4.7GB' },
          { name: 'mistral:7b', size: '4.1GB' }
        ];
        setModels(defaultModels);
        setSelectedModel(defaultModels[0].name);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, []);
  
  const renderContent = () => {
    switch (appState.activeSection) {
      case 'chat':
        return <ChatView />;
      case 'ollama':
        return <OllamaChatView />;
      case 'terminal':
        return <TerminalView />;
      case 'projects':
        return <ProjectsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <TerminalView />;
    }
  };
  
  // Simple header component
  const AppHeader = styled('header')(({ theme }) => ({
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    position: 'sticky',
    top: 0,
    zIndex: 1100
  }));

  const HeaderLeft = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  });

  const Logo = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  });

  const LogoImage = styled('img')({
    height: '32px',
    width: 'auto'
  });

  const HeaderRight = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  });

  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        <AppHeader>
          <HeaderLeft>
            <Logo>
              <LogoImage src="/images/brain-computer.svg" alt="Sephia Logo" />
              <Typography variant="h6" component="h1" sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textFillColor: 'transparent'
              }}>
                Sephia
              </Typography>
            </Logo>
          </HeaderLeft>
          <HeaderRight>
            <FormControl size="small" sx={{ width: 250 }}>
              <InputLabel id="model-select-label">
                {isLoadingModels ? 'Loading models...' : 'Select Model'}
              </InputLabel>
              <Select
                labelId="model-select-label"
                value={selectedModel}
                label={isLoadingModels ? 'Loading models...' : 'Select Model'}
                onChange={(e) => setSelectedModel(e.target.value)}
                size="small"
                disabled={isLoadingModels || models.length === 0}
              >
                {isLoadingModels ? (
                  <MenuItem disabled>Loading models...</MenuItem>
                ) : models.length === 0 ? (
                  <MenuItem disabled>No models available</MenuItem>
                ) : (
                  models.map((model) => (
                    <MenuItem key={model.name} value={model.name}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Box component="span" sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '70%'
                        }}>
                          {model.name}
                        </Box>
                        <Box component="span" sx={{ 
                          opacity: 0.7, 
                          fontSize: '0.8em',
                          flexShrink: 0,
                          ml: 1
                        }}>
                          {model.size}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </HeaderRight>
        </AppHeader>
        <ContentArea theme={theme}>
          {renderContent()}
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

export default MainLayout;