import React from 'react';
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
  overflow: auto;
  background-color: ${props => props.theme.colors.primaryBg};
  padding: ${props => props.theme.spacing.large};
`;

const MainLayout = () => {
  const { theme } = useTheme();
  const { appState } = useApp();
  
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
  
  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        <Header />
        <ContentArea theme={theme}>
          {renderContent()}
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

export default MainLayout;