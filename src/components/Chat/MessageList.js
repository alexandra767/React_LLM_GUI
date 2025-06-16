import React, { useRef, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import Message from './Message';
import { useStreamingProtection } from '../../hooks/useStreamingProtection';
import { useScrollLock } from '../../hooks/useScrollLock';

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  background-color: #1E1E1E;
  min-height: 0;
  scroll-behavior: ${props => props.isStreaming ? 'auto' : 'smooth'};
`;

const MessageGroup = styled.div`
  margin-bottom: 16px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const MessageList = ({ messages = [], onDeleteMessage }) => {
  const theme = useTheme();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const prevMessagesLength = useRef(0);
  const isScrollingRef = useRef(false);
  
  // Use streaming protection
  const { renderCount } = useStreamingProtection('MessageList');
  
  // Use scroll lock to prevent scroll-triggered re-renders
  const { lockScroll, unlockScroll } = useScrollLock(containerRef);
  
  // Minimal logging for performance
  React.useEffect(() => {
    console.log('Processing messages for display');
    prevMessagesLength.current = messages.length;
    
    return () => {
      console.log('MessageList unmounting');
    };
  }, [messages]);
  
  // Scroll to bottom when messages change - but not during streaming
  useEffect(() => {
    // Skip scrolling if streaming is active to prevent interruptions
    if (window.__isStreaming) {
      console.log('Skipping auto-scroll during streaming');
      return;
    }
    
    if (messagesEndRef.current && !isScrollingRef.current) {
      try {
        isScrollingRef.current = true;
        console.log('Scrolling to bottom of messages');
        
        // Use requestAnimationFrame to defer scrolling
        requestAnimationFrame(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end',
              inline: 'nearest'
            });
          }
          
          // Reset scrolling flag after animation
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 500);
        });
      } catch (error) {
        console.error('Error scrolling to bottom:', error);
        isScrollingRef.current = false;
      }
    }
  }, [messages]);
  
  // Don't group messages - display each one separately to avoid hiding content
  const groupedMessages = useMemo(() => {
    console.log('Processing messages for display');
    
    if (!Array.isArray(messages) || messages.length === 0) {
      console.log('No messages to display');
      return [];
    }
    
    // Check streaming state for each message
    const streamingId = window.__streamingMessageId;
    const isStreamingActive = window.__isStreaming;
    
    // Display each message separately without grouping
    return messages.map((msg, index) => {
      const isThisMessageStreaming = isStreamingActive && msg.id === streamingId;
      return {
        ...msg,
        isFirstInGroup: true,
        isLastInGroup: true,
        key: msg.id || `msg-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        // Force streaming flag based on window state
        isStreaming: msg.isStreaming || isThisMessageStreaming
      };
    });
  }, [messages]);
  
  // Add debug info when no messages
  if (messages.length === 0) {
    console.log('MessageList: No messages to display');
  }
  
  return (
    <MessagesContainer ref={containerRef} theme={theme} isStreaming={window.__isStreaming}>
      {messages.length === 0 ? (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          No messages yet. Start a conversation!
        </div>
      ) : (
        groupedMessages.map((group) => (
          <MessageGroup key={group.key} theme={theme}>
            <Message
              key={group.id}
              message={group}
              isFirstInGroup={group.isFirstInGroup}
              isLastInGroup={group.isLastInGroup}
              onDelete={onDeleteMessage}
            />
          </MessageGroup>
        ))
      )}
      <div ref={messagesEndRef} />
    </MessagesContainer>
  );
};

// Don't memoize MessageList - let it re-render naturally
export default MessageList;