import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
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
  const [message, setMessage] = useState('');
  
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
  
  return (
    <InputContainer theme={theme}>
      <Form onSubmit={handleSubmit} theme={theme}>
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
      </Form>
    </InputContainer>
  );
};

export default ChatInput;