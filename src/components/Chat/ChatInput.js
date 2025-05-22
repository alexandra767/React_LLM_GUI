import React, { useState } from 'react';
import styled from '@emotion/styled';
// Theme is now handled by ThemeContext
import { useApp } from '../../context/AppContext';
import { Send as SendIcon } from '@mui/icons-material';

const InputContainer = styled('div')({
  padding: '16px 0',
  borderTop: '1px solid #333333',
  marginTop: '16px'
});

const Form = styled('form')({
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-end',
  flexWrap: 'wrap'
});

const ModelSelectorContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px',
  width: '100%'
});

const ModelLabel = styled('span')({
  fontSize: '13px',
  color: '#AAAAAA'
});

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

const Select = styled('select')({
  backgroundColor: '#252525',
  color: '#FFFFFF',
  border: '1px solid #333333',
  borderRadius: '4px',
  padding: '8px 16px',
  fontSize: '13px',
  cursor: 'pointer',
  '&:focus': {
    outline: 'none',
    borderColor: '#FF643D',
    boxShadow: '0 0 0 2px rgba(255, 100, 61, 0.2)'
  },
  '&:disabled': {
    opacity: 0.7,
    cursor: 'not-allowed'
  }
});

const InputRow = styled('div')({
  display: 'flex',
  gap: '8px',
  width: '100%',
  alignItems: 'center',
  position: 'relative'
});

const TextareaWrapper = styled('div')({
  flex: 1,
  position: 'relative',
  width: '100%'
});

const Textarea = styled('textarea')(({ disabled }) => ({
  flex: 1,
  minHeight: '56px',
  maxHeight: '200px',
  padding: '16px 48px 16px 16px',
  borderRadius: '8px',
  border: '1px solid #333333',
  backgroundColor: '#252525',
  color: '#FFFFFF',
  fontSize: '14px',
  lineHeight: 1.5,
  resize: 'none',
  fontFamily: 'inherit',
  '&:focus': {
    outline: 'none',
    borderColor: '#FF643D',
    boxShadow: '0 0 0 2px rgba(255, 100, 61, 0.2)'
  },
  '&:disabled': {
    backgroundColor: '#333333',
    color: '#666666',
    cursor: 'not-allowed'
  },
  '&::placeholder': {
    color: '#666666'
  }
}));

const SendButton = styled('button')(({ disabled }) => ({
  position: 'absolute',
  right: '12px',
  bottom: '12px',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#FF643D',
  color: '#FFFFFF',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,
  transition: 'opacity 0.2s',
  '&:hover:not(:disabled)': {
    opacity: 0.9
  },
  '& svg': {
    width: '16px',
    height: '16px'
  }
}));

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('llama2');
  const [isComposing, setIsComposing] = useState(false);
  const { appState, setAppState } = useApp();
  
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
    <InputContainer>
      <Form onSubmit={handleSubmit}>
        <ModelSelectorContainer>
          <ModelLabel>
            Model:
            <StatusDot status={connectionStatus} title={`Status: ${connectionStatus}`} />
          </ModelLabel>
          <Select 
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
        
        <InputRow>
          <TextareaWrapper>
            <Textarea
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