import React, { useState, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatView from '../Chat/ChatView';
import ProjectsView from '../Projects/ProjectsView';
import SettingsView from '../Settings/SettingsView';
import OllamaChatView from '../../views/OllamaChatView';
import TerminalView from '../../views/TerminalView';
import ollamaService from '../../services/OllamaService';

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
  background-color: ${props => props.theme.colors?.primaryBg || '#1E1E1E'};
  padding: 0;
`;

const MainLayout = () => {
  const theme = useTheme();
  const { appState } = useApp();
  
  // Set default section if none is selected
  useEffect(() => {
    if (!appState?.activeSection) {
      // Set default section to 'ollama' if not set
      useApp.setState({ activeSection: 'ollama' });
    }
  }, [appState?.activeSection]);
  
  // State for model selection
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available models from Ollama
  const fetchModels = useCallback(async () => {
    try {
      setIsLoadingModels(true);
      setError(null);
      
      // Get models from Ollama service
      const ollamaModels = await ollamaService.listModels();
      
      if (ollamaModels && ollamaModels.length > 0) {
        const formattedModels = ollamaModels.map(model => ({
          name: model.name || model.id,
          size: model.size ? formatFileSize(model.size) : '',
          disabled: false
        }));
        
        setModels(formattedModels);
        
        // Set the first model as selected if none is selected
        if (!selectedModel && formattedModels.length > 0) {
          setSelectedModel(formattedModels[0].name);
        }
      } else {
        // Fallback to mock data if no models found
        setModels([
          { name: 'llama2', size: '7B', disabled: false },
          { name: 'mistral', size: '4.1B', disabled: false }
        ]);
        setSelectedModel('llama2');
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to load models. Please ensure Ollama is running.');
      
      // Fallback to mock data on error
      setModels([
        { name: 'llama2', size: '7B', disabled: true },
        { name: 'mistral', size: '4.1B', disabled: true }
      ]);
      setSelectedModel('llama2');
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModel]);

  // Format file size to human readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Handle model change
  const handleModelChange = (event) => {
    const newModel = event.target.value;
    setSelectedModel(newModel);
    // Here you can add logic to update the current model in your app state
    // For example: updateAppState({ currentModel: newModel });
  };

  // Render loading state
  if (isLoadingModels) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: theme.colors?.primaryBg || '#1E1E1E',
        color: theme.colors?.primaryText || '#FFFFFF'
      }}>
        <div>Loading application...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: theme.colors?.primaryBg || '#1E1E1E',
        color: theme.colors?.primaryText || '#FFFFFF'
      }}>
        <h2>Oops! Something went wrong</h2>
        <p style={{ color: theme.colors?.error || '#ff4444' }}>{error}</p>
        <p>You can still use the application, but some features may be limited.</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: theme.colors?.accent || '#FF643D',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Application
        </button>
      </div>
    );
  }

  // Main layout
  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        <Header 
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          models={models}
        />
        <ContentArea theme={theme}>
          {(() => {
            try {
              switch(appState?.activeSection || 'ollama') {
                case 'chat':
                  return <ChatView />;
                case 'projects':
                  return <ProjectsView />;
                case 'ollama':
                  return <OllamaChatView />;
                case 'settings':
                  return <SettingsView />;
                case 'terminal':
                  return <TerminalView />;
                default:
                  return <OllamaChatView />;
              }
            } catch (error) {
              console.error('Error rendering section:', error);
              return (
                <div style={{ padding: '20px', color: theme.colors?.error || '#ff4444' }}>
                  Error loading {appState?.activeSection} view. Please try again.
                </div>
              );
            }
          })()}
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

export default MainLayout;
