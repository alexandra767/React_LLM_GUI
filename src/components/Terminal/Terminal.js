import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const TerminalContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  height: '100%',
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
}));

const TerminalHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
  margin: theme.spacing(-2, -2, 0, -2),
}));

const TerminalContent = styled(Box)({
  flex: 1,
  overflow: 'hidden',
  padding: '4px',
  '& .xterm': {
    height: '100%',
    '& .xterm-viewport': {
      backgroundColor: 'transparent',
    },
  },
});

const Terminal = ({ model, onClose }) => {
  const terminalRef = useRef(null);
  const fitAddon = useRef(new FitAddon());
  const [terminal, setTerminal] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#1E1E1E',
        foreground: '#F0F0F0',
        cursor: '#A0A0A0',
        selection: 'rgba(255, 255, 255, 0.3)',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
    });

    // Load addons
    term.loadAddon(fitAddon.current);
    
    // Open terminal in the container
    term.open(terminalRef.current);
    fitAddon.current.fit();
    
    // Handle window resize
    const handleResize = () => {
      fitAddon.current.fit();
    };
    window.addEventListener('resize', handleResize);

    setTerminal(term);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (!terminal || !model) return;

    // Start terminal session with the model
    const startTerminal = async () => {
      setConnectionStatus('connecting');
      
      try {
        const session = window.electron.ollama.startTerminal(
          model,
          (data) => {
            terminal.write(data);
            // Update status to connected when we receive the first data
            if (connectionStatus !== 'connected') {
              setConnectionStatus('connected');
            }
          },
          () => {
            terminal.writeln('\r\n\r\n[Session ended]');
            setConnectionStatus('disconnected');
          }
        );

        terminal.onData((data) => {
          if (session && typeof session.write === 'function') {
            session.write(data);
          }
        });

        terminal.onResize(({ cols, rows }) => {
          if (session && typeof session.resize === 'function') {
            session.resize(cols, rows);
          }
        });

        terminal.writeln(`Connecting to ${model} model...\r\n`);

        // Set a timeout to detect if connection fails
        const connectionTimeout = setTimeout(() => {
          if (connectionStatus === 'connecting') {
            console.error('Connection to Ollama timed out');
            terminal.writeln('\r\nError: Connection to Ollama timed out. Please make sure Ollama is running.\r\n');
            setConnectionStatus('error');
            
            // Show helpful message about starting Ollama
            terminal.writeln('To start Ollama, run:');
            terminal.writeln('  ollama serve\r\n');
            terminal.writeln('Or install it from: https://ollama.ai/\r\n');
          }
        }, 5000);

        // Cleanup on unmount
        return () => {
          clearTimeout(connectionTimeout);
          if (session && typeof session.destroy === 'function') {
            session.destroy();
          }
        };
      } catch (error) {
        console.error('Failed to start terminal session:', error);
        terminal.writeln(`\r\nError: ${error.message}\r\n`);
        setConnectionStatus('error');
      }
    };

    startTerminal();
  }, [terminal, model]);

  return (
    <TerminalContainer elevation={3}>
      <TerminalHeader>
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <Typography variant="subtitle2">
            {model || 'Terminal'}
          </Typography>
          <Box display="flex" alignItems="center">
            <Box 
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: connectionStatus === 'connected' ? 'success.main' : 
                         connectionStatus === 'connecting' ? 'warning.main' : 'error.main',
                mr: 1
              }}
            />
            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
              {connectionStatus}
            </Typography>
          </Box>
        </Box>
      </TerminalHeader>
      <TerminalContent ref={terminalRef} />
    </TerminalContainer>
  );
};

export default Terminal;
