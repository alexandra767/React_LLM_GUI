import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
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
  width: '100%',
  backgroundColor: '#1E1E1E'
});

const EmptyState = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '32px',
  color: '#AAAAAA',
  textAlign: 'center',
  gap: '24px'
});

const StatusBar = styled('div')({
  background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)',
  padding: '8px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.9)'
});

// Removed ChatActions and ActionButton as they'll be moved to the sidebar

const TokenCounter = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
});

const ModelInfo = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
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
  fontSize: '28px',
  fontWeight: '300',
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
  fontSize: '16px',
  color: '#888888',
  maxWidth: '500px',
  lineHeight: 1.5,
  textAlign: 'center'
});

const IconWrapper = styled('div')({
  width: '80px',
  height: '80px',
  backgroundColor: '#252525',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '3px solid #FF643D',
  marginBottom: '16px',
  overflow: 'hidden',
  '& svg': {
    width: '60px',
    height: '60px',
    color: '#FF643D'
  }
});

const ChatView = ({ projectId }) => {
  const theme = useTheme();
  const { 
    currentChat, 
    chats = [], 
    updateChat, 
    setCurrentChatId,
    appState,
    setAppState,
    currentModel,
    models = [],
    createNewChat: createNewChatFromContext,
    setCurrentChat,
    tokenCount = { input: 0, output: 0, total: 0 },
    setTokenCount: updateTokenCount,
    messageDuration = 0,
    setMessageTime,
    projects = [],
    updateProject,
    resetTokenCount
  } = useApp();
  
  // Force component refresh with version stamp
  const componentVersion = 'v2.0';
  
  // Wrapper around createNewChat to include the current theme
  const createNewChat = useCallback((title = 'New Chat', themeName = null, firstMessage = '') => {
    const finalTheme = themeName || theme?.name || 'dark'; // Use provided theme or current theme or default to 'dark'
    return createNewChatFromContext(title, finalTheme, firstMessage);
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
  const abortControllerRef = React.useRef(null);
  
  // Get project-specific messages if projectId is provided
  const project = projectId ? projects.find(p => p.id === projectId) : null;
  const projectMessages = project?.messages || [];
  
  // Use project messages if in project context, otherwise use currentChat messages
  const messages = projectId ? projectMessages : (currentChat?.messages || []);
  
  // Debug log messages
  console.log('ChatView - messages:', messages);
  console.log('ChatView - messages count:', messages.length);
  
  // Debug: Log current state
  if (projectId) {
    console.log(`[ChatView ${componentVersion}] Project context:`, {
      projectId,
      project,
      messageCount: messages.length
    });
  }
  
  const handleStopGeneration = useCallback(() => {
    console.log('Stopping generation...');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamStart(null);
  }, []);

  // Add keyboard listener for ESC key
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isStreaming) {
        handleStopGeneration();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStreaming, handleStopGeneration]);
  
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
    setMessageTime(0); // Reset duration
    resetTokenCount(); // Reset token count
    
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
      // Handle project context
      if (projectId && updateProject) {
        console.log('handleSendMessage: In project context, updating project messages');
        // Update project with new messages
        const updatedMessages = [...messages, userMessage, assistantMessage];
        updateProject(projectId, { 
          messages: updatedMessages,
          lastUpdated: new Date().toISOString()
        });
        
        // Start streaming the response
        await streamAssistantResponse(assistantMessageId, messageText, startTime);
      } else {
        // Handle regular chat context
        if (!currentChat) {
          console.log('handleSendMessage: No current chat, creating new one');
          const newChat = createNewChat('New Chat', theme?.name || 'dark', messageText.trim());
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
      }
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      handleStreamError(error, startTime);
    } finally {
      setIsStreaming(false);
    }
  };
  const streamAssistantResponse = async (assistantMessageId, userMessage, startTime) => {
    // For project context, ensure we use the project's model or fallback to current
    const modelToUse = projectId && project?.model ? project.model : (currentModel || 'deepseek-r1:8b-m4');
    console.log('streamAssistantResponse: Starting to stream message');
    console.log('streamAssistantResponse: Project context:', projectId ? { projectId, projectModel: project?.model } : 'none');
    console.log('streamAssistantResponse: Current model from context:', currentModel);
    console.log('streamAssistantResponse: Using model:', modelToUse);
    let fullResponse = '';
    let responseTokens = 0;
    let lastUpdateTime = startTime;
    
    try {
      // Create abort controller for this stream
      abortControllerRef.current = new AbortController();
      
      await llmService.streamMessage(
        userMessage,
        { 
          model: modelToUse,
          signal: abortControllerRef.current.signal
        },
        (chunkString) => {
          try {
            // Parse the JSON string from LLMService
            let chunk;
            try {
              chunk = JSON.parse(chunkString);
            } catch (parseError) {
              console.error('Error parsing chunk JSON:', parseError, 'Raw chunk:', chunkString);
              return;
            }
            
            // Remove throttling to ensure all chunks are processed
            // This was causing missing words and content
            
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
              if (projectId && updateProject) {
                // Update project messages
                const updatedMessages = messages.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                );
                updateProject(projectId, { 
                  messages: updatedMessages,
                  lastUpdated: new Date().toISOString()
                });
              } else {
                // Update regular chat
                setCurrentChat(prev => ({
                  ...prev,
                  messages: prev.messages.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, isStreaming: false }
                      : msg
                  ),
                  updatedAt: new Date().toISOString()
                }));
              }
              
              return;
            }
            
            // Handle error responses
            if (chunk.error) {
              console.error('Received error chunk:', chunk);
              const errorMessage = chunk.response || 'An error occurred while generating the response.';
              
              // Update message with error
              if (projectId && updateProject) {
                const updatedMessages = messages.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: errorMessage, isError: true, isStreaming: false }
                    : msg
                );
                updateProject(projectId, { 
                  messages: updatedMessages,
                  lastUpdated: new Date().toISOString()
                });
              } else {
                setCurrentChat(prev => ({
                  ...prev,
                  messages: prev.messages.map(msg => 
                    msg.id === assistantMessageId
                      ? { ...msg, content: errorMessage, isError: true, isStreaming: false }
                      : msg
                  ),
                  updatedAt: new Date().toISOString()
                }));
              }
              return;
            }
            
            if (chunk.response !== undefined) {
              // chunk.response is already a string from LLMService, not JSON
              const newContent = chunk.response;
              
              // Accumulate the response
              fullResponse += newContent;
              responseTokens += 1; // Simple token estimation
              
              // Update duration and token count in real-time during streaming
              const currentTime = performance.now();
              const currentDuration = (currentTime - startTime) / 1000; // in seconds
              setMessageTime(currentDuration);
              updateTokenCount({
                input: 0,
                output: responseTokens
              });
              
              // Debug logging
              if (newContent) {
                console.log('Received chunk:', { 
                  content: newContent.substring(0, Math.min(newContent.length, 50)) + (newContent.length > 50 ? '...' : ''),
                  totalLength: fullResponse.length,
                  duration: currentDuration.toFixed(1),
                  tokens: responseTokens
                });
              }
              
              // Update the assistant's message with the accumulated content
              if (projectId && updateProject) {
                // Update project messages
                const updatedMessages = messages.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullResponse }
                    : msg
                );
                updateProject(projectId, { 
                  messages: updatedMessages,
                  lastUpdated: new Date().toISOString()
                });
              } else {
                // Update regular chat
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

  // Format token count to show k for thousands
  const formatTokenCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Render empty state when no chat is selected or when in project with no messages
  if ((!currentChat && !projectId) || (projectId && messages.length === 0)) {
    const emptyTitle = projectId ? `Welcome to ${project?.title || 'Project'}` : 'Welcome to Sephia';
    const emptyText = projectId 
      ? 'Start a conversation in this project. All messages will be saved within this project context.'
      : 'Start a new conversation with your local LLM. Sephia connects to your local models running through Ollama.';
    
    return (
      <ChatContainer>
        <EmptyState theme={theme}>
          <IconWrapper theme={theme}>
            <BrainIcon size={40} color="#FF643D" />
          </IconWrapper>
          <div>
            <EmptyStateTitle theme={theme}>{emptyTitle}</EmptyStateTitle>
            <EmptyStateDescription theme={theme}>{emptyText}</EmptyStateDescription>
          </div>
        </EmptyState>
        
        <div style={{ marginTop: 'auto' }}>
          <StatusBar theme={theme}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>0s · 0 tokens</span>
            </div>
            <ModelInfo theme={theme}>
              <span>{getModelName()}</span>
              <span>Ready</span>
            </ModelInfo>
          </StatusBar>
          <ChatInput onSendMessage={handleSendMessage} disabled={isStreaming} />
        </div>
      </ChatContainer>
    );
  }

  // Render chat interface when a chat is selected or in project context
  return (
    <ChatContainer>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MessageList 
          messages={messages}
          onDeleteMessage={handleDeleteMessage}
        />
      </div>
      
      <div style={{ marginTop: 'auto' }}>
        <StatusBar theme={theme}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isStreaming ? (
              <span>
                ({Math.round(messageDuration)}s · {formatTokenCount(tokenCount.output || 0)} tokens · esc to interrupt)
              </span>
            ) : (
              <>
                <span>{Math.round(messageDuration)}s</span>
                <span style={{ opacity: 0.7 }}>•</span>
                <span>{formatTokenCount(tokenCount.output || 0)} tokens</span>
              </>
            )}
          </div>
          <ModelInfo theme={theme}>
            <span>{getModelName()}</span>
            <span>{isStreaming ? 'Generating...' : 'Ready'}</span>
          </ModelInfo>
        </StatusBar>
        <ChatInput onSendMessage={handleSendMessage} disabled={isStreaming} />
      </div>
    </ChatContainer>
  );
};

export default ChatView;