import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';

const TokenDisplayContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.small} ${props => props.theme.spacing.medium};
  background-color: ${props => props.theme.colors.secondaryBg};
  border-top: 1px solid ${props => props.theme.colors.border};
  font-size: ${props => props.theme.typography.secondaryInfo.size};
`;

const TokenStats = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.medium};
`;

const TokenStat = styled.div`
  display: flex;
  align-items: center;
  color: ${props => props.theme.colors.tertiaryText};
  
  .label {
    margin-right: ${props => props.theme.spacing.small};
    color: ${props => props.accent ? props.theme.colors.accent : props.theme.colors.secondaryText};
  }
  
  .value {
    font-family: 'Menlo', monospace;
    color: ${props => props.theme.colors.primaryText};
    font-weight: 500;
  }
`;

const ProcessInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.medium};
`;

const StopButton = styled.button`
  background-color: ${props => props.theme.colors.errorColor || '#d32f2f'};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.small};
  padding: 4px 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background-color: ${props => props.theme.colors.errorColorHover || '#b71c1c'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TokenDisplay = ({ 
  isStreaming, 
  tokenCount, 
  streamDuration,
  onStop
}) => {
  const { theme } = useTheme();
  const [tokensPerSecond, setTokensPerSecond] = useState(0);
  
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