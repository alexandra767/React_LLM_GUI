import React, { useState } from 'react';
import styled from '@emotion/styled';
import { ThemeContext } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { Send as SendIcon } from '@mui/icons-material';

const InputContainer = styled('div')(({ theme }) => ({
  padding: `${theme?.spacing?.medium || '16px'} 0`,
  borderTop: `1px solid ${theme?.colors?.border || '#333333'}`,
  marginTop: theme?.spacing?.medium || '16px'
}));

const Form = styled('form')(({ theme }) => ({
  display: 'flex',
  gap: theme?.spacing?.medium || '16px',
  alignItems: 'flex-end',
  flexWrap: 'wrap'
}));

const ModelSelectorContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme?.spacing?.small || '8px',
  marginBottom: theme?.spacing?.small || '8px',
  width: '100%'
}));

const ModelLabel = styled('span')(({ theme }) => ({
  fontSize: theme?.typography?.secondaryInfo?.size || '13px',
  color: theme?.colors?.tertiaryText || '#AAAAAA'
}));

const StatusDot = styled('span')(({ status }) => ({
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  marginLeft: '8px',
  backgroundColor: 
    status === 'connected' ? '#4CAF50' :
    status === 'connecting' ? '#FFC107' : 
    '#F44336'
}));

const Select = styled('select')(({ theme }) => ({
  backgroundColor: theme?.colors?.secondaryBg || '#252525',
  color: theme?.colors?.primaryText || '#FFFFFF',
  border: `1px solid ${theme?.colors?.border || '#333333'}`,
  borderRadius: theme?.borderRadius?.small || '4px',
  padding: `${theme?.spacing?.small || '8px'} ${theme?.spacing?.medium || '16px'}`,
  fontSize: theme?.typography?.secondaryInfo?.size || '13px',
  cursor: 'pointer',
  '&:focus': {
    outline: 'none',
    borderColor: theme?.colors?.accent || '#FF643D'
  }
}));

const InputRow = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme?.spacing?.medium || '16px',
  alignItems: 'flex-end',
  width: '100%'
}));

const TextareaWrapper = styled('div')({
  flex: 1,
  position: 'relative'
});

const Textarea = styled('textarea')(({ theme }) => ({
  flex: 1,
  minHeight: '24px',
  maxHeight: '200px',
  padding: `${theme?.spacing?.small || '8px'} ${theme?.spacing?.medium || '16px'}`,
  border: `1px solid ${theme?.colors?.border || '#333333'}`,
  borderRadius: theme?.borderRadius?.medium || '8px',
  backgroundColor: theme?.colors?.secondaryBg || '#252525',
  color: theme?.colors?.primaryText || '#FFFFFF',
  fontFamily: 'inherit',
  fontSize: theme?.typography?.regularText?.size || '16px',
  resize: 'none',
  overflowY: 'auto',
  lineHeight: 1.5,
  '&:focus': {
    outline: 'none',
    borderColor: theme?.colors?.accent || '#FF643D',
    boxShadow: `0 0 0 1px ${theme?.colors?.accent || '#FF643D'}`
  },
  '&::placeholder': {
    color: theme?.colors?.tertiaryText || '#AAAAAA',
    opacity: 0.7
  }
}));

const SendButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  border: 'none',
  borderRadius: '50%',
  backgroundColor: theme?.colors?.accent || '#FF643D',
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.2s',
  flexShrink: 0,
  '&:hover': {
    backgroundColor: theme?.colors?.accentHover || '#e64a19',
    transform: 'translateY(-1px)'
  },
  '&:active': {
    transform: 'translateY(0)'
  },
  '&:disabled': {
    backgroundColor: theme?.colors?.disabled || '#bdbdbd',
    cursor: 'not-allowed',
    transform: 'none'
  }
}));

const ChatInput = ({ onSendMessage, disabled }) => {
  const theme = React.useContext(ThemeContext);
  const { currentModel, models, appState, loadModel } = useApp();
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