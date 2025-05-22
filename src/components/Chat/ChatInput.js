import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { Send as SendIcon } from '@mui/icons-material';

const InputContainer = styled.div`
  padding: ${props => props.theme.spacing.medium} 0;
  border-top: 1px solid ${props => props.theme.colors.border};
  margin-top: ${props => props.theme.spacing.medium};
`;

const Form = styled.form`
  display: flex;
  gap: ${props => props.theme.spacing.medium};
  align-items: flex-end;
  flex-wrap: wrap;
`;

const ModelSelectorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.small};
  margin-bottom: ${props => props.theme.spacing.small};
  width: 100%;
`;

const ModelLabel = styled.span`
  font-size: ${props => props.theme.typography.secondaryInfo.size};
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
  font-size: ${props => props.theme.typography.secondaryInfo.size};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.medium};
  align-items: flex-end;
  width: 100%;
`;

const TextareaWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 48px;
  max-height: 200px;
  padding: ${props => props.theme.spacing.medium};
  background-color: ${props => props.theme.colors.secondaryBg};
  color: ${props => props.theme.colors.primaryText};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  font-family: inherit;
  font-size: ${props => props.theme.typography.regularText.size};
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
  
  &:focus {
    border-color: ${props => props.theme.colors.accent};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.tertiaryText};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.disabled ? props.theme.colors.secondaryBg : props.theme.colors.accent};
  color: ${props => props.disabled ? props.theme.colors.tertiaryText : props.theme.colors.primaryText};
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.accent}dd;
  }
`;

const ChatInput = ({ onSendMessage, disabled }) => {
  const { theme } = useTheme();
  const { 
    currentModel, 
    models, 
    appState,
    loadModel
  } = useApp();
  const [message, setMessage] = useState('');
  
  // Get connection status
  const connectionStatus = appState?.connectionStatus || 'disconnected';
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-adjust height
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };
  
  const handleModelChange = (e) => {
    const modelId = e.target.value;
    loadModel(modelId);
  };
  
  return (
    <InputContainer theme={theme}>
      <Form onSubmit={handleSubmit} theme={theme}>
        <ModelSelectorContainer theme={theme}>
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
        </ModelSelectorContainer>
        
        <InputRow theme={theme}>
          <TextareaWrapper>
            <Textarea
              theme={theme}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={disabled}
              rows={1}
            />
          </TextareaWrapper>
          
          <SendButton 
            type="submit" 
            theme={theme}
            disabled={!message.trim() || disabled}
          >
            <SendIcon />
          </SendButton>
        </InputRow>
      </Form>
    </InputContainer>
  );
};

export default ChatInput;