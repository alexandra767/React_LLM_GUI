import React from 'react';
import { Box } from '@mui/material';
import SimpleChat from '../components/SimpleChat';

const OllamaChatView = () => {
  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'background.default',
      overflow: 'hidden',
      flex: 1,
      '& .simple-chat-container': {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: 0,
        margin: 0,
        maxHeight: '100%'
      }
    }}>
      <Box className="simple-chat-container">
        <SimpleChat />
      </Box>
    </Box>
  );
};

export default OllamaChatView;
