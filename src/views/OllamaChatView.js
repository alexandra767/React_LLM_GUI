import React from 'react';
import { Box } from '@mui/material';
import SimpleChat from '../components/SimpleChat';

const OllamaChatView = () => {
  return (
    <Box sx={{ 
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'background.default',
      overflow: 'hidden',
      '& .simple-chat-container': {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        padding: 0,
        margin: 0
      }
    }}>
      <Box className="simple-chat-container">
        <SimpleChat />
      </Box>
    </Box>
  );
};

export default OllamaChatView;
