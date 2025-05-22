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

// Styled typing indicator
const TypingIndicator = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  '& > div': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    animation: 'typing 1.4s infinite ease-in-out',
    '&:nth-of-type(1)': { animationDelay: '0s' },
    '&:nth-of-type(2)': { animationDelay: '0.2s' },
    '&:nth-of-type(3)': { animationDelay: '0.4s' },
  },
  '@keyframes typing': {
    '0%, 60%, 100%': { transform: 'translateY(0)' },
    '30%': { transform: 'translateY(-5px)' },
  },
});

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
  const [selectedModel, setSelectedModel] = useState('deepseek-r1:14b');
  const [error, setError] = useState(null);

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
          <MessageBubble key={message.id} isUser={message.isUser}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                marginBottom: 0.5,
              }}
            >
              {message.isUser ? (
                <PersonIcon fontSize="small" />
              ) : (
                <SmartToyIcon fontSize="small" />
              )}
              <Typography variant="subtitle2" fontWeight="bold">
                {message.isUser ? 'You' : 'Assistant'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
            <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.text}
            </Typography>
          </MessageBubble>
        ))}
        {isTyping && (
          <MessageBubble isUser={false}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 0.5 }}>
              <SmartToyIcon fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">Assistant</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
            <TypingIndicator>
              <div></div>
              <div></div>
              <div></div>
            </TypingIndicator>
          </MessageBubble>
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
