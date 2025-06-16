import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';

const OverlayContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.9);
  color: #00ff00;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 12px;
  max-width: 400px;
  z-index: 9999;
  border: 1px solid #00ff00;
  max-height: 80vh;
  overflow-y: auto;
`;

const DataRow = styled.div`
  margin: 2px 0;
  white-space: pre-wrap;
  word-break: break-all;
`;

const SectionHeader = styled.div`
  color: #ffff00;
  font-weight: bold;
  margin-top: 10px;
  border-top: 1px solid #333;
  padding-top: 5px;
`;

const DiagnosticOverlay = () => {
  const [diagnosticData, setDiagnosticData] = useState({});
  const [renderCount, setRenderCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDiagnosticData({
        isStreaming: window.__isStreaming,
        streamingMessageId: window.__streamingMessageId,
        streamingContent: window.__streamingContent,
        streamingBuffer: window.__streamingBuffer,
        timestamp: new Date().toISOString()
      });
      setRenderCount(prev => prev + 1);
    }, 100); // Update every 100ms
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <OverlayContainer>
      <SectionHeader>STREAMING DIAGNOSTICS</SectionHeader>
      <DataRow>Time: {new Date().toLocaleTimeString()}</DataRow>
      <DataRow>Render Count: {renderCount}</DataRow>
      
      <SectionHeader>Streaming State</SectionHeader>
      <DataRow>Active: {diagnosticData.isStreaming ? '✓ YES' : '✗ NO'}</DataRow>
      <DataRow>Message ID: {diagnosticData.streamingMessageId || 'none'}</DataRow>
      <DataRow>Content Length: {diagnosticData.streamingContent?.length || 0}</DataRow>
      
      <SectionHeader>Content Preview</SectionHeader>
      <DataRow style={{ color: '#ffffff' }}>
        {diagnosticData.streamingContent ? 
          (diagnosticData.streamingContent.substring(0, 200) + 
           (diagnosticData.streamingContent.length > 200 ? '...' : '')) : 
          'No content'}
      </DataRow>
      
      <SectionHeader>Buffer State</SectionHeader>
      <DataRow>Active: {diagnosticData.streamingBuffer?.isActive ? '✓' : '✗'}</DataRow>
      <DataRow>Project: {diagnosticData.streamingBuffer?.projectId || 'none'}</DataRow>
      <DataRow>Messages: {diagnosticData.streamingBuffer?.messages?.length || 0}</DataRow>
      
      {diagnosticData.streamingBuffer?.messages?.length > 0 && (
        <>
          <SectionHeader>Last Message</SectionHeader>
          <DataRow>
            {JSON.stringify(
              diagnosticData.streamingBuffer.messages[
                diagnosticData.streamingBuffer.messages.length - 1
              ], 
              null, 
              2
            )}
          </DataRow>
        </>
      )}
    </OverlayContainer>
  );
};

export default DiagnosticOverlay;