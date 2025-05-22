import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Terminal } from '@xterm/xterm';
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

const SimpleTerminal = ({ model, onClose }) => {
  const [error, setError] = React.useState(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const sessionRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize terminal
    const term = new Terminal({
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

    // Initialize fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    // Open terminal in the container
    term.open(containerRef.current);
    terminalRef.current = term;

    // Fit terminal to container
    const fitTerminal = () => {
      try {
        fitAddon.fit();
        if (sessionRef.current?.resize) {
          const dims = fitAddon.proposeDimensions();
          if (dims) {
            sessionRef.current.resize(dims.cols, dims.rows);
          }
        }
      } catch (error) {
        console.error('Error fitting terminal:', error);
      }
    };

    // Initial fit
    fitTerminal();

    // Handle window resize with debounce
    let resizeTimeout;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(fitTerminal, 100);
    };

    window.addEventListener('resize', handleResize);

    // Set up resize observer for the container
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Start terminal session if model is provided
    if (model) {
      startTerminalSession(term, model);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      
      if (sessionRef.current?.destroy) {
        sessionRef.current.destroy();
        sessionRef.current = null;
      }
      
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
    };
  }, []);

  // Handle model changes
  useEffect(() => {
    if (terminalRef.current && model) {
      startTerminalSession(terminalRef.current, model);
    }
  }, [model]);

  const startTerminalSession = async (term, modelName) => {
    try {
      // Clear any existing session
      if (sessionRef.current) {
        sessionRef.current.destroy();
        sessionRef.current = null;
      }

      term.clear();
      term.writeln(`Connecting to ${modelName} model...\r\n`);
      
      // Start a new terminal session
      const session = await window.electron.ollama.startTerminal(
        modelName,
        (data) => {
          term.write(data);
        },
        () => {
          term.writeln('\r\n\r\n[Session ended]');
          setIsConnected(false);
        }
      );

      sessionRef.current = session;

      // Handle terminal input
      term.onData((data) => {
        if (sessionRef.current) {
          sessionRef.current.write(data);
        }
      });

      // Set initial size
      const dims = fitAddonRef.current?.proposeDimensions();
      if (dims && sessionRef.current?.resize) {
        sessionRef.current.resize(dims.cols, dims.rows);
      }

      term.writeln(`Connected to ${modelName} model. Type to start chatting.\r\n`);
      setIsConnected(true);

    } catch (error) {
      console.error('Failed to start terminal session:', error);
      term.writeln(`\r\nError: ${error.message || 'Failed to start terminal session'}\r\n`);
      setIsConnected(false);
    }
  };

  return (
    <TerminalContainer elevation={3}>
      <TerminalHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle2">
            {model || 'Terminal'} 
            {isConnected ? '(Connected)' : isConnecting ? '(Connecting...)' : '(Disconnected)'}
          </Typography>
          {error && (
            <Typography variant="caption" color="error" sx={{ ml: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => startTerminalSession(terminalRef.current, model)}
            disabled={isConnecting}
          >
            Reconnect
          </Button>
        </Box>
      </TerminalHeader>
      <TerminalContent ref={containerRef} />
    </TerminalContainer>
  );
};

export default SimpleTerminal;
