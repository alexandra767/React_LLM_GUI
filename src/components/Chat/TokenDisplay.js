import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { ThemeContext } from '../../context/ThemeContext';

const TokenDisplayContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${theme?.spacing?.small || '8px'} ${theme?.spacing?.medium || '16px'}`,
  backgroundColor: theme?.colors?.secondaryBg || '#252525',
  borderTop: `1px solid ${theme?.colors?.border || '#333333'}`,
  fontSize: theme?.typography?.secondaryInfo?.size || '13px'
}));

const TokenStats = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme?.spacing?.medium || '16px'
}));

const TokenStat = styled('div')(({ theme, accent }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme?.colors?.tertiaryText || '#AAAAAA',
  '.label': {
    marginRight: theme?.spacing?.small || '8px',
    color: accent ? (theme?.colors?.accent || '#FF643D') : (theme?.colors?.secondaryText || '#F0F0F0')
  },
  '.value': {
    fontFamily: '"Menlo", monospace',
    color: theme?.colors?.primaryText || '#FFFFFF',
    fontWeight: 500
  }
}));

const ProcessInfo = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme?.spacing?.medium || '16px'
}));

const StopButton = styled('button')(({ theme }) => ({
  backgroundColor: theme?.colors?.errorColor || '#d32f2f',
  color: 'white',
  border: 'none',
  borderRadius: theme?.borderRadius?.small || '4px',
  padding: '4px 8px',
  fontSize: '0.8rem',
  fontWeight: 500,
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.9
  },
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  '&:disabled': {
    backgroundColor: theme?.colors?.disabled || '#cccccc',
    cursor: 'not-allowed'
  },
  '&:hover:not(:disabled)': {
    opacity: 0.9
  }
}));

const TokenDisplay = ({ 
  isStreaming, 
  tokenCount, 
  streamDuration,
  onStop
}) => {
  const [tokensPerSecond, setTokensPerSecond] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const theme = React.useContext(ThemeContext);

  // Calculate tokens per second
  useEffect(() => {
    if (isStreaming && streamDuration > 0 && tokenCount.output > 0) {
      const tps = (tokenCount.output / streamDuration).toFixed(1);
      setTokensPerSecond(tps);
    } else if (!isStreaming) {
      setTokensPerSecond(0);
    }
  }, [isStreaming, tokenCount.output, streamDuration]);
  
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isStreaming && onStop) {
        onStop();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStreaming, onStop]);

  return (
    <TokenDisplayContainer theme={theme}>
      <TokenStats theme={theme}>
        <TokenStat theme={theme}>
          <span className="label">Input:</span>
          <span className="value">{tokenCount.input}</span>
        </TokenStat>
        <TokenStat theme={theme}>
          <span className="label">Output:</span>
          <span className="value">{tokenCount.output}</span>
        </TokenStat>
        <TokenStat theme={theme}>
          <span className="label">Total:</span>
          <span className="value">{tokenCount.total}</span>
        </TokenStat>
      </TokenStats>
      
      {isStreaming && (
        <ProcessInfo theme={theme}>
          <TokenStat theme={theme} accent={true}>
            <span className="label">{streamDuration}s</span>
          </TokenStat>
          <TokenStat theme={theme} accent={true}>
            <span className="label">Tokens/sec:</span>
            <span className="value">{tokensPerSecond}</span>
          </TokenStat>
          <StopButton 
            theme={theme} 
            onClick={onStop}
            title="Press ESC to stop"
          >
            ESC
          </StopButton>
        </ProcessInfo>
      )}
    </TokenDisplayContainer>
  );
};

export default TokenDisplay;