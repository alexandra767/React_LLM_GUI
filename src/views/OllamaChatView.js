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
      p: 2
    }}>
      <SimpleChat />
    </Box>
  );
};

export default OllamaChatView;
