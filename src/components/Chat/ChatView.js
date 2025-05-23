import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import TokenDisplay from './TokenDisplay';
import BrainIcon from './BrainIcon';
import llmService from '../../services/LLMService';
import streamingManager from '../../services/StreamingManager';
import { useStreamingProtection } from '../../hooks/useStreamingProtection';
// DeleteIcon import removed as it's no longer needed here

// Global streaming buffer to persist across re-renders
if (!window.__streamingBuffer) {
  window.__streamingBuffer = {
    projectId: null,
    messages: [],
    isActive: false
  };
}

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

// Custom comparison to prevent re-renders during streaming
const arePropsEqual = (prevProps, nextProps) => {
  // If streaming is active, prevent re-renders from parent changes
  if (window.__isStreaming) {
    console.log('[ChatView] Preventing re-render during streaming');
    return true;
  }
  // Otherwise allow re-render only if projectId changes
  return prevProps.projectId === nextProps.projectId;
};

const ChatView = React.memo(({ projectId }) => {
  console.log('[ChatView] Component render triggered', { projectId, timestamp: Date.now() });
  
  // Use streaming protection hook
  const { renderCount } = useStreamingProtection('ChatView');
  
  // Log mount/unmount lifecycle
  React.useEffect(() => {
    console.log('[ChatView] MOUNTED', { projectId, timestamp: Date.now() });
    return () => {
      console.log('[ChatView] UNMOUNTING', { 
        projectId, 
        timestamp: Date.now(), 
        isStreaming: window.__isStreaming,
        streamingContent: window.__streamingContent?.length || 0
      });
    };
  }, []);
  
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
    resetTokenCount,
    processPendingProjectUpdates
  } = useApp();
  
  // Force component refresh with version stamp
  const componentVersion = 'v2.0';
  
  // Debug: Log when context values change
  React.useEffect(() => {
    console.log('[ChatView] Context changed:', {
      projectsLength: projects.length,
      currentModel,
      tokenCount,
      messageDuration
    });
  }, [projects.length, currentModel, tokenCount, messageDuration]);
  
  // Remove Ollama test to prevent re-renders
  
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
  const [isStreaming, setIsStreaming] = useState(() => {
    // Check if streaming is active from window state
    return window.__isStreaming || false;
  });
  const [streamStart, setStreamStart] = useState(null);
  const [tokenRate, setTokenRate] = useState(0);
  const [streamingMessageId, setStreamingMessageId] = useState(() => {
    // Restore streaming message ID if active
    return window.__streamingMessageId || null;
  });
  const [streamingContent, setStreamingContent] = useState(() => {
    // Restore streaming content if active
    return window.__streamingContent || '';
  });
  const abortControllerRef = React.useRef(null);
  
  // State for project messages to ensure UI updates
  const [localProjectMessages, setLocalProjectMessages] = useState(() => {
    // Check if there's an active streaming buffer for this project
    if (window.__streamingBuffer.isActive && window.__streamingBuffer.projectId === projectId) {
      console.log('Restoring messages from streaming buffer');
      return window.__streamingBuffer.messages;
    }
    
    // Initialize with project messages if available
    if (projectId) {
      const proj = projects.find(p => p.id === projectId);
      return proj?.messages || [];
    }
    return [];
  });
  
  // Track if we're currently streaming to prevent re-initialization
  const isStreamingRef = React.useRef(false);
  React.useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);
  
  // Ref to store streaming content to prevent loss during re-renders
  // Initialize from window state if available
  const streamingContentRef = React.useRef(window.__streamingContent || '');
  
  // Ref to track pending project save after streaming
  const pendingProjectSaveRef = React.useRef(null);
  
  // Save messages on unmount if streaming was interrupted
  React.useEffect(() => {
    return () => {
      // Cleanup: save any pending messages if component unmounts
      if (pendingProjectSaveRef.current && projectId) {
        const { projectId: pendingProjectId, messages } = pendingProjectSaveRef.current;
        console.error('[ChatView] CRITICAL: Component unmounting with pending messages during streaming!', {
          isStreaming: window.__isStreaming,
          streamingMessageId: window.__streamingMessageId,
          streamingContentLength: window.__streamingContent?.length || 0,
          bufferActive: window.__streamingBuffer?.isActive
        });
        // Don't update project if streaming is active - it will cause cascading unmounts
        if (!window.__isStreaming) {
          updateProject(pendingProjectId, { 
            messages,
            lastUpdated: new Date().toISOString()
          });
        }
      }
    };
  }, [projectId, updateProject]);
  
  // Get project-specific messages if projectId is provided
  const project = projectId ? projects.find(p => p.id === projectId) : null;
  const projectMessages = project?.messages || [];
  
  // Remove sync effect entirely - we initialize state properly above
  
  // Use local project messages if in project context, otherwise use currentChat messages
  const baseMessages = projectId ? localProjectMessages : (currentChat?.messages || []);
  
  // Remove debug effect to prevent re-renders
  
  // Apply streaming content to messages
  const messages = React.useMemo(() => {
    const msgs = [...baseMessages];
    
    // Use ONLY window variables to avoid React state updates
    const currentStreamingId = window.__streamingMessageId;
    const currentStreamingContent = window.__streamingContent;
    
    // Find and update the streaming message if it exists
    if (currentStreamingId && currentStreamingContent) {
      const messageIndex = msgs.findIndex(msg => msg.id === currentStreamingId);
      if (messageIndex !== -1) {
        msgs[messageIndex] = {
          ...msgs[messageIndex],
          content: currentStreamingContent,
          isStreaming: isStreaming
        };
      }
    }
    
    return msgs;
  }, [baseMessages]); // Only depend on baseMessages to avoid re-renders
  
  // Force re-render when messages change
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Minimal debug logging
  if (projectId) {
    console.log('ChatView - project mode, message count:', messages.length);
  }
  
  // Remove monitoring effect to prevent re-renders
  
  // No need for this effect - the messages array already handles streaming content
  
  // Remove diagnostic effect to prevent re-renders
  
  
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
    
    // Create message IDs first
    const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Reset streaming state
    const startTime = performance.now();
    setIsStreaming(true);
    window.__isStreaming = true; // Set global flag immediately
    streamingManager.startStreaming(assistantMessageId, projectId);
    setStreamStart(startTime);
    setTokenRate(0);
    setMessageTime(0); // Reset duration
    resetTokenCount(); // Reset token count
    // Don't reset streaming content here - let it persist until streaming starts
    
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
    
    // Set streaming message ID and reset content
    setStreamingMessageId(assistantMessageId);
    // Don't update React state - just reset refs and window vars
    streamingContentRef.current = '';
    window.__streamingMessageId = assistantMessageId;
    window.__streamingContent = '';
    console.log('SET STREAMING MESSAGE ID:', assistantMessageId);
    
    try {
      // Handle project context
      if (projectId && updateProject) {
        console.log('handleSendMessage: In project context, updating project messages');
        console.log('handleSendMessage: projectId:', projectId);
        console.log('handleSendMessage: current messages:', messages);
        console.log('handleSendMessage: updateProject function exists:', typeof updateProject);
        try {
          // Ensure messages is an array before spreading
          const currentMessages = Array.isArray(messages) ? messages : [];
          // Update project with new messages
          const updatedMessages = [...currentMessages, userMessage, assistantMessage];
          console.log('handleSendMessage: Calling updateProject with messages:', updatedMessages);
          
          // Update local state immediately with both messages
          setLocalProjectMessages(updatedMessages);
          console.log('Set local project messages with assistant placeholder:', {
            totalMessages: updatedMessages.length,
            assistantMsg: updatedMessages.find(m => m.id === assistantMessageId),
            allMessageIds: updatedMessages.map(m => m.id)
          });
          
          // Store in global buffer to survive re-renders
          window.__streamingBuffer = {
            projectId,
            messages: updatedMessages,
            isActive: true
          };
          
          // IMPORTANT: Don't update project context until streaming is complete
          // This prevents re-renders that interrupt streaming
          console.log('Deferring project update until streaming completes');
          
          // Store the messages for saving after streaming
          pendingProjectSaveRef.current = {
            projectId,
            messages: updatedMessages
          };
          
          // DO NOT update project during streaming - this causes re-renders
          // All updates will be handled after streaming completes
          
          // Start streaming the response
          await streamAssistantResponse(assistantMessageId, messageText, startTime);
          
          // After streaming is complete, save to project
          // This is handled in the streamAssistantResponse completion
        } catch (projectError) {
          console.error('Error updating project:', projectError);
          // Don't let project update errors crash the whole flow
          throw projectError;
        }
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
      window.__isStreaming = false; // Always clear the global flag
      streamingManager.stopStreaming();
      setStreamStart(null);
      setTokenRate(0);
      
      // Save pending project updates if any
      if (pendingProjectSaveRef.current && projectId) {
        const { projectId: pendingProjectId } = pendingProjectSaveRef.current;
        console.log('Saving pending project update after streaming complete');
        
        // Get the final content from the streaming buffer or window
        const finalStreamedContent = window.__streamingContent || streamingContentRef.current;
        
        // Update local messages with the final streamed content
        setLocalProjectMessages(currentMessages => {
          // Update the assistant message with the final content
          const updatedMessages = currentMessages.map(msg => 
            msg.id === window.__streamingMessageId
              ? { ...msg, content: finalStreamedContent, isStreaming: false }
              : msg
          );
          
          console.log('Final messages to save:', {
            count: updatedMessages.length,
            lastMessage: updatedMessages[updatedMessages.length - 1]
          });
          
          // Save to project after a longer delay to avoid any re-render issues
          setTimeout(() => {
            // Double-check that streaming is really done
            if (!window.__isStreaming) {
              console.log('Confirmed streaming is complete, saving to project');
              updateProject(pendingProjectId, { 
                messages: updatedMessages,
                lastUpdated: new Date().toISOString()
              });
              pendingProjectSaveRef.current = null;
              
              // Clear the streaming buffer
              window.__streamingBuffer = {
                projectId: null,
                messages: [],
                isActive: false
              };
            } else {
              console.warn('Streaming flag still active, deferring save');
            }
          }, 2000); // Increased delay to 2 seconds
          
          return updatedMessages; // Return updated messages with final content
        });
      }
      
      // Don't clear streaming content/ID until after the final save is complete
      setTimeout(() => {
        setStreamingMessageId(null);
        // Don't update React state - just clear window variables
        window.__streamingContent = '';
        window.__isStreaming = false;
        window.__streamingMessageId = '';
        
        // Process any pending project updates now that streaming is complete
        if (processPendingProjectUpdates) {
          processPendingProjectUpdates();
        }
      }, 1000); // Give time for final save
      // Clear abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  };
  const streamAssistantResponse = async (assistantMessageId, userMessage, startTime) => {
    console.log('streamAssistantResponse called with assistantMessageId:', assistantMessageId);
    
    // Ensure the streaming message ID is set
    window.__streamingMessageId = assistantMessageId;
    
    // Set up a heartbeat to detect if streaming stops unexpectedly
    let lastChunkTime = Date.now();
    const heartbeatInterval = setInterval(() => {
      const timeSinceLastChunk = Date.now() - lastChunkTime;
      if (timeSinceLastChunk > 5000 && window.__isStreaming) {
        console.error('[ChatView] Streaming appears to have stopped unexpectedly!', {
          timeSinceLastChunk,
          streamingContent: window.__streamingContent?.length || 0
        });
      }
    }, 1000);
    
    // Get the current project if in project context
    const currentProject = projectId ? projects.find(p => p.id === projectId) : null;
    // For project context, ensure we use the project's model or fallback to current
    const modelToUse = currentProject?.model || currentModel || 'deepseek-r1:8b-m4';
    
    // Ensure we have a valid model from the available models
    const availableModel = models?.find(m => m.id === modelToUse || m.name === modelToUse);
    const finalModel = availableModel?.id || modelToUse;
    console.log('streamAssistantResponse: Starting to stream message');
    console.log('streamAssistantResponse: Project context:', projectId ? { projectId, projectModel: currentProject?.model } : 'none');
    console.log('streamAssistantResponse: Current model from context:', currentModel);
    console.log('streamAssistantResponse: Using model:', modelToUse);
    console.log('streamAssistantResponse: Available models:', models);
    console.log('streamAssistantResponse: Projects array:', projects);
    
    // Validate that we have a valid model
    if (!modelToUse) {
      console.error('No model available for streaming');
      throw new Error('No model selected');
    }
    
    let fullResponse = '';
    let responseTokens = 0;
    let lastUpdateTime = startTime;
    
    try {
      // Create abort controller for this stream
      abortControllerRef.current = new AbortController();
      
      await llmService.streamMessage(
        userMessage,
        { 
          model: finalModel,
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
              
              // Mark streaming as complete to remove blinking cursor
              streamingManager.completeStreaming();
              
              const endTime = performance.now();
              const duration = (endTime - startTime) / 1000; // in seconds
              const tokensPerSecond = responseTokens / duration;
              
              console.log(`streamAssistantResponse: Stream stats - duration: ${duration.toFixed(2)}s, tokens: ${responseTokens}, tps: ${tokensPerSecond.toFixed(2)}`);
              console.log('Final response:', fullResponse);
              
              // Check if response only contains thinking tags
              const hasThinking = fullResponse.includes('<think>') && fullResponse.includes('</think>');
              const withoutThinking = fullResponse.replace(/<think>[\s\S]*?<\/think>/, '').trim();
              
              if (hasThinking && withoutThinking === '') {
                console.warn('Response only contains thinking content, no answer provided');
                fullResponse += '\n\nI need to provide a response after thinking. Let me try again.';
              }
              
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
                console.log('Stream complete - updating project with final content:', {
                  assistantMessageId,
                  contentLength: fullResponse.length
                });
                
                // Save the final response content
                const finalContent = fullResponse;
                console.log('Saving final content to project:', {
                  assistantMessageId,
                  finalContentLength: finalContent.length,
                  preview: finalContent.substring(0, 100)
                });
                
                // DO NOT update React state here - it causes re-renders during streaming
                // The content is already displayed via DOM manipulation
                // We'll update the state after streaming is fully complete in the finally block
                
                // Just update the global buffer with final content
                if (window.__streamingBuffer.isActive && window.__streamingBuffer.projectId === projectId) {
                  window.__streamingBuffer.messages = window.__streamingBuffer.messages.map(msg =>
                    msg.id === assistantMessageId 
                      ? { ...msg, content: finalContent, isStreaming: false }
                      : msg
                  );
                }
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
                const currentMessages = Array.isArray(messages) ? messages : [];
                const updatedMessages = currentMessages.map(msg => 
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
              
              // Update heartbeat
              lastChunkTime = Date.now();
              
              // Update local streaming content
              streamingContentRef.current = fullResponse;
              
              // Update via streaming manager for direct DOM updates
              streamingManager.updateContent(fullResponse);
              
              // DO NOT update React state during streaming - this causes re-renders!
              // Just update window variables for diagnostic overlay
              window.__streamingContent = fullResponse;
              window.__isStreaming = true;
              // Make sure window variables are set with current message ID
              window.__streamingMessageId = assistantMessageId;
              
              // Update the streaming buffer with current content
              if (window.__streamingBuffer.isActive && window.__streamingBuffer.projectId === projectId) {
                // Update the assistant message in the buffer
                window.__streamingBuffer.messages = window.__streamingBuffer.messages.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullResponse }
                    : msg
                );
              }
              
              console.log('Set streaming content:', {
                length: fullResponse.length,
                preview: fullResponse.substring(0, 100),
                assistantMessageId,
                windowStreamingMessageId: window.__streamingMessageId
              });
              
              // Update duration and token count in real-time during streaming
              // IMPORTANT: Only update these values periodically to prevent excessive re-renders
              const currentTime = performance.now();
              const currentDuration = (currentTime - startTime) / 1000; // in seconds
              
              // Throttle updates to once per second
              if (currentTime - lastUpdateTime > 1000) {
                lastUpdateTime = currentTime;
                setMessageTime(currentDuration);
                updateTokenCount({
                  input: 0,
                  output: responseTokens
                });
              }
              
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
                // For projects, we rely on the streaming content state
                // The actual message content is displayed via the messages useMemo above
                console.log('Streaming content update:', {
                  assistantMessageId,
                  contentLength: fullResponse.length,
                  firstChars: fullResponse.substring(0, 50)
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
      
      // Clear heartbeat interval
      clearInterval(heartbeatInterval);
      
    } catch (error) {
      console.error('Error in streamAssistantResponse:', error);
      
      // Clear heartbeat interval
      clearInterval(heartbeatInterval);
      
      // Make sure to clean up streaming state
      setIsStreaming(false);
      setStreamStart(null);
      setTokenRate(0);
      
      // Clear the abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
      
      throw error;
    }
  };
  
  const handleStreamError = (error, startTime) => {
    console.error('Error in stream:', error);
    
    // Calculate duration
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    setMessageTime(duration);
    
    const errorContent = error.message === 'No model selected' 
      ? 'No model is currently selected. Please select a model from the sidebar.'
      : error.name === 'AbortError' 
      ? 'Response generation was interrupted.'
      : `Sorry, there was an error generating a response: ${error.message}. Please check that Ollama is running and try again.`;
    
    console.error('[ChatView] Stream error details:', {
      error: error.message,
      stack: error.stack,
      isStreaming: window.__isStreaming,
      projectId
    });
    
    // Handle project context errors
    if (projectId && updateProject) {
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString(),
        isError: true,
        isStreaming: false
      };
      
      // Update project messages - replace streaming message with error
      const currentMessages = Array.isArray(messages) ? messages : [];
      const updatedMessages = currentMessages.map(msg => {
        if (msg.isStreaming || (msg.role === 'assistant' && !msg.content)) {
          return errorMessage;
        }
        return msg;
      });
      
      // If no assistant message found to replace, add the error
      const hasAssistantMessage = currentMessages.some(msg => msg.role === 'assistant');
      if (!hasAssistantMessage) {
        updatedMessages.push(errorMessage);
      }
      
      try {
        updateProject(projectId, { 
          messages: updatedMessages,
          lastUpdated: new Date().toISOString()
        });
      } catch (updateError) {
        console.error('Failed to update project with error message:', updateError);
      }
    } else {
      // Update regular chat
      setCurrentChat(prev => {
        if (!prev) return null;
        
        const errorMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errorContent,
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
    }
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
}, arePropsEqual);

export default ChatView;