import React, { useRef, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import Message from './Message';

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  background-color: #1E1E1E;
  min-height: 0;
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
  const prevMessagesLength = useRef(0);
  
  // Debug logs
  React.useEffect(() => {
    console.log('MessageList render - message count:', messages.length);
    
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
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      try {
        console.log('Scrolling to bottom of messages');
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      } catch (error) {
        console.error('Error scrolling to bottom:', error);
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
    <MessagesContainer theme={theme}>
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

export default MessageList;