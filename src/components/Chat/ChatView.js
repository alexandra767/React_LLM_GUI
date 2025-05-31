import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import TokenDisplay from './TokenDisplay';
import ProgressBar from './ProgressBar';
import BrainIcon from './BrainIcon';
import BrainLightningIcon from './BrainLightningIcon';
import llmService from '../../services/LLMService';
import streamingManager from '../../services/StreamingManager';
import { useStreamingProtection } from '../../hooks/useStreamingProtection';
import simpleStreamingService from '../../services/SimpleStreamingService';
import { processCommand } from '../../utils/commandProcessor';
import companionService from '../../services/CompanionService';
// DeleteIcon import removed as it's no longer needed here
import ErrorBoundary from '../Common/ErrorBoundary';

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
  backgroundColor: '#1E1E1E',
  '& @keyframes blink': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0 },
    '100%': { opacity: 1 }
  }
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
  padding: '8px 0',
  margin: '0 24px',
  borderRadius: '8px 8px 0 0',
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

const Select = styled('select')({
  backgroundColor: '#1E1E1E',
  color: '#FFFFFF',
  border: '1px solid #333333',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
  '&:focus': {
    outline: 'none',
    borderColor: '#FF643D'
  },
  '& option': {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF'
  }
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
  '& img': {
    width: '60px',
    height: '60px',
    objectFit: 'contain'
  },
  '& svg': {
    width: '60px',
    height: '60px',
    color: '#FF643D'
  }
});

// Custom comparison to prevent re-renders during streaming
const arePropsEqual = (prevProps, nextProps) => {
  // Only re-render if projectId changes
  // Handle undefined projectId (for regular chats)
  const prevId = prevProps.projectId || 'default';
  const nextId = nextProps.projectId || 'default';
  return prevId === nextId;
};

// Wrap the Message component with React.memo
const Message = React.memo(({ message, isStreaming, streamingContent }) => {
  // Your existing Message component implementation
  return (
    <div className={`message ${message.role}`} data-message-id={message.id}>
      <div className="message-content">
        {isStreaming ? streamingContent : message.content}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.streamingContent === nextProps.streamingContent
  );
});

