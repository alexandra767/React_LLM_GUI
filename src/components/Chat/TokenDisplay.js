import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';

// Simple styled components with inline styles
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: #252525;
  border-top: 1px solid #333333;
  font-size: 13px;
  color: #AAAAAA;
`;

const Stats = styled.div`
  display: flex;
  gap: 16px;
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  .label {
    margin-right: 8px;
    color: ${props => props.accent ? '#FF643D' : '#F0F0F0'};
  }
  .value {
    font-family: 'Menlo', monospace;
    color: #FFFFFF;
    font-weight: 500;
  }
`;

const StopButton = styled.button`
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const TokenDisplay = ({ 
  isStreaming = false, 
  tokenCount = { output: 0 }, 
  streamDuration = 0,
  onStop = () => {}
}) => {
  const [tokensPerSecond, setTokensPerSecond] = useState(0);

  // Calculate tokens per second
  useEffect(() => {
    if (isStreaming && streamDuration > 0 && tokenCount?.output > 0) {
      const tps = (tokenCount.output / streamDuration).toFixed(1);
      setTokensPerSecond(tps);
    } else if (!isStreaming) {
      setTokensPerSecond(0);
    }
  }, [isStreaming, tokenCount?.output, streamDuration]);
  
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isStreaming && typeof onStop === 'function') {
        onStop();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStreaming, onStop]);

  try {
    return (
      <Container>
        <Stats>
          <Stat>
            <span className="label">Output:</span>
            <span className="value">{tokenCount?.output || 0}</span>
          </Stat>
          {tokensPerSecond > 0 && (
            <Stat>
              <span className="label">Speed:</span>
              <span className="value">{tokensPerSecond} tokens/s</span>
            </Stat>
          )}
        </Stats>
        
        {isStreaming && (
          <div>
            <StopButton 
              onClick={onStop}
              title="Stop generating (Esc)"
            >
              <span>Stop</span>
            </StopButton>
          </div>
        )}
      </Container>
    );
  } catch (error) {
    console.error('Error in TokenDisplay:', error);
    return null;
  }
};

export default TokenDisplay;