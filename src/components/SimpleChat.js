import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
  useMediaQuery,
  styled,
  keyframes
} from '@mui/material';
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
  margin: theme.spacing(0.5, 0),
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: isUser 
    ? theme.palette.primary.main 
    : theme.palette.grey[200],
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  position: 'relative',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  boxShadow: theme.shadows[1],
  '&:first-of-type': { marginTop: theme.spacing(1) },
  '&:last-of-type': { marginBottom: theme.spacing(1) },
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

// SimpleChat component with forced styles
const SimpleChat = () => {
  // Theme and responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageListRef = useRef(null);
  
  // Memoized initial message
  const initialMessage = useMemo(() => ({
    id: Date.now(),
    text: 'Hello! I\'m your AI assistant. How can I help you today?',
    isUser: false,
    timestamp: new Date().toISOString()
  }), []);

  // Default models optimized for M4 with 24GB unified memory
  const defaultModels = useMemo(() => [
    { name: 'deepseek-r1:14b', size: '7.6GB' },
    { name: 'llama3:8b', size: '4.7GB' },
    { name: 'mistral:7b', size: '4.1GB' },
    { name: 'mixtral:8x7b', size: '26.5GB', disabled: true },
    { name: 'neural-chat:7b', size: '4.1GB' }
  ], []);

  // State management
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [models, setModels] = useState(defaultModels);
  const [selectedModel, setSelectedModel] = useState('deepseek-r1:14b'); // Added missing state
  const [error, setError] = useState(null);
  const [modelIcon, setModelIcon] = useState(<SmartToyIcon />); // Added missing state

  // Load available models with performance optimizations
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const signal = controller.signal;
    let idleId;
    
    const loadModels = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags', {
          signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Use requestIdleCallback to process models when the main thread is idle
          requestIdleCallback(() => {
            if (isMounted) {
              const availableModels = data.models
                .filter(model => {
                  // Filter out large models for 24GB unified memory
                  const sizeGB = model.size / 1e9; // Convert to GB
                  return sizeGB < 12; // Keep models under 12GB
                })
                .map(model => ({
                  name: model.name,
                  size: (model.size / 1e9).toFixed(1) + 'GB',
                  optimized: model.name.includes('m4') || model.name.includes('apple')
                }));
              
              // Batch state updates
              requestAnimationFrame(() => {
                if (isMounted) {
                  setModels(prevModels => {
                    // Only update if models have changed
                    if (JSON.stringify(prevModels) !== JSON.stringify(availableModels)) {
                      return availableModels;
                    }
                    return prevModels;
                  });
                  
                  // Set default model if needed
                  if (!selectedModel || !availableModels.some(m => m.name === selectedModel)) {
                    const defaultModel = availableModels.find(m => m.name.includes('deepseek-r1:14b')) || 
                                       availableModels.find(m => m.optimized) || 
                                       availableModels[0];
                    if (defaultModel) {
                      setSelectedModel(defaultModel.name);
                    }
                  }
                }
              });
            }
          }, { timeout: 100 });
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load models:', err);
          setError('Failed to load models. Make sure Ollama is running and accessible at http://localhost:11434');
        }
      }
    };

    // Use requestIdleCallback for non-critical initialization
    idleId = requestIdleCallback(loadModels, { timeout: 1000 });
    
    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
      if (idleId) {
        cancelIdleCallback(idleId);
      }
    };
  }, [selectedModel]);

  // Optimized streaming response with better memory management
  const streamResponse = useCallback(async (userInput, modelName) => {
    setIsTyping(true);
    setError(null);
    
    const newMessage = {
      id: Date.now(),
      text: userInput,
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    // Optimistically update UI
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    
    // Add empty response message for streaming
    const responseMessageId = Date.now() + 1;
    const responseMessage = {
      id: responseMessageId,
      text: '',
      isUser: false,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, responseMessage]);
    
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: userInput,
          stream: true,
          options: {
            num_ctx: 8192,  // Larger context window
            num_gpu: 1,     // Use GPU
            use_mlock: true, // Keep model in memory
            temperature: 0.7,
            top_p: 0.9,
          }
        })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullResponse = '';
      let lastUpdate = 0;
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                fullResponse += parsed.response;
                
                // Throttle updates to once per animation frame
                const now = performance.now();
                if (now - lastUpdate > 16) { // ~60fps
                  lastUpdate = now;
                  requestAnimationFrame(() => {
                    setMessages(prev => 
                      prev.map(msg => 
                        msg.id === responseMessageId 
                          ? { ...msg, text: fullResponse } 
                          : msg
                      )
                    );
                  });
                }
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
      
      // Final update to ensure all content is shown
      requestAnimationFrame(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === responseMessageId 
              ? { ...msg, text: fullResponse } 
              : msg
          )
        );
      });
      
    } catch (err) {
      console.error('Error generating response:', err);
      setError('Failed to generate response. Please try again.');
      
      // Remove the empty response message on error
      setMessages(prev => prev.filter(msg => msg.id !== responseMessageId));
    } finally {
      setIsTyping(false);
      
      // Scroll to bottom after a short delay to ensure UI is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

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
        height: '100vh',
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: theme.spacing(2),
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing(2),
          padding: theme.spacing(1, 0),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" component="h1">
          Sephia Chat
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="model-select-label">Model</InputLabel>
          <Select
            labelId="model-select-label"
            value={selectedModel}
            label="Model"
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading}
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              },
            }}
          >
            {models.map((model) => (
              <MenuItem 
                key={model.name} 
                value={model.name}
                disabled={model.disabled}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>{model.name}</Box>
                <Typography variant="caption" color="text.secondary">
                  {model.size}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Messages */}
      <Box
        ref={messageListRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: theme.spacing(1),
          marginBottom: theme.spacing(2),
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.background.paper,
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.grey[400],
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.grey[500],
          },
        }}
      >
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                  color: message.isUser ? '#ffffff !important' : '#4a148c !important', 
                  fontSize: '0.85rem' 
                }}>
                  {message.isUser ? 'You' : selectedModel || 'Assistant'}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: message.isUser ? '#ffffff !important' : 'rgba(74, 20, 140, 0.7) !important', 
                  fontSize: '0.7rem' 
                }}>
                  {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Typography>
              </Box>
              {message.text}
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
              <TypingIndicator>
                <div></div>
                <div></div>
                <div></div>
              </TypingIndicator>
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

      {/* Input area */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          gap: 1,
          width: '100%',
          paddingTop: theme.spacing(1),
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          multiline
          maxRows={4}
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: theme.shape.borderRadius * 2,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!input.trim() || isLoading}
          sx={{
            minWidth: 48,
            width: 48,
            height: 48,
            borderRadius: '50%',
            padding: 0,
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default SimpleChat;
