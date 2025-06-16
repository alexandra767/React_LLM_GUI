import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  styled,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ollamaService from '../services/OllamaService';
import Message from './Chat/Message';
import { useApp } from '../context/AppContext';
import { processCommand } from '../utils/commandProcessor';

// Styled components
const ChatContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 200px)',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: '12px',
  boxShadow: theme.shadows[3],
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    height: 'calc(100vh - 160px)',
    padding: theme.spacing(1),
  },
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  '& > *': {
    marginBottom: 0,
  },
}));

const OllamaChat = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([
    { text: 'Hello! I\'m your AI assistant. How can I help you today?', isUser: false, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);
  const { appState } = useApp();

  // Load available models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        const availableModels = await ollamaService.listModels();
        setModels(availableModels);
        if (availableModels.length > 0 && !selectedModel) {
          setSelectedModel(availableModels[0].name);
        }
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load models. Please check if Ollama is running.');
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedModel) return;

    const userMessage = { text: input, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    // Check for @ commands
    if (input.trim().startsWith('@')) {
      console.log('Processing @ command:', input);
      setInput('');
      setIsGenerating(true);
      setError(null);
      
      try {
        const commandResult = await processCommand(input.trim());
        
        if (commandResult) {
          setMessages(prev => [
            ...prev,
            { 
              text: commandResult.content, 
              isUser: false, 
              timestamp: new Date(),
              isCommand: true
            }
          ]);
        }
      } catch (err) {
        console.error('Command processing error:', err);
        setError('Failed to process command. Please try again.');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Regular message processing
    setInput('');
    setIsGenerating(true);
    setError(null);

    try {
      const response = await ollamaService.generate(selectedModel, input);
      setMessages(prev => [
        ...prev,
        { text: response, isUser: false, timestamp: new Date() }
      ]);
    } catch (err) {
      console.error('Error generating response:', err);
      setError('Failed to generate response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ChatContainer elevation={3}>
        <MessagesContainer>
          {messages.map((message, index) => (
            <Message 
              key={index} 
              message={message.text} 
              isUser={message.isUser} 
              timestamp={message.timestamp}
            />
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <InputContainer>
          <FormControl sx={{ minWidth: 200, mr: 1 }} size="small">
            <InputLabel id="model-select-label">Model</InputLabel>
            <Select
              labelId="model-select-label"
              value={selectedModel}
              label="Model"
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoading || isGenerating || isLoadingModels}
            >
              {models.map((model) => (
                <MenuItem key={model.name} value={model.name}>
                  {model.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isGenerating || !selectedModel}
            multiline
            maxRows={4}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isGenerating || !selectedModel}
            sx={{ minWidth: '100px' }}
          >
            {isGenerating ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </InputContainer>
      </ChatContainer>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OllamaChat;