const ChatView = React.memo(({ projectId }) => {
  // Refs for streaming state
  const errorHandledRef = useRef(false);
  const errorTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const pendingProjectSaveRef = useRef(null);
  const abortControllerRef = useRef(null);
  const chatInputRef = useRef(null);
  
  // Debug: Expose companion service globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.companionService = companionService;
      console.log('[ChatView] 🐛 CompanionService exposed globally for debugging');
    }
  }, []);
  
  // Clear refs on unmount - Track mount state globally to survive Electron re-renders
  useEffect(() => {
    // Generate unique ID for this component instance
    const componentId = `chatview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set mounted state on mount
    isMountedRef.current = true;
    
    // Store mount state globally
    if (!window.__activeChatViews) {
      window.__activeChatViews = new Set();
    }
    window.__activeChatViews.add(componentId);
    window.__currentChatViewId = componentId;
    
    console.log('[ChatView] Component mounted, ID:', componentId, 'Active views:', window.__activeChatViews.size);
    
    return () => {
      console.log('[ChatView] Component unmounting, ID:', componentId, 'Was streaming:', window.__isStreaming);
      isMountedRef.current = false;
      
      // Remove from active views
      if (window.__activeChatViews) {
        window.__activeChatViews.delete(componentId);
      }
      
      // Only cleanup if this was the last active view
      if (!window.__activeChatViews || window.__activeChatViews.size === 0) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
      }
    };
  }, []);
  
  // Initialize from window state if available
  const streamingContentRef = useRef(window.__streamingContent || '');
  console.log('[ChatView] Component render triggered', { projectId, timestamp: Date.now() });
  
  // Use streaming protection hook
  const { renderCount } = useStreamingProtection('ChatView');
  
  // Log mount/unmount lifecycle
  React.useEffect(() => {
    console.log('[ChatView] MOUNTED', { projectId, timestamp: Date.now() });
    
    // Debug why component might unmount
    const checkUnmountReason = () => {
      console.trace('[ChatView] Unmount stack trace');
    };
    
    return () => {
      console.log('[ChatView] UNMOUNTING', { 
        projectId, 
        timestamp: Date.now(), 
        isStreaming: window.__isStreaming,
        streamingContent: window.__streamingContent?.length || 0
      });
      checkUnmountReason();
    };
  }, []);
  
  const theme = useTheme();
  const { 
    currentChat, 
    chats = [], 
    setChats,
    setCurrentChatId,
    appState,
    setAppState,
    currentModel,
    models = [],
    loadModel,
    createNewChat: createNewChatFromContext,
    setCurrentChat,
    tokenCount = { input: 0, output: 0, total: 0 },
    setTokenCount: updateTokenCount,
    messageDuration = 0,
    setMessageTime,
    projects = [],
    updateProject,
    resetTokenCount,
    processPendingProjectUpdates,
    generateChatDescription,
    imageGenerationProgress,
    setImageGenerationProgress,
    cancelImageGeneration,
    companionMode,
    setCompanionMode
  } = useApp();
  
  // Force component refresh with version stamp
  const componentVersion = 'v2.0';
  
  // Debug: Log when context values change - disabled to prevent re-renders
  // React.useEffect(() => {
  //   console.log('[ChatView] Context changed:', {
  //     projectsLength: projects.length,
  //     currentModel,
  //     tokenCount,
  //     messageDuration
  //   });
  // }, [projects.length, currentModel, tokenCount, messageDuration]);
  
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
  // State for streaming content
  const [streamingContent, setStreamingContent] = useState(() => {
    // Restore streaming content if active
    return window.__streamingContent || '';
  });
  
  // Auto-enable voice-first mode on component mount
  useEffect(() => {
    const voiceSettings = JSON.parse(localStorage.getItem('sephia_voice_settings') || '{}');
    if (!voiceSettings.autoSpeak) {
      const updatedSettings = {
        ...voiceSettings,
        autoSpeak: true,
        voiceEnabled: true,
        voiceSynthesisProvider: 'bark'
      };
      localStorage.setItem('sephia_voice_settings', JSON.stringify(updatedSettings));
      console.log('[ChatView] 🎤 Auto-enabled voice-first mode');
    }
  }, []);
  
  // State for project messages to ensure UI updates
  const [localProjectMessages, setLocalProjectMessages] = useState(() => {
    // Check if there's an active streaming buffer for this project
    if (window.__streamingBuffer?.isActive && window.__streamingBuffer.projectId === projectId) {
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

  // Force re-render trigger for voice-first mode
  const [voiceUpdateTrigger, setVoiceUpdateTrigger] = useState(0);
  
  // Track streaming state with ref to prevent re-initialization
  const isStreamingRef = useRef(false);
  
  // Synchronize ref with streaming state
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);
  
  // Update message duration while streaming - reduced frequency to prevent re-renders
  useEffect(() => {
    if (isStreaming && streamStart) {
      const interval = setInterval(() => {
        const duration = (performance.now() - streamStart) / 1000;
        setMessageTime(duration);
      }, 1000); // Update every 1 second instead of 100ms
      
      return () => clearInterval(interval);
    }
  }, [isStreaming, streamStart, setMessageTime]);
  
  // Remove force update to prevent re-render loops
  // The streaming content updates will trigger re-renders naturally through state changes
  
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
  
  // Debug logging for project knowledge
  useEffect(() => {
    if (project && project.knowledgeFiles) {
      console.log('[ChatView] Project knowledge status:', {
        projectId,
        projectTitle: project.title,
        knowledgeFileCount: project.knowledgeFiles.length,
        currentModel,
        files: project.knowledgeFiles.map(f => ({
          name: f.name,
          type: f.type,
          hasContent: !!f.content,
          hasExtractedText: !!f.extractedText
        }))
      });
    }
  }, [project, currentModel]);
  
  // Sync local messages with project messages when they change
  React.useEffect(() => {
    if (projectId && project?.messages) {
      console.log('[ChatView] Project sync effect triggered', {
        projectId,
        projectExists: !!project,
        projectMessageCount: project.messages.length,
        localMessageCount: localProjectMessages.length,
        firstMessagePreview: typeof project.messages[0]?.content === 'string' ? project.messages[0].content.substring(0, 50) : 'N/A'
      });
      
      // Only sync if local messages are different or local is empty
      // This prevents overwriting messages that were just added by voice-first mode
      const shouldSync = localProjectMessages.length === 0 || 
                        localProjectMessages.length !== project.messages.length ||
                        JSON.stringify(localProjectMessages.map(m => m.id)) !== JSON.stringify(project.messages.map(m => m.id));
      
      if (shouldSync) {
        console.log('[ChatView] Syncing project messages - differences detected');
        setLocalProjectMessages(project.messages);
      } else {
        console.log('[ChatView] Skipping project sync - local messages already up to date');
      }
    }
  }, [projectId, project, localProjectMessages]);
  
  // Use local project messages if in project context, otherwise use currentChat messages
  const baseMessages = projectId ? localProjectMessages : (currentChat?.messages || []);
  
  // Debug effect for voice-first mode tracking
  React.useEffect(() => {
    if (companionMode && baseMessages.length > 0) {
      console.log('[ChatView] 🎤 Voice-first debug - messages updated:', {
        projectId,
        messageCount: baseMessages.length,
        lastMessage: baseMessages[baseMessages.length - 1] ? {
          id: baseMessages[baseMessages.length - 1].id,
          role: baseMessages[baseMessages.length - 1].role,
          isCompanion: baseMessages[baseMessages.length - 1].isCompanion,
          contentLength: baseMessages[baseMessages.length - 1].content?.length || 0
        } : null
      });
    }
  }, [baseMessages, companionMode, projectId]);
  
  // Remove debug effect to prevent re-renders
  
  // Apply streaming content to messages
  const messages = React.useMemo(() => {
    const msgs = [...baseMessages];
    
    // Use state variables for streaming content - prioritize state over window
    const currentStreamingId = streamingMessageId || window.__streamingMessageId;
    const currentStreamingContent = streamingContent || window.__streamingContent || '';
    
    console.log('[DIAGNOSTIC] Messages memo recalculating:', {
      projectId,
      baseMessagesCount: baseMessages.length,
      baseMessagesPreview: baseMessages.slice(-2).map(m => ({ id: m.id, role: m.role, contentLength: m.content?.length || 0 })),
      currentStreamingId,
      currentStreamingContentLength: currentStreamingContent.length,
      streamingMessageId,
      streamingContentLength: streamingContent.length,
      isStreaming,
      windowIsStreaming: window.__isStreaming,
      windowStreamingContent: window.__streamingContent?.length || 0,
      localProjectMessagesCount: projectId ? localProjectMessages.length : 'N/A',
      currentChatMessagesCount: currentChat?.messages?.length || 'N/A'
    });
    
    // Find and update the streaming message if it exists
    if (currentStreamingId) {  // Remove isStreaming check to ensure content shows
      const messageIndex = msgs.findIndex(msg => msg.id === currentStreamingId);
      console.log('[DIAGNOSTIC] Streaming message lookup:', {
        messageIndex,
        foundMessage: messageIndex !== -1 ? msgs[messageIndex] : null,
        willUpdateContent: currentStreamingContent.length > 0,
        currentContent: msgs[messageIndex]?.content?.length || 0
      });
      
      if (messageIndex !== -1) {
        // Always update with the latest content
        msgs[messageIndex] = {
          ...msgs[messageIndex],
          content: currentStreamingContent,
          isStreaming: isStreaming || window.__isStreaming
        };
        console.log('[DIAGNOSTIC] Updated streaming message:', {
          id: msgs[messageIndex].id,
          contentLength: msgs[messageIndex].content.length,
          contentPreview: typeof msgs[messageIndex].content === 'string' ? msgs[messageIndex].content.substring(0, 50) : 'N/A',
          isStreaming: msgs[messageIndex].isStreaming
        });
      } else {
        console.warn('[DIAGNOSTIC] Streaming message not found in messages array!');
      }
    }
    
    console.log('[DIAGNOSTIC] Final messages:', {
      count: msgs.length,
      lastMessage: msgs[msgs.length - 1],
      lastMessageContent: typeof msgs[msgs.length - 1]?.content === 'string' ? msgs[msgs.length - 1].content.substring(0, 50) : 'N/A'
    });
    
    return msgs;
  }, [baseMessages, streamingMessageId, streamingContent, isStreaming, voiceUpdateTrigger]); // Include all streaming deps and voice trigger
  
  // Force re-render when messages change
  // Removed forceUpdate to prevent re-render loops in Electron
  
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
  
  // Auto-focus input when streaming completes
  React.useEffect(() => {
    if (!isStreaming && chatInputRef.current) {
      // Small delay to ensure input is enabled
      const timer = setTimeout(() => {
        if (chatInputRef.current && chatInputRef.current.focus) {
          chatInputRef.current.focus();
          console.log('[ChatView] Auto-focused input after streaming state change');
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isStreaming]);
  
  const estimateTokens = (text) => {
    // Very rough estimate: ~4 chars per token for English text
    return Math.ceil(text.length / 4);
  };
  
  const handleSendMessage = async (messageText, attachments = []) => {
    console.log('[ChatView] ============ handleSendMessage START ============');
    console.log('[ChatView] handleSendMessage called with text:', messageText);
    console.log('[ChatView] Attachments:', attachments?.length || 0);
    console.log('[ChatView] Message details:', {
      length: messageText?.length,
      trimmed: messageText?.trim(),
      startsWithAt: messageText?.trim()?.startsWith('@'),
      firstChar: messageText?.charAt(0),
      charCode: messageText?.charCodeAt(0)
    });
    
    // Validate input
    if (!messageText || typeof messageText !== 'string' || !messageText.trim()) {
      console.warn('handleSendMessage: Empty or invalid message text');
      return;
    }
    
    // Check if already streaming
    if (isStreamingRef.current) {
      console.warn('handleSendMessage: Already streaming, ignoring new message');
      return;
    }
    
    // Check if companion mode is enabled OR memory is force-enabled
    const forceMemory = localStorage.getItem('sephia_force_memory') === 'true';
    const useCompanionMode = companionMode || forceMemory; // Use actual companion mode setting
    console.log('[ChatView] 🔍 Mode detection:', {
      companionMode, 
      forceMemory, 
      useCompanionMode,
      messageStartsWithAt: messageText.trim().startsWith('@'),
      willUseCompanion: useCompanionMode && !messageText.trim().startsWith('@')
    });
    
    if (useCompanionMode && !messageText.trim().startsWith('@')) {
      console.log('[ChatView] 🤖 COMPANION MODE ACTIVE: Processing natural conversation');
      console.log('[ChatView] 🤖 companionMode:', companionMode, 'forceMemory:', forceMemory);
      try {
        // Initialize companion service if needed
        if (!companionService.integrationService) {
          const { getIntegrationService } = await import('../../utils/commandProcessor');
          const integrationService = await getIntegrationService();
          companionService.initialize(integrationService, { processCommand });
          
          // Connect voice service for auto-speaking
          const voiceService = await import('../../services/VoiceService');
          companionService.setVoiceService(voiceService.default);
          
          // Ensure MemoryAdapter is loaded
          if (!companionService.memoryService) {
            try {
              // Load and initialize MemoryAdapter
              const { default: MemoryAdapter } = await import('../../services/MemoryAdapter');
              companionService.memoryService = MemoryAdapter;
              await companionService.memoryService.ensureInitialized();
              console.log('[ChatView] ✅ MemoryAdapter loaded and initialized');
            } catch (memoryError) {
              console.error('[ChatView] Failed to load MemoryAdapter:', memoryError);
            }
          }
        }
        
        // Process through companion service with voice callbacks
        const companionResult = await companionService.handleConversation(messageText.trim(), {
          voiceCallbacks: {
            onStart: () => {
              console.log('[ChatView] 🎤 Voice started, showing text content');
              // Update the message to show content and hide "preparing" state
              if (capturedProjectId && updateProject) {
                setLocalProjectMessages(prevMessages => {
                  return prevMessages.map(msg => 
                    msg.id === streamingMessageId ? { 
                      ...msg, 
                      isPreparingVoice: false,  // Hide preparing state
                      showContentNow: true  // Show content now
                    } : msg
                  );
                });
              } else {
                // Handle regular chat context
                setCurrentChat(prevChat => {
                  if (!prevChat) return prevChat;
                  return {
                    ...prevChat,
                    messages: prevChat.messages.map(msg => 
                      msg.id === streamingMessageId ? { 
                        ...msg, 
                        isPreparingVoice: false,
                        showContentNow: true
                      } : msg
                    )
                  };
                });
              }
            }
          },
          setImageGenerationProgress,
          attachments
        });
        
        console.log('[ChatView] Companion result:', companionResult);
        
        // Create user message
        const userMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          role: 'user',
          content: messageText.trim(),
          timestamp: new Date().toISOString()
        };

        // Handle voice-first mode if enabled
        if (companionResult.delayTextUntilVoice && companionResult.voicePromise) {
          console.log('[ChatView] 🎤 Voice-first mode: Adding user message, waiting for voice to complete');
          
          // Capture current state to avoid stale closures
          const capturedProjectId = projectId;
          const capturedCurrentChat = currentChat;
          const capturedTheme = theme;
          
          // Separate thinking process from final response
          const fullContent = companionResult.content || '';
          const thinkMatch = fullContent.match(/<think>([\s\S]*?)<\/think>/);
          const thinkingContent = thinkMatch ? thinkMatch[1].trim() : '';
          const responseContent = fullContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          
          // Create streaming message for voice-first mode - show thinking immediately, response when voice starts
          const streamingMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          const streamingMessage = {
            id: streamingMessageId,
            role: 'assistant',
            content: responseContent || 'Generating response...',  // The actual response content
            thinkingProcess: thinkingContent,  // Thinking process for dropdown
            timestamp: new Date().toISOString(),
            isCompanion: true,
            isStreaming: true,  // Mark as streaming instead of typing
            isVoicePlaying: true,  // Indicate voice is playing
            isPreparingVoice: true,  // Special flag for voice preparation
            showContentOnVoiceStart: true  // Flag to show content when voice starts
          };
          
          // Add user message and streaming response immediately
          if (capturedProjectId && updateProject) {
            setLocalProjectMessages(prevMessages => {
              const updatedMessages = [...(prevMessages || []), userMessage, streamingMessage];
              console.log('[ChatView] 🎤 Project: Added user message + streaming response, total messages:', updatedMessages.length);
              return updatedMessages;
            });
          } else {
            // Handle regular chat context
            if (!capturedCurrentChat) {
              const newChat = createNewChat('Chat with Aria', capturedTheme?.name || 'dark', messageText.trim());
              const chatWithMessages = {
                ...newChat,
                messages: [userMessage, streamingMessage],
                updatedAt: new Date().toISOString()
              };
              console.log('[ChatView] 🎤 Chat: Created new chat with user message + streaming response');
              setCurrentChat(chatWithMessages);
              if (setChats) {
                setChats(prevChats => 
                  prevChats.map(chat => 
                    chat.id === newChat.id ? chatWithMessages : chat
                  )
                );
              }
            } else {
              const updatedChat = {
                ...capturedCurrentChat,
                messages: [...capturedCurrentChat.messages, userMessage, streamingMessage],
                updatedAt: new Date().toISOString()
              };
              console.log('[ChatView] 🎤 Chat: Added user message + streaming response, total messages:', updatedChat.messages.length);
              setCurrentChat(updatedChat);
              if (setChats) {
                setChats(prevChats => 
                  prevChats.map(chat => 
                    chat.id === capturedCurrentChat.id ? updatedChat : chat
                  )
                );
              }
            }
          }

          // Wait for voice to complete, then mark streaming as complete
          console.log('[ChatView] 🎤 Setting up voice completion handler');
          companionResult.voicePromise.then((voiceResult) => {
            console.log('[ChatView] 🎤 Voice promise resolved with result:', voiceResult);
            console.log('[ChatView] 🎤 Voice completed, marking message as complete');
            
            // No need to create a new message - just update the existing one to mark voice as complete
            const finalContent = typeof companionResult.content === 'string' ? companionResult.content : String(companionResult.content || 'I apologize, but I encountered an issue processing your request.');
            const imageData = companionResult.integrationResults?.find(r => r.type === 'image');

            console.log('[ChatView] 🎤 Updating message to mark voice complete:', {
              id: streamingMessageId,
              contentLength: finalContent.length,
              contentPreview: finalContent.substring(0, 100)
            });

            try {
              if (capturedProjectId && updateProject) {
                console.log('[ChatView] 🎤 Marking streaming message as voice complete');
                setLocalProjectMessages(prevMessages => {
                  // Update the streaming message to mark voice as complete
                  const finalMessages = prevMessages.map(msg => 
                    msg.id === streamingMessageId ? { 
                      ...msg, 
                      content: finalContent,
                      isStreaming: false,
                      isVoicePlaying: false,
                      ...(imageData && { imageUrl: imageData.data.imageUrl })
                    } : msg
                  );
                  console.log('[ChatView] 🎤 Project: Final messages after voice:', finalMessages.length);
                  
                  // Schedule project update after state update completes
                  setTimeout(() => {
                    updateProject(capturedProjectId, { 
                      messages: finalMessages,
                      lastUpdated: new Date().toISOString()
                    });
                    // Trigger re-render to ensure UI updates
                    setVoiceUpdateTrigger(prev => prev + 1);
                  }, 0);
                  
                  return finalMessages;
                });
              } else {
                console.log('[ChatView] 🎤 Marking chat streaming message as voice complete');
                // Use functional update to get latest state
                setCurrentChat(prevChat => {
                  // Ensure we have a chat to update
                  if (!prevChat) {
                    console.warn('[ChatView] 🎤 No current chat found, cannot update');
                    return prevChat;
                  }
                  
                  const updatedChat = {
                    ...prevChat,
                    messages: prevChat.messages.map(msg => 
                      msg.id === streamingMessageId ? { 
                        ...msg, 
                        content: finalContent,
                        isStreaming: false,
                        isVoicePlaying: false,
                        ...(imageData && { imageUrl: imageData.data.imageUrl })
                      } : msg
                    ),
                    updatedAt: new Date().toISOString()
                  };
                  
                  console.log('[ChatView] 🎤 Chat: Updated messages after voice:', updatedChat.messages.length);
                  
                  // Update chats collection
                  if (setChats) {
                    setChats(prevChats => 
                      prevChats.map(chat => 
                        chat.id === prevChat.id ? updatedChat : chat
                      )
                    );
                  }
                  
                  // Trigger re-render to ensure UI updates
                  setTimeout(() => setVoiceUpdateTrigger(prev => prev + 1), 0);
                  
                  return updatedChat;
                });
              }
              console.log('[ChatView] 🎤 ✅ Voice-first mode completed successfully');
            } catch (stateError) {
              console.error('[ChatView] 🎤 ❌ Error updating state after voice:', stateError);
              console.error('[ChatView] 🎤 State error stack:', stateError.stack);
              
              // Fallback: try to replace typing message using functional updates
              console.log('[ChatView] 🎤 Attempting fallback state update');
              try {
                if (capturedProjectId && updateProject) {
                  setLocalProjectMessages(prevMessages => 
                    prevMessages.map(msg => 
                      msg.isTyping ? { ...companionMessage, id: msg.id } : msg
                    )
                  );
                } else {
                  setCurrentChat(prevChat => {
                    if (!prevChat) return prevChat;
                    return {
                      ...prevChat,
                      messages: prevChat.messages.map(msg => 
                        msg.isTyping ? { ...companionMessage, id: msg.id } : msg
                      ),
                      updatedAt: new Date().toISOString()
                    };
                  });
                }
                console.log('[ChatView] 🎤 ✅ Fallback state update succeeded');
              } catch (fallbackError) {
                console.error('[ChatView] 🎤 ❌ Fallback state update also failed:', fallbackError);
              }
            }
          }).catch(error => {
            console.error('[ChatView] 🎤 ❌ Voice promise rejected or state update failed:', error);
            console.error('[ChatView] 🎤 Error details:', {
              errorMessage: error?.message,
              errorStack: error?.stack,
              errorName: error?.name,
              errorString: String(error)
            });
            
            // Still show text even if voice failed - use fallback message creation
            const fallbackMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              role: 'assistant',
              content: typeof companionResult.content === 'string' ? companionResult.content : String(companionResult.content || 'I apologize, but I encountered an issue processing your request.'),
              timestamp: new Date().toISOString(),
              isCompanion: true,
              ...(companionResult.integrationResults?.find(r => r.type === 'image') && {
                imageUrl: companionResult.integrationResults.find(r => r.type === 'image').data.imageUrl
              })
            };

            console.log('[ChatView] 🎤 Replacing typing message with fallback after voice error');
            try {
              if (capturedProjectId && updateProject) {
                setLocalProjectMessages(prevMessages => {
                  const updatedMessages = prevMessages.map(msg => 
                    msg.isTyping ? { ...fallbackMessage, id: msg.id } : msg
                  );
                  console.log('[ChatView] 🎤 Fallback: Project messages updated, total:', updatedMessages.length);
                  
                  // Schedule project update after state update completes
                  setTimeout(() => {
                    updateProject(capturedProjectId, { 
                      messages: updatedMessages,
                      lastUpdated: new Date().toISOString()
                    });
                  }, 0);
                  
                  return updatedMessages;
                });
              } else {
                setCurrentChat(prevChat => {
                  if (!prevChat) {
                    console.warn('[ChatView] 🎤 Fallback: No current chat for fallback message');
                    return prevChat;
                  }
                  
                  const updatedChat = {
                    ...prevChat,
                    messages: prevChat.messages.map(msg => 
                      msg.isTyping ? { ...fallbackMessage, id: msg.id } : msg
                    ),
                    updatedAt: new Date().toISOString()
                  };
                  
                  console.log('[ChatView] 🎤 Fallback: Chat messages updated, total:', updatedChat.messages.length);
                  
                  if (setChats) {
                    setChats(prevChats => 
                      prevChats.map(chat => 
                        chat.id === prevChat.id ? updatedChat : chat
                      )
                    );
                  }
                  
                  return updatedChat;
                });
              }
              console.log('[ChatView] 🎤 ✅ Fallback message successfully added');
            } catch (fallbackError) {
              console.error('[ChatView] 🎤 ❌ Even fallback message addition failed:', fallbackError);
            }
          });

          return; // Exit early for voice-first mode
        }

        // Regular mode: Create companion response normally
        const companionMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          role: 'assistant',
          content: typeof companionResult.content === 'string' ? companionResult.content : String(companionResult.content || 'I apologize, but I encountered an issue processing your request.'),
          timestamp: new Date().toISOString(),
          isCompanion: true,
          ...(companionResult.integrationResults?.find(r => r.type === 'image') && {
            imageUrl: companionResult.integrationResults.find(r => r.type === 'image').data.imageUrl
          })
        };
        
        // Handle project context or regular chat
        if (projectId && updateProject) {
          const currentMessages = Array.isArray(messages) ? messages : [];
          const updatedMessages = [...currentMessages, userMessage, companionMessage];
          setLocalProjectMessages(updatedMessages);
          updateProject(projectId, { 
            messages: updatedMessages,
            lastUpdated: new Date().toISOString()
          });
        } else {
          // Handle regular chat context
          if (!currentChat) {
            const newChat = createNewChat('Chat with Aria', theme?.name || 'dark', messageText.trim());
            const chatWithMessages = {
              ...newChat,
              messages: [userMessage, companionMessage],
              updatedAt: new Date().toISOString()
            };
            setCurrentChat(chatWithMessages);
            if (setChats) {
              setChats(prevChats => 
                prevChats.map(chat => 
                  chat.id === newChat.id ? chatWithMessages : chat
                )
              );
            }
          } else {
            const updatedChat = {
              ...currentChat,
              messages: [...currentChat.messages, userMessage, companionMessage],
              updatedAt: new Date().toISOString()
            };
            setCurrentChat(updatedChat);
            if (setChats) {
              setChats(prevChats => 
                prevChats.map(chat => 
                  chat.id === currentChat.id ? updatedChat : chat
                )
              );
            }
          }
        }
        
        console.log('[ChatView] 🤖 COMPANION MODE COMPLETE - EXITING (no normal processing)');
        return; // Don't continue with normal AI processing
        
      } catch (error) {
        console.error('[ChatView] Companion error:', error);
        
        // Don't fall through to normal chat processing - show error in companion mode
        const userMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          role: 'user',
          content: messageText.trim(),
          timestamp: new Date().toISOString()
        };
        
        const errorMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          role: 'assistant',
          content: `I apologize, but I encountered an error processing your request: ${error.message}. Please try again.`,
          timestamp: new Date().toISOString(),
          isCompanion: true,
          isError: true
        };
        
        // Handle project context or regular chat
        if (projectId && updateProject) {
          const currentMessages = Array.isArray(messages) ? messages : [];
          const updatedMessages = [...currentMessages, userMessage, errorMessage];
          setLocalProjectMessages(updatedMessages);
          updateProject(projectId, { 
            messages: updatedMessages,
            lastUpdated: new Date().toISOString()
          });
        } else {
          // Handle regular chat context
          if (!currentChat) {
            const newChat = createNewChat('Chat with Aria', theme?.name || 'dark', messageText.trim());
            const chatWithMessages = {
              ...newChat,
              messages: [userMessage, errorMessage],
              updatedAt: new Date().toISOString()
            };
            setCurrentChat(chatWithMessages);
            if (setChats) {
              setChats(prevChats => 
                prevChats.map(chat => 
                  chat.id === newChat.id ? chatWithMessages : chat
                )
              );
            }
          } else {
            const updatedChat = {
              ...currentChat,
              messages: [...currentChat.messages, userMessage, errorMessage],
              updatedAt: new Date().toISOString()
            };
            setCurrentChat(updatedChat);
            if (setChats) {
              setChats(prevChats => 
                prevChats.map(chat => 
                  chat.id === currentChat.id ? updatedChat : chat
                )
              );
            }
          }
        }
        
        console.log('[ChatView] 🤖 COMPANION ERROR HANDLED - EXITING (no normal processing)');
        return; // Don't continue with normal AI processing even on error
      }
    }
    
    // Check for @ commands (when not in companion mode or starts with @)
    console.log('[ChatView] 💻 NORMAL MODE: Not companion mode, checking for @ commands');
    if (messageText.trim().startsWith('@')) {
      console.log('[ChatView] Detected @ command:', messageText);
      try {
        console.log('[ChatView] Calling processCommand...');
        const commandResult = await processCommand(messageText.trim(), attachments, { 
          setImageGenerationProgress,
          companionMode
        });
        console.log('[ChatView] Command result:', commandResult);
        
        if (commandResult) {
          console.log('[ChatView] Creating messages for command result');
          // Create user message
          const userMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            role: 'user',
            content: messageText.trim(),
            timestamp: new Date().toISOString()
          };
          
          // Create system response with image support
          const systemMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            role: 'assistant',
            content: commandResult.content,
            timestamp: new Date().toISOString(),
            // Add image URL if present
            ...(commandResult.imageUrl && { imageUrl: commandResult.imageUrl })
          };
          
          console.log('[ChatView] User message:', userMessage);
          console.log('[ChatView] System message:', systemMessage);
          console.log('[ChatView] Command result had imageUrl?', !!commandResult.imageUrl, commandResult.imageUrl);
          
          // Handle project context
          if (projectId && updateProject) {
            const currentMessages = Array.isArray(messages) ? messages : [];
            const updatedMessages = [...currentMessages, userMessage, systemMessage];
            setLocalProjectMessages(updatedMessages);
            updateProject(projectId, { 
              messages: updatedMessages,
              lastUpdated: new Date().toISOString()
            });
          } else {
            // Handle regular chat context
            if (!currentChat) {
              const newChat = createNewChat('New Chat', theme?.name || 'dark', messageText.trim());
              const chatWithMessages = {
                ...newChat,
                messages: [userMessage, systemMessage],
                updatedAt: new Date().toISOString()
              };
              setCurrentChat(chatWithMessages);
              if (setChats) {
                setChats(prevChats => 
                  prevChats.map(chat => 
                    chat.id === newChat.id ? chatWithMessages : chat
                  )
                );
              }
            } else {
              const updatedChat = {
                ...currentChat,
                messages: [...currentChat.messages, userMessage, systemMessage],
                updatedAt: new Date().toISOString()
              };
              setCurrentChat(updatedChat);
              if (setChats) {
                setChats(prevChats => 
                  prevChats.map(chat => 
                    chat.id === currentChat.id ? updatedChat : chat
                  )
                );
              }
            }
          }
          
          // Don't continue with normal AI processing
          return;
        } else {
          console.log('[ChatView] Command returned null or undefined');
        }
      } catch (error) {
        console.error('[ChatView] Error processing command:', error);
        console.error('[ChatView] Error stack:', error.stack);
        
        // Show error to user
        const userMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          role: 'user',
          content: messageText.trim(),
          timestamp: new Date().toISOString()
        };
        
        const errorMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          role: 'assistant',
          content: `Error processing command: ${error.message}`,
          timestamp: new Date().toISOString()
        };
        
        // Update messages to show the error
        if (projectId && updateProject) {
          const currentMessages = Array.isArray(messages) ? messages : [];
          const updatedMessages = [...currentMessages, userMessage, errorMessage];
          setLocalProjectMessages(updatedMessages);
          updateProject(projectId, { 
            messages: updatedMessages,
            lastUpdated: new Date().toISOString()
          });
        } else if (currentChat) {
          const updatedChat = {
            ...currentChat,
            messages: [...currentChat.messages, userMessage, errorMessage],
            updatedAt: new Date().toISOString()
          };
          setCurrentChat(updatedChat);
          if (setChats) {
            setChats(prevChats => 
              prevChats.map(chat => 
                chat.id === currentChat.id ? updatedChat : chat
              )
            );
          }
        }
        
        return; // Don't continue with normal processing
      }
    }
    
    console.log('[ChatView] 💻 NORMAL STREAMING MODE: Starting message processing (no companion/commands)');
    
    // Create message IDs first
    const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Set streaming state
    const startTime = performance.now();
    isStreamingRef.current = true;
    window.__isStreaming = true;
    console.log('[ChatView] Setting window.__isStreaming = true');
    streamingManager.startStreaming(assistantMessageId, projectId);
    
    // Update UI state
    setIsStreaming(true);
    setStreamStart(startTime);
    setTokenRate(0);
    setMessageTime(0);
    resetTokenCount();
    
    // Reset error handling
    errorHandledRef.current = false;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    
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
    
    // Calculate input tokens
    const inputTokens = Math.ceil(userMessage.content.length / 4); // Rough estimate
    updateTokenCount({ input: inputTokens });
    
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
          
          // The createNewChat function already adds the chat to the chats array
          // We just need to update it with messages
          const chatWithMessages = {
            ...newChat,
            messages: [userMessage, assistantMessage],
            updatedAt: new Date().toISOString()
          };
          
          // Update current chat with messages
          setCurrentChat(chatWithMessages);
          
          // Update the existing chat in the array with the messages
          // Delay the update slightly to prevent immediate re-renders
          if (setChats) {
            setTimeout(() => {
              setChats(prevChats => 
                prevChats.map(chat => 
                  chat.id === newChat.id ? chatWithMessages : chat
                )
              );
            }, 100);
          }
        } else {
          // Add both messages to existing chat
          console.log('handleSendMessage: Adding messages to existing chat');
          
          // Check if this is the first message and update title
          const isFirstMessage = currentChat.messages.length === 0;
          const description = isFirstMessage ? generateChatDescription(messageText.trim()) : currentChat.description;
          const title = isFirstMessage ? description : currentChat.title;
          
          const updatedChat = {
            ...currentChat,
            messages: [...currentChat.messages, userMessage, assistantMessage],
            updatedAt: new Date().toISOString(),
            title: title,
            description: description
          };
          setCurrentChat(updatedChat);
          
          // Also update chats array
          if (setChats) {
            setChats(prevChats => 
              prevChats.map(chat => 
                chat.id === currentChat.id ? updatedChat : chat
              )
            );
          }
        }
        
        // Start streaming the response
        await streamAssistantResponse(assistantMessageId, messageText, startTime);
      }
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      handleStreamError(error, startTime);
    } finally {
      // Don't immediately stop streaming - let the completion callback handle it
      console.log('[ChatView] handleSendMessage finally block - streaming should be handled by completion callback');
      
      // The project saving and cleanup is now handled in the streaming completion callback
      // This finally block should not interfere with active streaming
    }
  };
  const streamAssistantResponse = async (assistantMessageId, userMessage, startTime) => {
    // Get project knowledge files if in project context
    let contextMessage = userMessage;
    if (projectId && project && project.knowledgeFiles && project.knowledgeFiles.length > 0) {
      console.log('[ChatView] Adding project knowledge files to context:', project.knowledgeFiles.length);
      console.log('[ChatView] Knowledge files:', project.knowledgeFiles.map(f => ({
        name: f.name,
        isText: f.isText,
        isManual: f.isManual,
        hasContent: !!f.content,
        contentLength: f.content ? f.content.length : 0,
        extractedTextLength: f.extractedText ? f.extractedText.length : 0
      })));
      
      // Build context with knowledge files
      let knowledgeContext = "\n\n--- PROJECT KNOWLEDGE FILES ---\n";
      
      for (const file of project.knowledgeFiles) {
        knowledgeContext += `\n### File: ${file.name}\n`;
        
        // Check if content is already extracted as text (including manual entries)
        if (file.isText || file.isManual) {
          // Direct text content
          console.log(`[ChatView] Adding text content for ${file.name}, length: ${file.content?.length}`);
          knowledgeContext += file.content || '[No content]';
        } else if (file.content && file.content.startsWith('data:')) {
          // It's a base64 encoded file
          const [header, base64Content] = file.content.split(',');
          
          if (file.isPDF || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            // For PDFs, include extracted text if available
            knowledgeContext += `[PDF Document - ${formatFileSize(file.size)}]\n`;
            
            if (file.extractedText && file.extractedText.trim().length > 0) {
              // We have extracted text from the PDF
              knowledgeContext += `Content extracted from PDF:\n`;
              knowledgeContext += file.extractedText;
              knowledgeContext += `\n[End of PDF content]\n`;
            } else {
              // Fallback if text extraction failed
              knowledgeContext += `Note: This is a PDF file named "${file.name}". `;
              knowledgeContext += `The text content could not be extracted automatically. `;
              knowledgeContext += `The PDF might contain scanned images, be encrypted, or use a complex format. `;
              knowledgeContext += `You can describe its contents or ask me questions assuming you've read it.\n`;
            }
          } else if (file.type && file.type.startsWith('image/')) {
            // For images, provide detailed context
            knowledgeContext += `[Image file - ${file.type} - ${formatFileSize(file.size)}]\n`;
            knowledgeContext += `Note: This is an image file named "${file.name}". `;
            knowledgeContext += `You can describe what's in the image or ask me to help with tasks related to it.\n`;
          } else {
            // Try to decode if it might be text
            try {
              const decodedContent = atob(base64Content);
              // Check if it's valid UTF-8 text
              if (/^[\x00-\x7F]*$/.test(decodedContent)) {
                knowledgeContext += decodedContent;
              } else {
                knowledgeContext += `[Binary file - ${file.type || 'unknown type'} - ${formatFileSize(file.size)}]\n`;
                knowledgeContext += `Note: This is a binary file that cannot be displayed as text.\n`;
              }
            } catch (e) {
              knowledgeContext += `[Binary file - ${file.type || 'unknown type'} - ${formatFileSize(file.size)}]\n`;
              knowledgeContext += `Note: This file cannot be decoded as text.\n`;
            }
          }
        } else {
          // Fallback for any other content format
          knowledgeContext += file.content || '[No content available]';
        }
        knowledgeContext += "\n";
      }
      
      knowledgeContext += "\n--- END OF PROJECT KNOWLEDGE FILES ---\n\n";
      
      // Prepend knowledge context to user message
      contextMessage = knowledgeContext + "User message: " + userMessage;
      
      console.log('[ChatView] Context message length:', contextMessage.length);
    }
    // Set up watchdog timer to detect stuck streams
    let lastContentLength = 0;
    let watchdogTimer = null;
    let noProgressCount = 0;
    const WATCHDOG_ENABLED = true; // Set to false to disable watchdog completely
    const WATCHDOG_INTERVAL = 30000; // 30 seconds - check less frequently
    const MAX_NO_PROGRESS_COUNT = 10; // Allow 5 minutes total
    
    const startWatchdog = () => {
      if (!WATCHDOG_ENABLED) {
        console.log('[ChatView] Watchdog is disabled');
        return;
      }
      
      // Clear any existing watchdog
      if (watchdogTimer) {
        clearInterval(watchdogTimer);
      }
      
      watchdogTimer = setInterval(() => {
        const currentLength = window.__streamingContent?.length || 0;
        const currentContent = window.__streamingContent || '';
        
        if (window.__isStreaming && currentLength === lastContentLength) {
          noProgressCount++;
          console.warn(`[ChatView] No new content for ${noProgressCount * 30}s, content length: ${currentLength}`);
          
          // Check if we're in the middle of thinking
          const isThinking = currentContent.includes('<think>') && !currentContent.includes('</think>');
          
          if (noProgressCount >= MAX_NO_PROGRESS_COUNT || (!isThinking && noProgressCount >= 2)) {
            console.error('[ChatView] Stream timeout after', noProgressCount * 30, 'seconds');
            
            // Stop the watchdog immediately to prevent multiple triggers
            clearInterval(watchdogTimer);
            watchdogTimer = null;
            
            // Force complete the stream with current content
            if (currentLength > 0) {
              const content = window.__streamingContent;
              console.log('[ChatView] Forcing stream completion with content:', currentLength);
            
            // Clean up streaming state
            window.__isStreaming = false;
            setIsStreaming(false);
            
            // Update message with current content
            if (projectId) {
              setLocalProjectMessages(currentMessages => {
                return currentMessages.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: content + '\n\n[Stream timeout]', isStreaming: false }
                    : msg
                );
              });
            } else {
              setCurrentChat(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  messages: prev.messages.map(msg => 
                    msg.id === assistantMessageId
                      ? { ...msg, content: content + '\n\n[Stream timeout]', isStreaming: false }
                      : msg
                  )
                };
              });
            }
          } else {
            // No content received at all - mark as failed
            console.error('[ChatView] Stream timeout with no content received');
            
            const errorMessage = 'Failed to get response from model. Please try again.';
            
            // Update message with error
            if (projectId) {
              setLocalProjectMessages(currentMessages => {
                return currentMessages.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: errorMessage, isStreaming: false }
                    : msg
                );
              });
            } else {
              setCurrentChat(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  messages: prev.messages.map(msg => 
                    msg.id === assistantMessageId
                      ? { ...msg, content: errorMessage, isStreaming: false }
                      : msg
                  )
                };
              });
            }
          }
          }
        } else {
          // Progress was made, reset counter
          noProgressCount = 0;
        }
        lastContentLength = currentLength;
      }, WATCHDOG_INTERVAL);
    };
    
    const stopWatchdog = () => {
      if (watchdogTimer) {
        clearInterval(watchdogTimer);
        watchdogTimer = null;
      }
    };
    console.log('streamAssistantResponse called with assistantMessageId:', assistantMessageId);
    
    // Don't clear content here - it's already set up in handleSendMessage
    // Just verify the state
    console.log('[streamAssistantResponse] Current streaming state:', {
      isStreaming: window.__isStreaming,
      messageId: window.__streamingMessageId,
      contentLength: window.__streamingContent?.length || 0,
      assistantMessageId,
      messagesLength: messages.length,
      lastMessageId: messages[messages.length - 1]?.id
    });
    
    console.log('[streamAssistantResponse] Starting simple streaming');
    
    // Start watchdog timer
    startWatchdog();
    
    try {
      // Use simple streaming service
      await simpleStreamingService.streamChat(
        contextMessage,
        currentModel || 'deepseek-r1:8b-m4',
        // onChunk callback
        (newContent, fullContent) => {
          console.log('[ChatView] onChunk callback fired:', {
            newContentLength: newContent.length,
            fullContentLength: fullContent.length,
            isMounted: isMountedRef.current,
            currentStreamingContent: streamingContent.length
          });
          
          // Check if ANY ChatView is still active (handles Electron re-renders)
          const hasActiveChatView = window.__activeChatViews && window.__activeChatViews.size > 0;
          if (!isMountedRef.current && !hasActiveChatView) {
            console.warn('[ChatView] No active ChatView components, skipping update');
            return;
          }
          
          // Update refs and window variables
          streamingContentRef.current = fullContent;
          window.__streamingContent = fullContent;
          
          // Dispatch event for streaming update
          window.dispatchEvent(new CustomEvent('streamingUpdate', {
            detail: { messageId: assistantMessageId, content: fullContent }
          }));
          
          // Debounce updates to prevent too many re-renders
          // Update every 200ms at most to reduce re-render frequency
          if (!window.__lastStreamUpdate || Date.now() - window.__lastStreamUpdate > 200) {
            window.__lastStreamUpdate = Date.now();
            
            // Update state if ANY ChatView is active and streaming is active
            const hasActiveChatView = window.__activeChatViews && window.__activeChatViews.size > 0;
            if ((isMountedRef.current || hasActiveChatView) && window.__isStreaming) {
              // Wrap in try-catch to prevent errors from breaking streaming
              try {
                // Update React state to trigger re-render
                setStreamingContent(fullContent);
                console.log('[ChatView] Setting streaming content:', fullContent.length, 'Active views:', window.__activeChatViews?.size || 0);
              } catch (updateError) {
                console.error('[ChatView] Error updating streaming content:', updateError);
              }
            }
          }
          
          // Update token count
          const estimatedTokens = Math.ceil(fullContent.length / 4); // Rough estimate
          updateTokenCount({ output: estimatedTokens });
          
          // Force a small delay to ensure window variable is set before hooks read it
          setTimeout(() => {
            window.__streamingContent = fullContent;
          }, 0);
          
          // Dispatch custom event for components that need updates
          window.dispatchEvent(new CustomEvent('streamingUpdate', { 
            detail: { messageId: assistantMessageId, content: fullContent } 
          }));
          
          // Force update the messages
          if (projectId) {
            setLocalProjectMessages(currentMessages => {
              return currentMessages.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: fullContent, isStreaming: true }
                  : msg
              );
            });
          } else {
            // Update regular chat messages
            setCurrentChat(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: prev.messages.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent, isStreaming: true }
                    : msg
                )
              };
            });
          }
          
          console.log('[streamAssistantResponse] Content update:', {
            newLength: newContent.length,
            totalLength: fullContent.length
          });
        },
        // onComplete callback
        (finalContent) => {
          // Stop watchdog timer
          stopWatchdog();
          
          console.log('[streamAssistantResponse] Stream complete:', {
            finalLength: finalContent.length,
            messageId: assistantMessageId,
            isStillStreaming: window.__isStreaming,
            preview: typeof finalContent === 'string' ? finalContent.substring(0, 100) : 'N/A'
          });
          
          // Ensure we have content
          if (!finalContent || finalContent.length === 0) {
            console.warn('[streamAssistantResponse] Stream completed with no content!');
          }
          
          // Update the message with final content
          console.log('[streamAssistantResponse] Updating message with final content');
          
          if (projectId) {
            setLocalProjectMessages(currentMessages => {
              const updated = currentMessages.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: finalContent, isStreaming: false }
                  : msg
              );
              console.log('[streamAssistantResponse] Updated project messages:', updated.length);
              return updated;
            });
          } else {
            setCurrentChat(prev => {
              if (!prev) {
                console.error('[streamAssistantResponse] No current chat to update!');
                return prev;
              }
              const updated = {
                ...prev,
                messages: prev.messages.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: finalContent, isStreaming: false }
                    : msg
                )
              };
              console.log('[streamAssistantResponse] Updated chat messages:', updated.messages.length);
              
              // Immediately save to chats array
              if (setChats) {
                setChats(prevChats => 
                  prevChats.map(chat => 
                    chat.id === prev.id ? updated : chat
                  )
                );
              }
              
              return updated;
            });
          }
          
          // Immediately disable streaming to re-enable input
          isStreamingRef.current = false;
          window.__isStreaming = false;
          setIsStreaming(false);
          
          // Clean up other state - but delay slightly to ensure UI updates complete
          setTimeout(() => {
            setStreamStart(null);
            
            // Dispatch completion event
            window.dispatchEvent(new CustomEvent('streamingComplete', {
              detail: { messageId: assistantMessageId, content: finalContent }
            }));
            
            // Calculate duration
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000;
            setMessageTime(duration);
            
            // Force immediate focus restoration using querySelector as backup
            console.log('[ChatView] Attempting immediate focus restoration');
            
            const focusInput = () => {
              // Try ref first
              if (chatInputRef.current && chatInputRef.current.focus) {
                chatInputRef.current.focus();
                console.log('[ChatView] Focused using ref');
                return true;
              }
              
              // Fallback to querySelector
              const textarea = document.querySelector('textarea[placeholder="Type a message..."]');
              if (textarea) {
                textarea.focus();
                console.log('[ChatView] Focused using querySelector');
                return true;
              }
              
              return false;
            };
            
            // Try immediately
            focusInput();
            
            // Try again after short delay
            setTimeout(focusInput, 100);
            
            // And once more after longer delay
            setTimeout(focusInput, 300);
            
            // Auto-speak the response if enabled (but NOT in companion mode - CompanionService handles voice)
            console.log('[ChatView] 🔊 Checking auto-speak for normal mode. companionMode:', companionMode);
            if (!companionMode) {
              setTimeout(() => {
                const savedSettings = localStorage.getItem('sephia_voice_settings');
                if (savedSettings) {
                  try {
                    const voiceSettings = JSON.parse(savedSettings);
                    if (voiceSettings.autoSpeak && voiceSettings.voiceEnabled) {
                      console.log('[ChatView] Auto-speak enabled, triggering voice synthesis (non-companion mode)');
                    
                      // Import voice service dynamically
                      import('../../services/VoiceService').then(({ default: voiceService }) => {
                      // VoiceService automatically detects provider from user settings
                      const provider = voiceSettings.voiceSynthesisProvider || 'browser';
                      console.log('[ChatView] Using voice provider:', provider);
                      
                      // CRITICAL: Apply Aria identity filtering BEFORE voice generation
                      let identityCleanedContent = finalContent
                        // ULTRA-AGGRESSIVE identity replacement for voice
                        .replace(/I'm Qwen/gi, "I'm Aria")
                        .replace(/I am Qwen/gi, "I am Aria") 
                        .replace(/My name is Qwen/gi, "My name is Aria")
                        .replace(/Hello! I'm Qwen/gi, "Hello! I'm Aria")
                        .replace(/Hi! I'm Qwen/gi, "Hi! I'm Aria")
                        .replace(/I'm Qwen3/gi, "I'm Aria")
                        .replace(/I am Qwen3/gi, "I am Aria")
                        .replace(/My name is Qwen3/gi, "My name is Aria")
                        .replace(/Hello! I'm Qwen3/gi, "Hello! I'm Aria")
                        .replace(/Hi! I'm Qwen3/gi, "Hi! I'm Aria")
                        .replace(/I'm Monica/gi, "I'm Aria")
                        .replace(/I am Monica/gi, "I am Aria")
                        .replace(/My name is Monica/gi, "My name is Aria")
                        .replace(/Hello! I'm Monica/gi, "Hello! I'm Aria")
                        .replace(/Hi! I'm Monica/gi, "Hi! I'm Aria")
                        .replace(/\bQwen\b/gi, "Aria")
                        .replace(/\bQwen3\b/gi, "Aria")
                        .replace(/\bMonica\b/gi, "Aria");

                      // Nuclear option for voice: If any wrong identity remains, replace with clean Aria intro
                      if (identityCleanedContent.toLowerCase().includes('qwen') || 
                          identityCleanedContent.toLowerCase().includes('monica') ||
                          identityCleanedContent.toLowerCase().match(/i('m| am) (?!aria)/i)) {
                        identityCleanedContent = "Hi! I'm Aria, your AI assistant. I'm here to help you with questions, tasks, and conversations.";
                      }

                      // Clean content for speaking (remove thinking process and markdown)
                      const cleanContent = identityCleanedContent
                        .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove tagged thinking process
                        // Remove exposed thinking patterns (common AI reasoning patterns)
                        .replace(/^(Okay, the user asked me to|First, I should|Let me think about|I should|Maybe|Wait, did I|I think|Okay, I think)[\s\S]*?(?=Hello!|Hi!|I'm|My name|Welcome)/i, '') 
                        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
                        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
                        .replace(/`(.*?)`/g, '$1') // Remove code markdown
                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
                        .replace(/#{1,6}\s/g, '') // Remove markdown headers
                        .replace(/\n+/g, '. ') // Replace newlines with pauses
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .trim();
                      
                      if (cleanContent && cleanContent.length > 0) {
                        console.log('[ChatView] Speaking response with', provider, 'provider:', cleanContent.substring(0, 100) + '...');
                        voiceService.speak(cleanContent, {
                          onStart: () => console.log('[ChatView] ✅ Auto-speak started with', provider),
                          onEnd: () => console.log('[ChatView] ✅ Auto-speak completed with', provider),
                          onError: (error) => console.warn('[ChatView] ⚠️ Auto-speak failed with', provider, ':', error)
                        });
                      } else {
                        console.warn('[ChatView] ⚠️ No content to speak after cleaning');
                      }
                      }).catch(error => {
                        console.error('[ChatView] ❌ Failed to load voice service:', error);
                      });
                    } else {
                      console.log('[ChatView] Auto-speak disabled in settings');
                    }
                } catch (error) {
                  console.error('[ChatView] ❌ Error checking auto-speak settings:', error);
                }
              } // Close if (savedSettings)
              }, 300); // Small delay to ensure message is saved
            }
            
            // Clear streaming content AFTER everything is saved
            setTimeout(() => {
              console.log('[streamAssistantResponse] Clearing streaming state');
              setStreamingMessageId(null);
              setStreamingContent('');
              window.__streamingMessageId = null;
              window.__streamingContent = '';
            }, 500); // Give time for saves to complete
            
            // Save to project if we have pending save
            if (projectId && pendingProjectSaveRef.current) {
              console.log('[streamAssistantResponse] Saving completed message to project');
              const { messages: savedMessages } = pendingProjectSaveRef.current;
              const finalMessages = savedMessages.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: finalContent, isStreaming: false }
                  : msg
              );
              
              updateProject(projectId, { 
                messages: finalMessages,
                lastUpdated: new Date().toISOString()
              });
              
              // Clear pending save
              pendingProjectSaveRef.current = null;
              
              // Clear streaming buffer
              window.__streamingBuffer = {
                projectId: null,
                messages: [],
                isActive: false
              };
            } else if (!projectId && currentChat) {
              // Already saved in the onComplete callback - just log
              console.log('[streamAssistantResponse] Chat already updated in onComplete');
            }
            
            console.log('[streamAssistantResponse] Streaming cleanup complete');
          }, 100);
        },
        // onError callback
        (error) => {
          // Stop watchdog timer
          stopWatchdog();
          
          console.error('[streamAssistantResponse] Stream error:', error);
          
          // Save partial content if we have any
          const partialContent = streamingContentRef.current || window.__streamingContent || '';
          if (partialContent && partialContent.length > 0) {
            console.log('[streamAssistantResponse] Saving partial content before error:', partialContent.length);
            
            // Update the message with partial content
            if (projectId) {
              setLocalProjectMessages(currentMessages => {
                return currentMessages.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: partialContent + '\n\n[Response interrupted]', isStreaming: false }
                    : msg
                );
              });
              
              // Save to project
              if (pendingProjectSaveRef.current) {
                const { messages: savedMessages } = pendingProjectSaveRef.current;
                const finalMessages = savedMessages.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: partialContent + '\n\n[Response interrupted]', isStreaming: false }
                    : msg
                );
                
                updateProject(projectId, { 
                  messages: finalMessages,
                  lastUpdated: new Date().toISOString()
                });
              }
            } else if (currentChat) {
              // Update chat with partial content
              const updatedChat = {
                ...currentChat,
                messages: currentChat.messages.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: partialContent + '\n\n[Response interrupted]', isStreaming: false }
                    : msg
                ),
                updatedAt: new Date().toISOString()
              };
              
              setCurrentChat(updatedChat);
              if (setChats) {
                setChats(prevChats => 
                  prevChats.map(chat => 
                    chat.id === currentChat.id ? updatedChat : chat
                  )
                );
              }
            }
          }
          
          handleStreamError(error, startTime);
        }
      );
    } catch (error) {
      console.error('[streamAssistantResponse] Unexpected error:', error);
      
      // Clean up streaming state on any error
      isStreamingRef.current = false;
      window.__isStreaming = false;
      setIsStreaming(false);
      setStreamingMessageId(null);
      setStreamingContent('');
      window.__streamingMessageId = null;
      window.__streamingContent = '';
      
      handleStreamError(error, startTime);
    }
  };
  
  // REMOVED OLD STREAMING CODE - using SimpleStreamingService now
  
  const handleInterruptStream = () => {
    console.log('Interrupting stream...');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Stop streaming immediately
    isStreamingRef.current = false;
    window.__isStreaming = false;
    streamingManager.stopStreaming();
    
    // Update UI state
    setIsStreaming(false);
    setStreamStart(null);
    setTokenRate(0);
  };
  
  const handleStreamError = (error, startTime) => {
    console.error('[ChatView] handleStreamError called:', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      isStreaming: isStreamingRef.current,
      streamingMessageId: window.__streamingMessageId,
      streamingContent: window.__streamingContent?.length || 0
    });
    
    // Don't update state if component is unmounting
    if (!isMountedRef.current) {
      console.log('[ChatView] Component unmounted, skipping error handling');
      return;
    }
    
    // Mark error as handled
    if (errorHandledRef.current) {
      console.log('[ChatView] Error already handled, skipping');
      return;
    }
    errorHandledRef.current = true;
    
    const errorEndTime = performance.now();
    const errorDuration = (errorEndTime - startTime) / 1000;
    
    // Debounce the error handling to prevent multiple updates
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    errorTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      setMessageTime(errorDuration);
      
      // Restore focus to input after error
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
          console.log('[ChatView] Restored focus to input after error');
        }
      }, 100);
      
      const errorContent = error.message === 'No model selected' 
        ? 'No model is currently selected. Please select a model from the sidebar.'
        : error.name === 'AbortError' 
        ? 'Response generation was interrupted.'
        : `Sorry, there was an error generating a response: ${error.message}. Please check that Ollama is running and try again.`;
      
      console.error('[ChatView] Stream error details:', {
        error: error.message,
        stack: error.stack,
        isStreaming: isStreamingRef.current,
        projectId,
        errorContent
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
    }, 100); // Small delay to ensure state is stable
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

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format token count to show k for thousands
  const formatTokenCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Render empty state when no chat is selected, when current chat has no messages, or when in project with no messages
  if ((!currentChat && !projectId) || (currentChat && currentChat.messages && currentChat.messages.length === 0) || (projectId && messages.length === 0)) {
    const emptyTitle = projectId ? `Welcome to ${project?.title || 'Project'}` : 'Welcome to Sephia';
    const emptyText = projectId 
      ? 'Start a conversation in this project. All messages will be saved within this project context.'
      : 'Start a new conversation with your local LLM. Sephia connects to your local models running through Ollama.';
    
    return (
      <ChatContainer>
        {/* Image Generation Progress at Top - Also show in empty state */}
        {(() => {
          console.log('[ChatView] Empty state progress bar condition check:', { 
            hasProgress: !!imageGenerationProgress, 
            progress: imageGenerationProgress,
            progressType: typeof imageGenerationProgress,
            progressKeys: imageGenerationProgress ? Object.keys(imageGenerationProgress) : null
          });
          
          if (imageGenerationProgress) {
            console.log('[ChatView] Rendering ProgressBar in empty state with props:', {
              progress: imageGenerationProgress,
              isVisible: true,
              showCancel: true,
              onCancel: !!cancelImageGeneration
            });
            return (
              <ProgressBar 
                progress={imageGenerationProgress}
                isVisible={true}
                showCancel={true}
                onCancel={cancelImageGeneration}
              />
            );
          } else {
            console.log('[ChatView] Not rendering ProgressBar in empty state - no progress data');
            return null;
          }
        })()}
        
        <EmptyState theme={theme}>
          <IconWrapper theme={theme}>
            <BrainLightningIcon size={60} />
          </IconWrapper>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <EmptyStateTitle theme={theme}>{emptyTitle}</EmptyStateTitle>
            <EmptyStateDescription theme={theme}>{emptyText}</EmptyStateDescription>
          </div>
        </EmptyState>
        
        <div style={{ marginTop: 'auto' }}>
          <StatusBar theme={theme}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              flex: 1,
              justifyContent: 'center',
              padding: '0 16px'
            }}>
              <span>0s · 0 tokens</span>
            </div>
            <ModelInfo theme={theme} style={{ flex: 1, justifyContent: 'center', padding: '0 16px' }}>
              <Select
                value={currentModel}
                onChange={(e) => {
                  const modelId = e.target.value;
                  console.log('[ChatView] Changing model to:', modelId);
                  loadModel(modelId);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  minWidth: '120px'
                }}
              >
                {models.map(model => (
                  <option key={model.id} value={model.id} style={{ background: '#1E1E1E', color: '#FFFFFF' }}>
                    {model.name}
                  </option>
                ))}
              </Select>
              <span>Ready</span>
            </ModelInfo>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              flex: 1,
              justifyContent: 'center',
              padding: '0 16px'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={companionMode}
                  onChange={(e) => setCompanionMode(e.target.checked)}
                  style={{
                    marginRight: '4px',
                    transform: 'scale(0.9)'
                  }}
                />
                🤖 Aria Companion
              </label>
            </div>
          </StatusBar>
          <ChatInput ref={chatInputRef} onSendMessage={handleSendMessage} disabled={isStreaming} />
        </div>
      </ChatContainer>
    );
  }

  // Render chat interface when a chat is selected or in project context
  return (
    <ChatContainer>
      {/* Image Generation Progress at Top */}
      {(() => {
        console.log('[ChatView] Progress bar condition check:', { 
          hasProgress: !!imageGenerationProgress, 
          progress: imageGenerationProgress,
          progressType: typeof imageGenerationProgress,
          progressKeys: imageGenerationProgress ? Object.keys(imageGenerationProgress) : null
        });
        
        if (imageGenerationProgress) {
          console.log('[ChatView] Rendering ProgressBar with props:', {
            progress: imageGenerationProgress,
            isVisible: true,
            showCancel: true,
            onCancel: !!cancelImageGeneration
          });
          return (
            <ProgressBar 
              progress={imageGenerationProgress}
              isVisible={true}
              showCancel={true}
              onCancel={cancelImageGeneration}
            />
          );
        } else {
          console.log('[ChatView] Not rendering ProgressBar - no progress data');
          return null;
        }
      })()}
      
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MessageList 
          messages={messages}
          onDeleteMessage={handleDeleteMessage}
        />
      </div>
      
      <div style={{ marginTop: 'auto' }}>
        <StatusBar theme={theme}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            flex: 1,
            justifyContent: 'center',
            padding: '0 16px'
          }}>
            {isStreaming ? (
              <span>
                {Math.round(messageDuration)}s · {formatTokenCount(tokenCount.output || 0)} tokens · esc to interrupt
              </span>
            ) : (
              <>
                <span>{Math.round(messageDuration)}s</span>
                <span style={{ opacity: 0.7 }}>•</span>
                <span>{formatTokenCount(tokenCount.output || 0)} tokens</span>
              </>
            )}
          </div>
          <ModelInfo theme={theme} style={{ flex: 1, justifyContent: 'center', padding: '0 16px' }}>
            <Select
              value={currentModel}
              onChange={(e) => {
                const modelId = e.target.value;
                console.log('[ChatView] Changing model to:', modelId);
                loadModel(modelId);
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                minWidth: '120px'
              }}
              disabled={isStreaming}
            >
              {models.map(model => (
                <option key={model.id} value={model.id} style={{ background: '#1E1E1E', color: '#FFFFFF' }}>
                  {model.name}
                </option>
              ))}
            </Select>
            <span>{isStreaming ? 'Generating...' : 'Ready'}</span>
          </ModelInfo>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            flex: 1,
            justifyContent: 'center',
            padding: '0 16px'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={companionMode}
                onChange={(e) => setCompanionMode(e.target.checked)}
                style={{
                  marginRight: '4px',
                  transform: 'scale(0.9)'
                }}
              />
              🤖 Aria Companion
            </label>
          </div>
        </StatusBar>
        <ChatInput ref={chatInputRef} onSendMessage={handleSendMessage} disabled={isStreaming} />
      </div>
    </ChatContainer>
  );
}, arePropsEqual);

// Memoize ChatView wrapper to prevent unnecessary re-renders
const ChatViewWithErrorBoundary = React.memo(({ projectId }) => {
  return (
    <ErrorBoundary>
      <ChatView projectId={projectId} />
    </ErrorBoundary>
  );
}, (prevProps, nextProps) => {
  // Only re-render if projectId changes
  return prevProps.projectId === nextProps.projectId;
});

export default ChatViewWithErrorBoundary;

export { ChatView };