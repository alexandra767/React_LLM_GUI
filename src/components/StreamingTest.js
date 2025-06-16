import React, { useState, useEffect } from 'react';

const StreamingTest = () => {
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(false);
  
  // Monitor window streaming variables
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.__isStreaming && window.__streamingContent) {
        setContent(window.__streamingContent);
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      left: 10,
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#0f0',
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #0f0',
      maxWidth: '400px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <div>Streaming Test Component</div>
      <div>Active: {isActive ? 'YES' : 'NO'}</div>
      <div>Content Length: {content.length}</div>
      <div>Content: {content.substring(0, 100)}{content.length > 100 ? '...' : ''}</div>
      
      <button
        onClick={() => {
          // Simulate streaming
          window.__isStreaming = true;
          window.__streamingMessageId = 'test-123';
          window.__streamingContent = '';
          
          let text = 'Hello, this is a test of the streaming system. It should update character by character.';
          let index = 0;
          
          const interval = setInterval(() => {
            if (index < text.length) {
              window.__streamingContent += text[index];
              index++;
            } else {
              clearInterval(interval);
              window.__isStreaming = false;
            }
          }, 50);
        }}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          background: '#0f0',
          color: '#000',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Test Streaming
      </button>
    </div>
  );
};

export default StreamingTest;