import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useApp } from '../context/AppContext';
import llmService from '../services/LLMService';

const Overlay = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  z-index: 9999;
  border: 1px solid #FF643D;
`;

const Title = styled.h3`
  margin: 0 0 10px 0;
  color: #FF643D;
`;

const Info = styled.div`
  margin: 5px 0;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
`;

const TestButton = styled.button`
  margin-top: 10px;
  padding: 5px 10px;
  background: #FF643D;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
`;

const DiagnosticOverlay = () => {
  const [show, setShow] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState('checking...');
  const [testResult, setTestResult] = useState('');
  const [cleanupResult, setCleanupResult] = useState('');
  const [streamingInfo, setStreamingInfo] = useState({ active: false, content: '' });
  const { projects, currentModel, models, updateProject, setProjects } = useApp();
  
  // Listen for streaming updates
  React.useEffect(() => {
    const checkStreaming = () => {
      const streamingContent = window.__streamingContent || '';
      const isStreaming = window.__isStreaming || false;
      const streamingMessageId = window.__streamingMessageId || '';
      setStreamingInfo({
        active: isStreaming,
        content: streamingContent.substring(0, 50) + (streamingContent.length > 50 ? '...' : ''),
        messageId: streamingMessageId
      });
    };
    
    const interval = setInterval(checkStreaming, 100);
    return () => clearInterval(interval);
  }, []);
  
  // Find current project from URL
  const currentProjectId = window.location.href.includes('projects') ? 
    sessionStorage.getItem('sephia_selected_project') : null;
  const currentProject = currentProjectId ? 
    projects.find(p => p.id === currentProjectId) : null;

  useEffect(() => {
    // Check Ollama status
    const checkOllama = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (response.ok) {
          const data = await response.json();
          setOllamaStatus(`Connected! ${data.models?.length || 0} models available`);
        } else {
          setOllamaStatus(`Error: HTTP ${response.status}`);
        }
      } catch (error) {
        setOllamaStatus(`Not running: ${error.message}`);
      }
    };
    
    checkOllama();
    const interval = setInterval(checkOllama, 5000);
    return () => clearInterval(interval);
  }, []);

  const testMessageSending = async () => {
    setTestResult('Testing...');
    try {
      const response = await llmService.sendMessage('Hello, test message', {
        model: currentModel || 'deepseek-r1:8b-m4'
      });
      setTestResult('Success: ' + (response.response ? 'Got response' : 'No response'));
    } catch (error) {
      setTestResult('Error: ' + error.message);
    }
  };
  
  const cleanupIncompleteMessages = () => {
    setCleanupResult('Cleaning up...');
    let cleaned = 0;
    let removed = 0;
    
    try {
      const updatedProjects = projects.map(project => {
        if (!project.messages || project.messages.length === 0) {
          return project;
        }
        
        // Filter out incomplete assistant messages
        const cleanedMessages = project.messages.filter((msg, index) => {
          // Keep all user messages
          if (msg.role === 'user') return true;
          
          // Remove assistant messages that are empty or still streaming
          if (msg.role === 'assistant' && (!msg.content || msg.content.trim() === '' || msg.isStreaming)) {
            removed++;
            return false;
          }
          
          return true;
        });
        
        if (cleanedMessages.length !== project.messages.length) {
          cleaned++;
          return {
            ...project,
            messages: cleanedMessages,
            lastUpdated: new Date().toISOString()
          };
        }
        
        return project;
      });
      
      // Save to localStorage
      localStorage.setItem('sephia_projects', JSON.stringify(updatedProjects));
      
      // Update state if setProjects is available
      if (typeof setProjects === 'function') {
        setProjects(updatedProjects);
      }
      
      setCleanupResult(`Cleaned ${cleaned} projects, removed ${removed} incomplete messages`);
    } catch (error) {
      setCleanupResult('Error: ' + error.message);
    }
  };

  if (!show) return null;

  return (
    <Overlay>
      <CloseButton onClick={() => setShow(false)}>×</CloseButton>
      <Title>Sephia Diagnostics</Title>
      <Info>Ollama: {ollamaStatus}</Info>
      <Info>Projects: {projects?.length || 0}</Info>
      <Info>Current Model: {currentModel || 'none'}</Info>
      <Info>Available Models: {models?.length || 0}</Info>
      <Info>updateProject: {typeof updateProject}</Info>
      {currentProject && (
        <>
          <Info style={{ marginTop: 10, borderTop: '1px solid #333', paddingTop: 10 }}>
            Current Project: {currentProject.title}
          </Info>
          <Info>Messages: {currentProject.messages?.length || 0}</Info>
          <Info>
            Incomplete: {currentProject.messages?.filter(m => 
              m.role === 'assistant' && (!m.content || m.content.trim() === '' || m.isStreaming)
            ).length || 0}
          </Info>
        </>
      )}
      {streamingInfo.active && (
        <Info style={{ marginTop: 10, borderTop: '1px solid #333', paddingTop: 10 }}>
          <div style={{ color: '#4CAF50' }}>STREAMING ACTIVE</div>
          <div style={{ fontSize: '10px', marginTop: 5 }}>
            Content: {streamingInfo.content}
          </div>
          <div style={{ fontSize: '10px', marginTop: 2 }}>
            Message ID: {streamingInfo.messageId || 'none'}
          </div>
        </Info>
      )}
      <Info>
        {models?.length > 0 && (
          <div style={{ marginTop: 5, paddingLeft: 10 }}>
            {models.map(m => (
              <div key={m.id}>- {m.name || m.id}</div>
            ))}
          </div>
        )}
      </Info>
      <TestButton onClick={testMessageSending}>Test Message Send</TestButton>
      {testResult && <Info style={{ marginTop: 10, color: '#FF643D' }}>{testResult}</Info>}
      
      <TestButton onClick={cleanupIncompleteMessages} style={{ marginTop: 10, background: '#9c27b0' }}>
        Clean Incomplete Messages
      </TestButton>
      {cleanupResult && <Info style={{ marginTop: 10, color: '#9c27b0' }}>{cleanupResult}</Info>}
    </Overlay>
  );
};

export default DiagnosticOverlay;