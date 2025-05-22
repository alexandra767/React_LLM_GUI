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
  const [isConnected, setIsConnected] = useState(false);
  const resizeObserver = useRef(null);

  // Handle terminal data from the main process
  const handleTerminalData = useCallback((event, data) => {
    if (terminal) {
      terminal.write(data);
    }
  }, [terminal]);

  // Handle terminal exit
  const handleTerminalExit = useCallback(() => {
    setIsConnected(false);
    if (terminal) {
      terminal.writeln('\r\n\r\n[Session ended]');
    }
  }, [terminal]);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

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
      allowProposedApi: true,
    });

    // Load addons
    term.loadAddon(fitAddon.current);
    
    // Open terminal in the container
    term.open(terminalRef.current);
    
    // Set initial dimensions
    const initializeTerminal = () => {
      try {
        // Ensure the terminal element is properly mounted
        if (!terminalRef.current) return;
        
        // Initialize fit addon
        fitAddon.current.fit();
        
        // Get dimensions
        const dims = fitAddon.current.proposeDimensions();
        if (dims) {
          console.log(`Terminal dimensions: ${dims.cols}x${dims.rows}`);
          
          // Resize terminal if connected
          if (isConnected && window.electron) {
            window.electron.invoke('terminal:resize', {
              cols: dims.cols,
              rows: dims.rows
            }).catch(console.error);
          }
        } else {
          console.warn('Could not get terminal dimensions');
        }
      } catch (error) {
        console.error('Error initializing terminal dimensions:', error);
      }
    };
    
    // Initial fit
    initializeTerminal();
    
    // Handle window resize with debounce
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        try {
          if (fitAddon.current) {
            fitAddon.current.fit();
            if (isConnected) {
              const dims = fitAddon.current.proposeDimensions();
              if (dims && window.electron) {
                window.electron.invoke('terminal:resize', {
                  cols: dims.cols,
                  rows: dims.rows
                }).catch(console.error);
              }
            }
          }
        } catch (error) {
          console.error('Error handling terminal resize:', error);
        }
      }, 100);
    };

    // Set up resize observer for the container
    resizeObserver.current = new ResizeObserver(handleResize);
    resizeObserver.current.observe(terminalRef.current);

    // Handle terminal input
    term.onData((data) => {
      if (isConnected && window.electron) {
        window.electron.invoke('terminal:write', data);
      }
    });

    setTerminal(term);

    // Cleanup
    const cleanup = () => {
      try {
        if (resizeObserver.current) {
          resizeObserver.current.disconnect();
          resizeObserver.current = null;
        }
        
        window.removeEventListener('resize', handleResize);
        
        if (terminal) {
          try {
            terminal.dispose();
          } catch (error) {
            console.error('Error disposing terminal:', error);
          }
        }
        
        // Clear any pending timeouts
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
      } catch (error) {
        console.error('Error during terminal cleanup:', error);
      }
    };
    
    return cleanup;
  }, []);

  // Handle model changes
  useEffect(() => {
    if (!terminal || !model) return;

    const startTerminal = async () => {
      try {
        terminal.clear();
        terminal.writeln(`Connecting to ${model} model...\r\n`);
        
        // Start terminal session
        const result = await window.electron.invoke('terminal:start', {
          model,
          ...fitAddon.current.proposeDimensions()
        });

        if (result && result.success) {
          terminal.writeln(`Connected to ${model} model. Type to start chatting.\r\n`);
          setIsConnected(true);
        } else {
          throw new Error(result?.error || 'Failed to start terminal session');
        }
      } catch (error) {
        console.error('Failed to start terminal session:', error);
        terminal.writeln(`\r\nError: ${error.message}\r\n`);
        setIsConnected(false);
      }
    };

    startTerminal();

    // Set up event listeners
    const cleanupListeners = [
      window.electron.receive('terminal:data', handleTerminalData),
      window.electron.receive('terminal:exit', handleTerminalExit)
    ];

    return () => {
      cleanupListeners.forEach(cleanup => cleanup && cleanup());
      if (window.electron) {
        window.electron.invoke('terminal:stop');
      }
    };
  }, [terminal, model, handleTerminalData, handleTerminalExit]);

  return (
    <TerminalContainer elevation={3}>
      <TerminalHeader>
        <Typography variant="subtitle2">
          {model || 'Terminal'} {isConnected ? '(Connected)' : '(Connecting...)'}
        </Typography>
      </TerminalHeader>
      <TerminalContent ref={terminalRef} />
    </TerminalContainer>
  );
};

export default Terminal;
