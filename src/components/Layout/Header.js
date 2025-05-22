import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

const HeaderContainer = styled.header`
  height: 60px;
  background-color: ${props => props.theme.colors.primaryBg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${props => props.theme.spacing.large};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.small};
`;

const LogoImage = styled.img`
  height: 32px;
  width: auto;
`;

const LogoText = styled.h1`
  font-size: ${props => props.theme.typography.header.size};
  font-weight: ${props => props.theme.typography.header.weight};
  color: ${props => props.theme.colors.primaryText};
`;

const ModelSelector = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.small};
`;

const ModelLabel = styled.span`
  font-size: ${props => props.theme.typography.regularText.size};
  color: ${props => props.theme.colors.tertiaryText};
`;

const StatusDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 8px;
  background-color: ${props => 
    props.status === 'connected' ? '#4CAF50' :
    props.status === 'connecting' ? '#FFC107' : 
    '#F44336'};
`;

const Select = styled.select`
  background-color: ${props => props.theme.colors.secondaryBg};
  color: ${props => props.theme.colors.primaryText};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: ${props => props.theme.spacing.small} ${props => props.theme.spacing.medium};
  font-size: ${props => props.theme.typography.regularText.size};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
  }
`;

const Header = () => {
  const { theme } = useTheme();
  const { 
    currentModel, 
    setCurrentModel, 
    models, 
    loading,
    appState,
    loadModel
  } = useApp();
  
  // Get connection status
  const connectionStatus = appState?.connectionStatus || 'disconnected';
  
  // Skip logging to improve performance
  
  const handleModelChange = (e) => {
    const modelId = e.target.value;
    // Call loadModel directly to reduce lag
    loadModel(modelId);
  };
  
  return (
    <HeaderContainer theme={theme}>
      <Logo theme={theme}>
        <LogoImage src="/images/brain-computer.svg" alt="Sephia Logo" />
        <LogoText theme={theme}>Sephia</LogoText>
      </Logo>
      
      <ModelSelector theme={theme}>
        <ModelLabel theme={theme}>
          Model:
          <StatusDot status={connectionStatus} title={`Status: ${connectionStatus}`} />
        </ModelLabel>
        <Select 
          theme={theme}
          value={currentModel || ''}
          onChange={handleModelChange}
          disabled={connectionStatus === 'connecting'}
        >
          {/* If models array is empty, show hardcoded options */}
          {models && models.length > 0 ? (
            models.map(model => (
              <option key={model.id || model.name} value={model.id || model.name}>
                {model.name}
              </option>
            ))
          ) : (
            // Fallback hardcoded models
            <>
              <option value="deepseek-r1:32b">DeepSeek R1 (32B)</option>
              <option value="deepseek-r1:14b-m4">DeepSeek 14B-M4</option>
              <option value="deepseek-r1:8b-m4">DeepSeek 8B-M4</option>
              <option value="deepseek-r1:14b">DeepSeek 14B</option>
              <option value="deepseek-r1:8b">DeepSeek 8B</option>
            </>
          )}
        </Select>
      </ModelSelector>
    </HeaderContainer>
  );
};

export default Header;