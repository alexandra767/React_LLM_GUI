import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
// Theme is now handled by ThemeContext
import { useApp } from '../../context/AppContext';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import TokenDisplay from './TokenDisplay';
import BrainIcon from './BrainIcon';
import llmService from '../../services/LLMService';
// DeleteIcon import removed as it's no longer needed here

const ChatContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxWidth: '1200px',
  width: '100%',
  margin: '0 auto'
});

const EmptyState = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#AAAAAA',
  textAlign: 'center'
});

const StatusBar = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  borderTop: '1px solid #333333',
  fontSize: '13px',
  color: '#AAAAAA'
});

// Removed ChatActions and ActionButton as they'll be moved to the sidebar

const TokenCounter = styled('div')({
  display: 'flex',
  gap: '8px'
});

const ModelInfo = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: 500
});

const DurationIndicator = styled('div')({
  padding: '8px 16px',
  fontSize: '13px',
  color: '#AAAAAA',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

const EmptyStateTitle = styled('h2')({
  fontSize: '24px',
  fontWeight: '500',
  marginBottom: '8px',
  color: '#F0F0F0',
  textAlign: 'center'
});

const EmptyStateText = styled('p')({
  fontSize: '16px',
  maxWidth: '500px',
  margin: '0 0 24px 0',
  lineHeight: 1.5
});

const EmptyStateDescription = styled('p')({
  fontSize: '14px',
  color: '#CCCCCC',
  marginBottom: '24px',
  maxWidth: '500px',
  lineHeight: 1.6,
  textAlign: 'center'
});

const ModelImageContainer = styled('div')({
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  backgroundColor: '#252525',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px',
  overflow: 'hidden',
  '& svg': {
    width: '60px',
    height: '60px',
    color: '#FF643D'
  }
});

const ChatView = () => {
  const { 
    currentChat, 
    chats = [], 
    updateChat, 
    setCurrentChatId,
    appState,
    setAppState
  } = useApp();
  
  // Wrapper around createNewChat to include the current theme
  const createNewChat = useCallback((title = 'New Chat') => {
    const themeName = theme?.themeName || 'dark'; // Default to 'dark' if theme is not available
    return createNewChatFromContext(title, themeName);
  }, [createNewChatFromContext, theme]);
  
  // Debug logs (commented out for production)
  // console.log('ChatView render - currentChat:', currentChat);
  // console.log('ChatView render - chats:', chats);
  // console.log('ChatView render - currentModel:', currentModel);
  // console.log('ChatView render - models:', models);
  
  // Log chat messages if they exist
  // if (currentChat?.messages) {
  //   console.log('ChatView - currentChat.messages:', currentChat.messages);
  //   console.log('ChatView - currentChat.messages count:', currentChat.messages.length);
  //   if (currentChat.messages.length > 0) {
  //     console.log('First message in currentChat:', {
  //       id: currentChat.messages[0].id,
  //       role: currentChat.messages[0].role,
  //       content: currentChat.messages[0].content ? `${currentChat.messages[0].content.substring(0, 50)}...` : 'No content',
  //       timestamp: currentChat.messages[0].timestamp
  //     });
  //   }
  // }
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStart, setStreamStart] = useState(null);
  const [tokenRate, setTokenRate] = useState(0);
  
  const handleStopGeneration = useCallback(() => {
    // Implement stopping functionality
    console.log('Stopping generation...');
    // Note: This would ideally connect to the actual LLM service to stop generation
    // For now, we'll just update the state to reflect that streaming is done
    setIsStreaming(false);
    setStreamStart(null);
  }, []);
  
  const estimateTokens = (text) => {
    // Very rough estimate: ~4 chars per token for English text
    return Math.ceil(text.length / 4);
  };
  
  const handleSendMessage = async (messageText) => {
    console.log('handleSendMessage called with text:', messageText);
    
    // Validate input
    if (!messageText || typeof messageText !== 'string' || !messageText.trim()) {
      console.warn('handleSendMessage: Empty or invalid message text');
      return;
    }
    
    if (isStreaming) {
      console.warn('handleSendMessage: Already streaming, ignoring new message');
      return;
    }
    
    console.log('handleSendMessage: Starting message processing');
    
    // Reset streaming state
    const startTime = performance.now();
    setIsStreaming(true);
    setStreamStart(startTime);
    setTokenRate(0);
    
    // Create user message object
    const userMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    };
    
    console.log('handleSendMessage: Created user message:', {
      id: userMessage.id,
      contentLength: userMessage.content.length,
      timestamp: userMessage.timestamp
    });
    
    // Create assistant message placeholder
    const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    };
    
    console.log('handleSendMessage: Created assistant message placeholder:', {
      id: assistantMessageId,
      timestamp: assistantMessage.timestamp
    });
    
    try {
      // Create a new chat if one doesn't exist
      if (!currentChat) {
        console.log('handleSendMessage: No current chat, creating new one');
        const newChat = createNewChat('New Chat');
        console.log('handleSendMessage: New chat created with ID:', newChat.id);
        setCurrentChat({
          ...newChat,
          messages: [userMessage, assistantMessage],
          updatedAt: new Date().toISOString()
        });
      } else {
        // Add both messages to existing chat
        console.log('handleSendMessage: Adding messages to existing chat');
        setCurrentChat(prev => ({
          ...prev,
          messages: [...prev.messages, userMessage, assistantMessage],
          updatedAt: new Date().toISOString()
        }));
      }
      
      // Start streaming the response
      await streamAssistantResponse(assistantMessageId, messageText, startTime);
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      handleStreamError(error, startTime);
    } finally {
      setIsStreaming(false);
    }
  };
  const streamAssistantResponse = async (assistantMessageId, userMessage, startTime) => {
    console.log('streamAssistantResponse: Starting to stream message to model');
    let fullResponse = '';
    let responseTokens = 0;
    let lastUpdateTime = startTime;
    
    try {
      await llmService.streamMessage(
        userMessage,
        { model: currentModel },
        (chunk) => {
          try {
            const now = performance.now();
            const timeSinceLastUpdate = now - lastUpdateTime;
            
            // Throttle updates to prevent excessive re-renders
            if (timeSinceLastUpdate < 100) return; // Update at most every 100ms
            
            lastUpdateTime = now;
            
            if (chunk.done) {
              console.log('streamAssistantResponse: Stream completed');
              const endTime = performance.now();
              const duration = (endTime - startTime) / 1000; // in seconds
              const tokensPerSecond = responseTokens / duration;
              
              console.log(`streamAssistantResponse: Stream stats - duration: ${duration.toFixed(2)}s, tokens: ${responseTokens}, tps: ${tokensPerSecond.toFixed(2)}`);
              
              setTokenRate(tokensPerSecond);
              setMessageTime(duration);
              
              // Update token count
              const inputTokens = Math.ceil(userMessage.split(' ').length * 1.33); // Rough estimate
              updateTokenCount({
                input: inputTokens,
                output: responseTokens
              });
              
              // Mark streaming as complete
              setCurrentChat(prev => ({
                ...prev,
                messages: prev.messages.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                ),
                updatedAt: new Date().toISOString()
              }));
              
              return;
            }
            
            if (chunk.response) {
              try {
                const parsed = JSON.parse(chunk.response);
                if (parsed.message?.content) {
                  fullResponse = parsed.message.content;
                  responseTokens = parsed.eval_count || responseTokens + 1;
                  
                  // Update the assistant's message with the latest content
                  setCurrentChat(prev => ({
                    ...prev,
                    messages: prev.messages.map(msg => 
                      msg.id === assistantMessageId
                        ? { ...msg, content: fullResponse }
                        : msg
                    ),
                    updatedAt: new Date().toISOString()
                  }));
                }
              } catch (parseError) {
                console.error('Error parsing chunk:', parseError);
              }
            }
          } catch (chunkError) {
            console.error('Error processing chunk:', chunkError);
          }
        }
      );
    } catch (error) {
      console.error('Error in streamAssistantResponse:', error);
      throw error;
    }
  };
  
  const handleStreamError = (error, startTime) => {
    console.error('Error in stream:', error);
    
    // Calculate duration
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    setMessageTime(duration);
    
    // Update the assistant's message with error state
    setCurrentChat(prev => {
      if (!prev) return null;
      
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, there was an error generating a response. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
        isStreaming: false
      };
      
      // Replace the last message (which was the streaming one) with the error
      const messages = [...prev.messages];
      const lastMessageIndex = messages.length - 1;
      
      if (lastMessageIndex >= 0 && messages[lastMessageIndex].isStreaming) {
        messages[lastMessageIndex] = errorMessage;
      } else {
        messages.push(errorMessage);
      }
      
      return {
        ...prev,
        messages,
        updatedAt: new Date().toISOString()
      };
    });
  };
  
  // Handle message deletion
  const handleDeleteMessage = (messageId) => {
    if (!currentChat) return;
    
    setCurrentChat(prev => {
      if (!prev) return null;
      
      // Filter out the deleted message
      const updatedMessages = prev.messages.filter(msg => msg.id !== messageId);
      
      return {
        ...prev,
        messages: updatedMessages,
        updatedAt: new Date().toISOString()
      };
    });
  };

  // Add a new message to the current chat
  const addMessage = (chatId, content, role, id = Date.now().toString()) => {
    const message = {
      id,
      content,
      role,
      timestamp: new Date().toISOString()
    };
    
    setCurrentChat(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        messages: [...prev.messages, message],
        updatedAt: new Date().toISOString()
      };
    });
  };

  // Update a message in the current chat
  const updateMessage = (chatId, messageId, content) => {
    setCurrentChat(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, content } : msg
        ),
        updatedAt: new Date().toISOString()
      };
    });
  };

  // Get current model name for display
  const getModelName = () => {
    const model = models.find(m => m.id === currentModel);
    return model ? model.name : currentModel;
  };

  // Render empty state when no chat is selected
  if (!currentChat) {
    return (
      <EmptyState theme={theme}>
        <ModelImageContainer theme={theme}>
          <BrainIcon size={80} color="#FF643D" />
        </ModelImageContainer>
        <EmptyStateTitle theme={theme}>Welcome to Sephia</EmptyStateTitle>
        <EmptyStateText theme={theme}>
          Start a new conversation with your local LLM. Sephia connects to your
          local models running through Ollama.
        </EmptyStateText>
        
        <TokenDisplay 
          isStreaming={isStreaming}
          tokenCount={tokenCount}
          streamDuration={messageDuration}
          onStop={handleStopGeneration}
        />
        <ChatInput onSendMessage={handleSendMessage} disabled={isStreaming} />
        
        <StatusBar theme={theme}>
          <ModelInfo theme={theme}>
            <span className="model-name">{getModelName()}</span>
            <span>{isStreaming ? 'Generating...' : 'Ready'}</span>
          </ModelInfo>
          
          <TokenCounter theme={theme}>
            <span>0 tokens</span>
          </TokenCounter>
        </StatusBar>
      </EmptyState>
    );
  }

  // Render chat interface when a chat is selected
  return (
    <ChatContainer>
      <MessageList 
        messages={currentChat.messages}
        onDeleteMessage={handleDeleteMessage}
      />
      
      <TokenDisplay 
        isStreaming={isStreaming}
        tokenCount={tokenCount}
        streamDuration={messageDuration}
        onStop={handleStopGeneration}
      />
      <ChatInput onSendMessage={handleSendMessage} disabled={isStreaming} />
      
      <StatusBar theme={theme}>
        <ModelInfo theme={theme}>
          <span className="model-name">{getModelName()}</span>
          <span>{isStreaming ? 'Generating...' : 'Ready'}</span>
          {isStreaming && messageDuration > 0 && (
            <DurationIndicator theme={theme}>
              {messageDuration.toFixed(1)}s
            </DurationIndicator>
          )}
        </ModelInfo>
        
        <TokenCounter theme={theme}>
          <span>Input: {tokenCount.input || 0}</span>
          <span>Output: {tokenCount.output || 0}</span>
          <span>Total: {(tokenCount.input || 0) + (tokenCount.output || 0)}</span>
        </TokenCounter>
      </StatusBar>
    </ChatContainer>
  );
};

export default ChatView;