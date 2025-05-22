import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  styled,
  keyframes,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { useApp } from '../context/AppContext';
import CodeBlock from './CodeBlock';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import Avatar from '@mui/material/Avatar';

// Default profile picture (you can replace this with your actual profile picture URL)
const defaultProfilePic = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
// Model icon (you can replace this with your preferred model icon)
const modelIcon = 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png';

// Styled components with performance optimizations
const MessageBubble = styled('div', {
  shouldForwardProp: (prop) => prop !== 'isUser',
})(({ theme, isUser }) => ({
  maxWidth: '85%',
  margin: '4px 0',
  padding: '12px 16px',
  borderRadius: (theme.shape?.borderRadius || 4) * 2,
  backgroundColor: isUser 
    ? theme.palette?.primary?.main || '#1976d2'
    : theme.palette?.grey?.[200] || '#f5f5f5',
  color: isUser ? (theme.palette?.primary?.contrastText || '#fff') : (theme.palette?.text?.primary || '#000'),
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  position: 'relative',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  boxShadow: theme.shadows?.[1] || '0px 2px 1px -1px rgba(0,0,0,0.2)',
  '&:first-of-type': { marginTop: '8px' },
  '&:last-of-type': { marginBottom: '8px' },
  '&:hover': {
    boxShadow: theme.shadows[2],
  },
  transition: 'all 0.2s ease-in-out',
  willChange: 'transform, opacity',
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  perspective: '1000px',
  animation: `${keyframes`
    0% { opacity: 0; transform: translateY(10px) translateZ(0); }
    100% { opacity: 1; transform: translateY(0) translateZ(0); }
  `} 0.3s ease-out forwards`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'opacity 0.3s ease',
  },
}));

// Enhanced typing indicator with distinct colors
const TypingIndicator = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '14px 18px',
  backgroundColor: '#e3f2fd',
  borderRadius: '24px',
  width: 'fit-content',
  margin: '12px 0',
  '& > div': {
    width: 10,
    height: 10,
    borderRadius: '50%',
    animation: 'typing 1.8s infinite ease-in-out',
    '&:nth-of-type(1)': { 
      backgroundColor: '#7986cb',
      animationDelay: '0s' 
    },
    '&:nth-of-type(2)': { 
      backgroundColor: '#5c6bc0',
      animationDelay: '0.3s' 
    },
    '&:nth-of-type(3)': { 
      backgroundColor: '#3f51b5',
      animationDelay: '0.6s' 
    },
  },
  '@keyframes typing': {
    '0%, 80%, 100%': { 
      transform: 'translateY(0) scale(1)',
      opacity: 0.7
    },
    '40%': { 
      transform: 'translateY(-8px) scale(1.2)',
      opacity: 1
    },
  },
});

