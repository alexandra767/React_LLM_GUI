import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, MenuItem, Select, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SimpleTerminal from '../components/Terminal/SimpleTerminal';
import { styled } from '@mui/material/styles';

const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}));

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const TerminalContainer = styled(Box)({
  flex: 1,
  minHeight: 0, // Allows the container to shrink below its content size
  display: 'flex',
  flexDirection: 'column',
});

const TerminalView = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if electron API is available
        if (!window.electron || !window.electron.ollama) {
          console.warn('Electron Ollama API not available, skipping terminal model loading');
          // Set some default models for web mode
          setModels(['deepseek-r1:8b-m4', 'llama2', 'mistral']);
          setSelectedModel('deepseek-r1:8b-m4');
          return;
        }
        
        // First check if Ollama is running
        try {
          const isRunning = await window.electron.ollama.isRunning();
          if (!isRunning) {
            throw new Error('Ollama service is not running. Please start Ollama and try again.');
          }
        } catch (err) {
          if (err.message.includes('ENOENT') || err.message.includes('not found')) {
            throw new Error('Ollama is not installed. Please install Ollama from https://ollama.ai/');
          }
          throw err;
        }
        
        // Then list models
        const modelList = await window.electron.ollama.listModels();
        
        // Handle case where modelList is undefined or empty
        if (!modelList) {
          throw new Error('No response from Ollama. The service may be starting up. Please try again in a moment.');
        }
        
        const parsedModels = modelList
          .split('\n')
          .slice(1) // Skip header
          .filter(line => line.trim())
          .map(line => {
            const [name] = line.split(' ');
            return name;
          });
        
        setModels(parsedModels);
        
        if (parsedModels.length > 0) {
          setSelectedModel(parsedModels[0]);
        } else {
          console.warn('No models found. Use "ollama pull <model>" to download a model.');
        }
      } catch (err) {
        console.error('Failed to load models:', err);
        
        let errorMessage = 'Failed to load models. ';
        
        if (err.message.includes('ENOENT') || err.message.includes('not found')) {
          errorMessage += 'Ollama is not installed or not in your PATH. ';
          errorMessage += 'Please install Ollama from https://ollama.ai/';
        } else if (err.message.includes('ECONNREFUSED')) {
          errorMessage += 'Ollama service is not running. ';
          errorMessage += 'Please start the Ollama service and try again.';
        } else {
          errorMessage += err.message || 'Please check your Ollama installation.';
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
    
    // Set up polling to check Ollama status
    const pollInterval = setInterval(() => {
      if (error) {
        loadModels();
      }
    }, 10000); // Check every 10 seconds if there was an error
    
    return () => clearInterval(pollInterval);
  }, [error]);

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
  };

  if (isLoading) {
    return (
      <Container>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          p: 3
        }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Loading Ollama Models
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Checking for available models...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          p: 3
        }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom color="error">
            Error Loading Models
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please make sure Ollama is installed and running.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
            startIcon={<RefreshIcon />}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  if (models.length === 0) {
    return (
      <Container>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          p: 3
        }}>
          <Typography variant="h6" gutterBottom>
            No Ollama Models Found
          </Typography>
          <Typography variant="body1" paragraph>
            You don't have any Ollama models installed yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            To get started, install a model using the Ollama CLI:
          </Typography>
          <Box 
            component="pre" 
            sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              borderRadius: 1,
              fontFamily: 'monospace',
              width: '100%',
              maxWidth: '600px',
              overflowX: 'auto',
              mb: 3
            }}
          >
            $ ollama pull llama2
          </Box>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Check Again
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Typography variant="h6">Ollama Terminal</Typography>
        <Select
          value={selectedModel}
          onChange={handleModelChange}
          size="small"
          sx={{ minWidth: 200 }}
        >
          {models.map((model) => (
            <MenuItem key={model} value={model}>
              {model}
            </MenuItem>
          ))}
        </Select>
      </Header>
      <TerminalContainer>
        <SimpleTerminal model={selectedModel} />
      </TerminalContainer>
    </Container>
  );
};

export default TerminalView;
