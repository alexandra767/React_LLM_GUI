import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div style={{ 
      margin: '16px 0',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 1,
        backgroundColor: 'rgba(40, 44, 52, 0.8)',
        borderRadius: '4px',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Tooltip title={copied ? 'Copied!' : 'Copy code'} arrow>
          <IconButton
            onClick={handleCopy}
            size="small"
            sx={{
              color: '#abb2bf',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff'
              },
              padding: '4px'
            }}
          >
            {copied ? 
              <CheckIcon fontSize="small" sx={{ color: '#4caf50' }} /> : 
              <ContentCopyIcon fontSize="small" />
            }
          </IconButton>
        </Tooltip>
      </div>
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: '\'Fira Code\', \'Roboto Mono\', monospace',
        }}
        showLineNumbers={true}
        wrapLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
