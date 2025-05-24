import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

const InputContainer = styled('div')({
  position: 'relative',
  padding: '0 24px 24px',
  backgroundColor: '#1E1E1E'
});

const InputWrapper = styled('div')({
  position: 'relative',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.2s ease',
  overflow: 'hidden',
  '&:focus-within': {
    borderColor: 'rgba(168, 85, 247, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  }
});

const Textarea = styled('textarea')({
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#F0F0F0',
  fontSize: '15px',
  fontFamily: 'inherit',
  padding: '14px 60px 14px 20px',
  resize: 'none',
  lineHeight: 1.5,
  minHeight: '52px',
  maxHeight: '200px',
  '&::placeholder': {
    color: '#888888'
  },
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5
  }
});

const SendButton = styled('button')(({ disabled }) => ({
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: disabled ? '#666666' : '#a855f7',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: '#9333ea',
    transform: 'translateY(-50%) scale(1.05)'
  },
  '&:active:not(:disabled)': {
    transform: 'translateY(-50%) scale(0.95)'
  },
  '& svg': {
    width: '20px',
    height: '20px'
  }
}));

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const theme = useTheme();
  const { appState } = useApp();
  const inputRef = React.useRef(null);
  
  // Auto-focus on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // Keep focus on input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
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
    <InputContainer>
      <form onSubmit={handleSubmit}>
        <InputWrapper>
          <Textarea
            ref={inputRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
          />
          
          <SendButton 
            type="submit" 
            disabled={!message.trim() || disabled}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </SendButton>
        </InputWrapper>
      </form>
    </InputContainer>
  );
};

export default ChatInput;