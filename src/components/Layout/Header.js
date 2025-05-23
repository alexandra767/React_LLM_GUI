import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';

const HeaderContainer = styled('header')({
  height: '50px',
  backgroundColor: '#1E1E1E',
  borderBottom: '1px solid #333333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 24px',
  position: 'relative'
});

const HeaderTitle = styled('h1')({
  fontSize: '16px',
  fontWeight: 400,
  color: '#FFFFFF',
  margin: 0,
  opacity: 0.9
});

const ModelSelector = styled('div')({
  position: 'absolute',
  right: '24px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '13px',
  color: '#AAAAAA'
});

const ModelDropdown = styled('select')({
  backgroundColor: '#252525',
  color: '#FFFFFF',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '4px',
  padding: '6px 12px',
  fontSize: '13px',
  outline: 'none',
  cursor: 'pointer',
  minWidth: '180px',
  transition: 'all 0.2s ease',
  appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  backgroundSize: '16px',
  paddingRight: '32px',
  '&:hover': {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: '#2A2A2A'
  },
  '&:focus': {
    borderColor: '#FF643D',
    backgroundColor: '#2A2A2A'
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  '& option': {
    backgroundColor: '#252525',
    color: '#FFFFFF',
    padding: '8px'
  }
});

const Header = ({ selectedModel, onModelChange, models = [] }) => {
  const theme = useTheme();
  
  // Debug logging
  console.log('Header - models:', models);
  console.log('Header - selectedModel:', selectedModel);
  console.log('Header - models length:', models.length);
  
  // Check if models have the expected structure
  if (models.length > 0) {
    console.log('Header - first model:', models[0]);
  }
  
  return (
    <HeaderContainer>
      <HeaderTitle>Sephia</HeaderTitle>
      
      <ModelSelector>
        <span>Model</span>
        <ModelDropdown
          value={selectedModel || ''}
          onChange={(e) => {
            console.log('Header - Model selected:', e.target.value);
            onModelChange(e);
          }}
        >
          {/* Add a default option if no model is selected */}
          {!selectedModel && <option value="">Select a model</option>}
          {models.map((model) => (
            <option key={model.id || model.name} value={model.id || model.name} disabled={model.disabled}>
              {model.name} {model.size ? ` (${model.size})` : ''}
            </option>
          ))}
        </ModelDropdown>
      </ModelSelector>
    </HeaderContainer>
  );
};

export default Header;