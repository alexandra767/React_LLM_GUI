import React, { useState, useEffect } from 'react';
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
  background-color: #1E1E1E;
  padding: 0;
`;

const MainLayout = () => {
  const theme = useTheme();
  const appContext = useApp();
  
  // Provide default values if appContext is not available
  const { 
    appState = { activeSection: 'ollama' }, 
    setAppState = () => {},
    currentModel,
    setCurrentModel,
    models: contextModels,
    setModels: setContextModels,
    loading: contextLoading,
    loadModel
  } = appContext || {};
  
  // Set default section if none is selected
  useEffect(() => {
    if (appContext && !appState?.activeSection) {
      // Set default section to 'ollama' if not set
      setAppState(prev => ({
        ...prev,
        activeSection: 'ollama'
      }));
    }
  }, [appContext, appState?.activeSection, setAppState]);
  
  // Use context models and loading state
  const models = contextModels || [];
  const selectedModel = currentModel || '';
  const isLoadingModels = contextLoading || false;
  const [error, setError] = useState(null);
  
  // Debug logging
  console.log('MainLayout - currentModel from context:', currentModel);
  console.log('MainLayout - models from context:', models);

  // Handle model change
  const handleModelChange = async (event) => {
    const newModel = event.target.value;
    console.log('MainLayout - Model changed to:', newModel);
    if (loadModel) {
      // Use loadModel which sets the current model and warms it up
      await loadModel(newModel);
    } else if (setCurrentModel) {
      // Fallback to just setting the model
      setCurrentModel(newModel);
    }
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
