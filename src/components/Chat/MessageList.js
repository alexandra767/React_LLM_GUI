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
  
  // Debug logs
  React.useEffect(() => {
    console.log('MessageList render - message count:', messages.length);
    
    // Log the last message content specifically
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      console.log('MessageList - Last message:', {
        id: lastMsg.id,
        role: lastMsg.role,
        contentLength: lastMsg.content?.length || 0,
        contentPreview: lastMsg.content?.substring(0, 50) || 'empty',
        isStreaming: lastMsg.isStreaming
      });
      
      // Log all assistant messages
      const assistantMessages = messages.filter(m => m.role === 'assistant');
      console.log('MessageList - Assistant messages:', assistantMessages.map(m => ({
        id: m.id,
        contentLength: m.content?.length || 0,
        isStreaming: m.isStreaming
      })));
    }
    
    if (messages.length > 0) {
      console.log('First message:', {
        id: messages[0].id,
        role: messages[0].role,
        content: messages[0].content ? `${String(messages[0].content).substring(0, 50)}...` : 'No content',
        timestamp: messages[0].timestamp
      });
      
      // Log when new messages are added
      if (messages.length > prevMessagesLength.current) {
        const newMessages = messages.slice(prevMessagesLength.current);
        console.log(`Added ${newMessages.length} new messages:`, newMessages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content ? `${String(m.content).substring(0, 30)}...` : 'No content'
        })));
      }
    } else {
      console.log('No messages to display');
    }
    
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
    
    // Display each message separately without grouping
    return messages.map((msg, index) => ({
      ...msg,
      isFirstInGroup: true,
      isLastInGroup: true,
      key: msg.id || `msg-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
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

// Memoize MessageList to prevent re-renders during streaming
export default React.memo(MessageList, (prevProps, nextProps) => {
  // If streaming is active, prevent re-renders unless messages actually changed
  if (window.__isStreaming) {
    console.log('[MessageList] Checking if should re-render during streaming');
    
    // Only re-render if message count changed or content of non-streaming messages changed
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false; // Allow re-render
    }
    
    // Check if any non-streaming messages changed
    for (let i = 0; i < prevProps.messages.length; i++) {
      const prevMsg = prevProps.messages[i];
      const nextMsg = nextProps.messages[i];
      
      // Skip streaming messages in comparison
      if (prevMsg.isStreaming || nextMsg.isStreaming) {
        continue;
      }
      
      if (prevMsg.id !== nextMsg.id || prevMsg.content !== nextMsg.content) {
        return false; // Allow re-render
      }
    }
    
    return true; // Prevent re-render
  }
  
  // Normal comparison when not streaming
  return false; // Allow re-render
});