// Generate a description from the first message content (simplified version)
const generateChatTitle = (message) => {
  if (!message) return 'New chat';
  
  try {
    let text = typeof message === 'string' ? message : message.content || message.text || '';
    
    if (!text || typeof text !== 'string') {
      return 'New chat';
    }
    
    // Clean up the text for the description
    let description = text.trim()
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '')        // Remove inline code
      .replace(/[#*_~]/g, '')         // Remove markdown formatting
      .replace(/\n+/g, ' ')           // Replace newlines with spaces
      .replace(/\s+/g, ' ')           // Collapse multiple spaces
      .trim();
    
    // Truncate if needed (shorter for mobile, longer for desktop)
    const maxLength = window.innerWidth < 768 ? 30 : 50;
    if (description.length > maxLength) {
      // Try to truncate at a word boundary
      const truncated = description.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      
      if (lastSpace > 0 && (maxLength - lastSpace) < 10) {
        description = truncated.substring(0, lastSpace);
      } else {
        description = truncated;
      }
      
      // Add ellipsis if we truncated
      if (description.length < text.length) {
        description += '...';
      }
    }
    
    return description || 'New chat';
    
  } catch (error) {
    console.error('Error generating chat title:', error);
    return 'New chat';
  }
};

// SimpleChat component with forced styles
const SimpleChat = () => {
  // App context for chat state
  const { currentChat, setCurrentChat, createNewChat, currentModel, models, setChats, streamMessage } = useApp();
  
  // Theme and responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageListRef = useRef(null);
  
  // Function to detect and render code blocks
  const renderMessageContent = (text) => {
    // Simple regex to detect code blocks between ```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add the code block
      const [, language, code] = match;
      parts.push({
        type: 'code',
        language: language || 'javascript',
        content: code.trim()
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last code block
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  };

  // State for tracking copied status of each message
  const [copiedMessages, setCopiedMessages] = useState({});

  // Handle copying message text
  const handleCopyMessage = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessages(prev => ({
        ...prev,
        [messageId]: true
      }));
      
      // Reset the copied status after 2 seconds
      setTimeout(() => {
        setCopiedMessages(prev => ({
          ...prev,
          [messageId]: false
        }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Use messages from current chat or show welcome message
  const messages = useMemo(() => {
    if (currentChat && currentChat.messages && currentChat.messages.length > 0) {
      // Convert AppContext message format to SimpleChat format
      return currentChat.messages.map(msg => ({
        id: msg.id,
        text: msg.content || msg.text || '',
        isUser: msg.role === 'user',
        timestamp: msg.timestamp
      }));
    } else {
      // Default welcome message when no chat is selected
      return [{
        id: Date.now(),
        text: 'Hello! I\'m your AI assistant. How can I help you today?',
        isUser: false,
        timestamp: new Date().toISOString()
      }];
    }
  }, [currentChat]);

  // Local state for UI
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [modelIcon, setModelIcon] = useState(<SmartToyIcon />);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  
  // Streaming live info state
  const [streamingInfo, setStreamingInfo] = useState({
    isStreaming: false,
    startTime: null,
    duration: 0,
    tokens: 0,
    canInterrupt: false
  });
  
  // Refs for streaming control
  const streamingIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Use selected model from context or fallback
  const selectedModel = currentModel || '';
  
  // Token estimation function (rough estimate)
  const estimateTokens = (text) => {
    // Rough estimation: 4 characters per token on average
    return Math.ceil((text || '').length / 4);
  };
  
  // Format duration for display
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };
  
  // Format token count for display
  const formatTokens = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };
  
  // Handle streaming interruption with ESC key
  const handleStreamingInterrupt = useCallback(() => {
    if (streamingInfo.isStreaming && abortControllerRef.current) {
      console.log('Interrupting stream with ESC key');
      abortControllerRef.current.abort();
      setIsTyping(false);
      
      // Update streaming info to show it was interrupted
      setStreamingInfo(prev => ({ 
        ...prev, 
        isStreaming: false, 
        canInterrupt: false 
      }));
      
      // Clear the timer
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
      
      // Show a message that streaming was interrupted
      setError('Response generation was interrupted.');
      
      // Clear error after a few seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  }, [streamingInfo.isStreaming]);
  
  // ESC key listener for interrupting streaming
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && streamingInfo.isStreaming) {
        handleStreamingInterrupt();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [streamingInfo.isStreaming, handleStreamingInterrupt]);

  // Use models from AppContext, fallback to fetch if empty
  useEffect(() => {
    if (models && models.length > 0) {
      setIsLoadingModels(false);
    } else {
      // Fallback fetch if AppContext models are empty
      const fetchModels = async () => {
        try {
          setIsLoadingModels(true);
          const response = await fetch('http://localhost:11434/api/tags');
          if (!response.ok) {
            throw new Error('Failed to fetch models');
          }
          const data = await response.json();
          
          // Don't set local state, let AppContext handle this
          console.log('Models available:', data.models);
        } catch (err) {
          console.error('Error fetching models:', err);
          setError('Failed to load models. Make sure Ollama is running.');
        } finally {
          setIsLoadingModels(false);
        }
      };

      fetchModels();
    }
  }, [models]);


  // Optimized streaming response with AppContext integration
  const streamResponse = useCallback(async (userInput, modelName) => {
    setIsTyping(true);
    setError(null);
    
    // Initialize streaming info
    const startTime = Date.now();
    setStreamingInfo({
      isStreaming: true,
      startTime,
      duration: 0,
      tokens: estimateTokens(userInput), // Start with input tokens
      canInterrupt: false
    });
    
    // Create abort controller for interruption
    abortControllerRef.current = new AbortController();
    
    
    setInput(''); // Clear input immediately
    
    let chatId = currentChat?.id;
    
    // If no current chat, create one first
    if (!currentChat) {
      const newChat = createNewChat('New Chat', 'dark', userInput);
      chatId = newChat.id;
    }
    
    // Start the duration timer
    streamingIntervalRef.current = setInterval(() => {
      setStreamingInfo(prev => ({
        ...prev,
        duration: Date.now() - startTime,
        canInterrupt: true // Allow interruption after a short delay
      }));
    }, 100); // Update every 100ms for smooth animation
    
    try {
      // Track if streaming completes normally
      let streamingCompleted = false;
      
      // Use AppContext's streamMessage function
      await streamMessage(chatId, userInput, {
        model: modelName,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk) => {
          // Update token count in real-time during streaming
          setStreamingInfo(prev => ({
            ...prev,
            tokens: prev.tokens + estimateTokens(chunk.content || '')
          }));
        },
        onComplete: () => {
          // Streaming completed successfully
          console.log('Streaming completed');
          streamingCompleted = true;
          
          // Clean up after streaming completes
          setIsTyping(false);
          
          // Keep streaming info visible for a moment before clearing
          setTimeout(() => {
            setStreamingInfo({
              isStreaming: false,
              startTime: null,
              duration: 0,
              tokens: 0,
              canInterrupt: false
            });
          }, 2000); // Keep visible for 2 seconds after completion
          
          // Clear the timer
          if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
          }
          
          // Scroll to bottom after a short delay to ensure UI is updated
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      });
      
    } catch (err) {
      console.error('Error generating response:', err);
      
      // Handle different types of errors
      if (err.name === 'AbortError') {
        setError('Response generation was interrupted.');
      } else {
        setError('Failed to generate response. Please try again.');
      }
      
      // Clean up on error
      setIsTyping(false);
      
      // Clear streaming info on error
      setStreamingInfo({
        isStreaming: false,
        startTime: null,
        duration: 0,
        tokens: 0,
        canInterrupt: false
      });
      
      // Clear the timer
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
      
      // Clear abort controller
      abortControllerRef.current = null;
    }
  }, [currentChat, createNewChat, streamMessage]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userInput = input.trim();
    streamResponse(userInput, selectedModel);
    
    // Focus input after sending message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [input, isLoading, selectedModel, streamResponse]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: theme.palette?.background?.default || '#fafafa',
        '& .message-container': {
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 0 16px',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette?.grey?.[400] || '#bdbdbd',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette?.grey?.[500] || '#9e9e9e',
          },
        },
        '& .input-container': {
          padding: '16px',
          paddingTop: 0,
          borderTop: `1px solid ${theme.palette?.divider || '#e0e0e0'}`,
          backgroundColor: theme.palette?.background?.paper || '#fff',
        },
      }}
    >
      {/* Messages */}
      <Box className="message-container" ref={messageListRef} sx={{ paddingTop: 2 }}>
        {messages.map((message) => (
          <Box 
            key={message.id}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: message.isUser ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              width: '100%',
              padding: '4px 16px',
              boxSizing: 'border-box',
            }}
          >
            {/* Avatar for AI */}
            {!message.isUser && (
              <Avatar 
                src={modelIcon}
                alt="AI Assistant"
                sx={{ 
                  width: 36, 
                  height: 36, 
                  marginRight: 1.5,
                  alignSelf: 'flex-end',
                  marginBottom: 1,
                  bgcolor: 'primary.main',
                }}
              >
                <SmartToyIcon />
              </Avatar>
            )}
            
            <MessageBubble 
              isUser={message.isUser}
              sx={{
                backgroundColor: message.isUser ? '#4a148c !important' : '#f3e5f5 !important',
                color: message.isUser ? '#ffffff !important' : '#4a148c !important',
                borderRadius: message.isUser ? '18px 18px 4px 18px !important' : '18px 18px 18px 4px !important',
                padding: '12px 16px !important',
                margin: '4px 0 !important',
                maxWidth: '75% !important',
                '&:hover': {
                  transform: 'translateY(-2px) !important',
                  boxShadow: message.isUser 
                    ? '0 6px 16px rgba(74, 20, 140, 0.4) !important' 
                    : '0 4px 12px rgba(0, 0, 0, 0.15) !important',
                },
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: 0.5 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                    color: message.isUser ? '#ffffff !important' : '#4a148c !important', 
                    fontSize: '0.85rem' 
                  }}>
                    {message.isUser ? 'You' : 'Assistant'}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: message.isUser ? '#ffffff !important' : 'rgba(74, 20, 140, 0.7) !important', 
                    fontSize: '0.7rem' 
                  }}>
                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Typography>
                </Box>
                <Tooltip 
                  title={copiedMessages[message.id] ? 'Copied!' : 'Copy message'} 
                  arrow
                  placement="top"
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyMessage(message.text, message.id);
                    }}
                    sx={{
                      color: message.isUser ? 'rgba(255, 255, 255, 0.7)' : 'rgba(74, 20, 140, 0.5)',
                      '&:hover': {
                        color: message.isUser ? '#fff' : '#4a148c',
                        backgroundColor: 'transparent'
                      },
                      padding: '4px',
                      marginRight: '-8px',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      '.MuiBox-root:hover &': {
                        opacity: 1
                      }
                    }}
                  >
                    {copiedMessages[message.id] ? 
                      <CheckIcon fontSize="small" sx={{ color: message.isUser ? '#4caf50' : '#4caf50' }} /> : 
                      <ContentCopyIcon fontSize="small" />
                    }
                  </IconButton>
                </Tooltip>
              </Box>
              {renderMessageContent(message.text).map((part, index) => {
                if (part.type === 'code') {
                  return (
                    <Box key={`code-${index}`} sx={{ my: 1 }}>
                      <CodeBlock language={part.language} value={part.content} />
                    </Box>
                  );
                }
                return (
                  <Typography key={`text-${index}`} component="span" sx={{ whiteSpace: 'pre-wrap' }}>
                    {part.content}
                  </Typography>
                );
              })}
            </MessageBubble>
          </Box>
        ))}
        {isTyping && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            width: '100%',
            padding: '4px 16px',
          }}>
            <Avatar 
              src={modelIcon}
              alt="AI Assistant"
              sx={{ 
                width: 36, 
                height: 36, 
                marginRight: 1.5,
                alignSelf: 'flex-end',
                marginBottom: 1,
                bgcolor: 'primary.main',
              }}
            >
              <SmartToyIcon />
            </Avatar>
            <MessageBubble isUser={false} sx={{
              backgroundColor: '#f3e5f5 !important',
              color: '#4a148c !important',
              borderRadius: '18px 18px 18px 4px !important',
              padding: '12px 16px !important',
              margin: '4px 0 !important',
              maxWidth: '75% !important',
              '&:hover': {
                transform: 'translateY(-2px) !important',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15) !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                  color: '#4a148c !important', 
                  fontSize: '0.85rem' 
                }}>
                  {selectedModel || 'Assistant'}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(74, 20, 140, 0.7) !important', 
                  fontSize: '0.7rem' 
                }}>
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Typography>
              </Box>
              <Box sx={{ whiteSpace: 'pre-wrap' }}>
                {renderMessageContent('```python\n# Loading response...\n```').map((part, index) => {
                  if (part.type === 'code') {
                    return (
                      <Box key={`typing-code-${index}`} sx={{ my: 1 }}>
                        <CodeBlock language={part.language} value={part.content} />
                      </Box>
                    );
                  }
                  return (
                    <Typography key={`typing-text-${index}`} component="span">
                      {part.content}
                    </Typography>
                  );
                })}
              </Box>
            </MessageBubble>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Error message */}
      {error && (
        <Box
          sx={{
            backgroundColor: theme.palette.error.dark,
            color: theme.palette.error.contrastText,
            padding: theme.spacing(1, 2),
            borderRadius: theme.shape.borderRadius,
            marginBottom: theme.spacing(2),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2">{error}</Typography>
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setError(null)}
            sx={{ marginLeft: 1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Streaming Info Indicator - Above Input */}
      {streamingInfo.isStreaming && (
        <Box
          sx={{
            backgroundColor: '#4a148c',
            color: '#fff',
            padding: '12px 16px',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            borderTop: `2px solid ${theme.palette?.divider || '#e0e0e0'}`,
            marginTop: 'auto',
            position: 'sticky',
            bottom: 0,
            zIndex: 2,
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.9 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.9 }
            }
          }}
        >
          <span>{formatDuration(streamingInfo.duration)}</span>
          <span>·</span>
          <span>{formatTokens(streamingInfo.tokens)} tokens</span>
          {streamingInfo.canInterrupt && (
            <>
              <span>·</span>
              <span style={{ fontSize: '0.8em', opacity: 0.9 }}>esc to interrupt</span>
            </>
          )}
        </Box>
      )}

      {/* Input area */}
      <Box className="input-container" sx={{ 
        padding: 2,
        backgroundColor: theme.palette?.background?.paper || '#fff',
        borderTop: `1px solid ${theme.palette?.divider || '#e0e0e0'}`,
        position: 'sticky',
        bottom: 0,
        zIndex: 1
      }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 1, maxWidth: '100%' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
              multiline
              maxRows={4}
              InputProps={{
                style: {
                  backgroundColor: theme.palette?.background?.paper || '#fff',
                  borderRadius: '24px',
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      color="primary"
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                        },
                        '&:disabled': {
                          backgroundColor: theme.palette.action.disabledBackground,
                          color: theme.palette.action.disabled,
                        },
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <SendIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default SimpleChat;
