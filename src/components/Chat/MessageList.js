import React, { useRef, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
// Theme is now handled by ThemeContext
import Message from './Message';

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
`;

const MessageGroup = styled.div`
  margin-bottom: 24px;
`;

const MessageList = ({ messages = [], onDeleteMessage }) => {
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
  
  // Group messages by sender for better visual grouping
  const groupedMessages = useMemo(() => {
    console.log('Grouping messages');
    
    if (!Array.isArray(messages) || messages.length === 0) {
      console.log('No messages to group');
      return [];
    }
    
    try {
      const result = [];
      let currentGroup = null;
      
      messages.forEach((message, index) => {
        if (!message || typeof message !== 'object') {
          console.warn('Invalid message at index', index, ':', message);
          return;
        }
        
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const isNewGroup = !prevMessage || prevMessage.role !== message.role;
        
        if (isNewGroup) {
          // Start a new group
          currentGroup = {
            ...message,
            isFirstInGroup: true,
            isLastInGroup: true,
            key: `group-${index}-${message.id || Date.now()}`
          };
          result.push(currentGroup);
        } else if (currentGroup) {
          // Add to the current group
          currentGroup.content = (currentGroup.content || '') + '\n' + (message.content || '');
          currentGroup.isLastInGroup = true;
          
          // Update the last message's properties
          Object.assign(currentGroup, {
            id: message.id || currentGroup.id,
            timestamp: message.timestamp || currentGroup.timestamp,
            isLastInGroup: true
          });
        }
      });
      
      console.log(`Grouped ${messages.length} messages into ${result.length} groups`);
      return result;
    } catch (error) {
      console.error('Error grouping messages:', error);
      // Fallback to showing all messages ungrouped
      return messages.map(msg => ({
        ...msg,
        isFirstInGroup: true,
        isLastInGroup: true,
        key: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
    }
  }, [messages]);
  
  return (
    <MessagesContainer theme={theme}>
      {groupedMessages.map((group) => (
        <MessageGroup key={group.key} theme={theme}>
          <Message
            key={group.id}
            message={group}
            isFirstInGroup={group.isFirstInGroup}
            isLastInGroup={group.isLastInGroup}
            onDelete={onDeleteMessage}
          />
        </MessageGroup>
      ))}
      <div ref={messagesEndRef} />
    </MessagesContainer>
  );
};

export default MessageList;