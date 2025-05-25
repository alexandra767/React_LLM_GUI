// Block Google APIs in Electron FIRST before anything else
import './utils/blockGoogleApis';
import './utils/suppressGoogleErrors';
import './utils/debugGoogleError';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF643D',
    },
    secondary: {
      main: '#252525',
    },
    background: {
      default: '#1E1E1E',
      paper: '#252525',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#AAAAAA',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    h5: {
      fontWeight: 400,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#1E1E1E',
          color: '#FFFFFF',
        },
      },
    },
  },
});

// Global debug function for streaming
window.__debugStreaming = () => {
  console.log('=== Streaming Debug Info ===');
  console.log('isStreaming:', window.__isStreaming);
  console.log('streamingMessageId:', window.__streamingMessageId);
  console.log('streamingContent length:', window.__streamingContent?.length || 0);
  console.log('streamingContent preview:', window.__streamingContent?.substring(0, 100) || 'empty');
  console.log('===========================');
};

// Monitor streaming state changes
let lastStreamingState = false;
setInterval(() => {
  if (window.__isStreaming !== lastStreamingState) {
    console.log('[Streaming State Changed]', lastStreamingState, '->', window.__isStreaming);
    window.__debugStreaming();
    lastStreamingState = window.__isStreaming;
  }
}, 100);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);