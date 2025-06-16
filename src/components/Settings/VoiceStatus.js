import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';

const StatusContainer = styled('div')({
  background: 'linear-gradient(145deg, #2C3E50, #34495E)',
  borderRadius: '12px',
  padding: '24px',
  margin: '16px 0',
  color: '#ECF0F1',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  border: '1px solid rgba(52,152,219,0.2)'
});

const StatusTitle = styled('h3')({
  color: '#3498DB',
  margin: '0 0 20px 0',
  fontSize: '18px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
});

const StatusGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '16px',
  marginBottom: '20px'
});

const StatusCard = styled('div')({
  background: 'rgba(44,62,80,0.5)',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid rgba(52,152,219,0.1)'
});

const StatusLabel = styled('div')({
  fontSize: '14px',
  color: '#BDC3C7',
  marginBottom: '8px',
  fontWeight: '500'
});

const StatusValue = styled('div')({
  fontSize: '16px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

const StatusIndicator = styled('span')(({ status }) => ({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: status === 'good' ? '#27AE60' : 
                   status === 'warning' ? '#F39C12' : 
                   status === 'loading' ? '#3498DB' : '#E74C3C',
  display: 'inline-block',
  animation: status === 'loading' ? 'pulse 2s infinite' : 'none',
  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 }
  }
}));

const ActionButton = styled('button')(({ variant = 'primary' }) => ({
  backgroundColor: variant === 'primary' ? '#3498DB' : 
                   variant === 'success' ? '#27AE60' : 
                   variant === 'warning' ? '#F39C12' : '#95A5A6',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 16px',
  fontSize: '14px',
  cursor: 'pointer',
  marginRight: '8px',
  marginBottom: '8px',
  transition: 'all 0.2s',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
  '&:disabled': {
    backgroundColor: '#7F8C8D',
    cursor: 'not-allowed',
    transform: 'none'
  }
}));

const LogArea = styled('div')({
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '6px',
  padding: '12px',
  marginTop: '16px',
  fontFamily: 'monospace',
  fontSize: '12px',
  maxHeight: '200px',
  overflowY: 'auto',
  border: '1px solid rgba(52,152,219,0.2)'
});

const LogEntry = styled('div')({
  marginBottom: '4px',
  color: '#BDC3C7'
});

const VoiceStatus = () => {
  const [barkStatus] = useState(null);
  const [browserVoices, setBrowserVoices] = useState([]);
  const [selectedProvider] = useState('browser');
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  // Bark status checking is disabled since we're using browser voices
  // const checkBarkStatus = async () => { ... };

  const loadBrowserVoices = () => {
    addLog('Loading browser voices...');
    const voices = window.speechSynthesis.getVoices();
    setBrowserVoices(voices);
    addLog(`Found ${voices.length} browser voices`);
  };

  const testVoice = async (provider = selectedProvider) => {
    setTesting(true);
    addLog(`Testing ${provider} voice synthesis...`);

    try {
      if (provider === 'bark') {
        // Test Bark TTS
        const response = await fetch('http://localhost:8189/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'Hello! This is Aria testing the Bark voice system.',
            voice: 'v2/en_speaker_1',
            temperature: 0.7
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.audio_data) {
            addLog('Bark TTS: Voice generated successfully!');
            
            // Play the audio
            const audio = new Audio(result.audio_data);
            audio.onended = () => addLog('Bark TTS: Playback completed');
            audio.onerror = () => addLog('Bark TTS: Playback failed');
            await audio.play();
          } else {
            addLog(`Bark TTS failed: ${result.error || 'Unknown error'}`);
          }
        } else {
          const error = await response.json();
          addLog(`Bark TTS error: ${error.detail || 'Server error'}`);
        }
      } else {
        // Test Browser TTS
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance('Hello! This is Aria testing the browser voice system.');
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.name.includes('Samantha')) || 
                             voices.find(v => v.name.includes('Alex')) || 
                             voices[0];
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          addLog(`Using voice: ${selectedVoice.name}`);
        }
        
        utterance.onend = () => {
          addLog('Browser TTS: Playback completed');
          setTesting(false);
        };
        
        utterance.onerror = (error) => {
          addLog(`Browser TTS error: ${error.error}`);
          setTesting(false);
        };
        
        window.speechSynthesis.speak(utterance);
        addLog('Browser TTS: Speaking...');
        return; // Don't set testing to false here for browser TTS
      }
    } catch (error) {
      addLog(`Test failed: ${error.message}`);
    }
    
    setTesting(false);
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    addLog('Refreshing voice system status...');
    
    // Only refresh browser voices, not Bark
    // await checkBarkStatus();
    loadBrowserVoices();
    
    setRefreshing(false);
    addLog('Status refresh completed');
  };

  useEffect(() => {
    // Initial load - only load browser voices, not Bark
    loadBrowserVoices();
    
    // Don't check Bark status since it's not being used
    // const interval = setInterval(checkBarkStatus, 30000);
    
    // Load voices when they change
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadBrowserVoices;
    }
    
    return () => {
      // clearInterval(interval);
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getBarkStatusInfo = () => {
    if (!barkStatus) return { status: 'error', text: 'Server Offline' };
    if (!barkStatus.models_loaded) return { status: 'loading', text: 'Loading Models...' };
    return { status: 'good', text: 'Ready' };
  };

  const barkInfo = getBarkStatusInfo();

  return (
    <StatusContainer>
      <StatusTitle>
        🎤 Voice System Status
        <ActionButton 
          onClick={refreshStatus} 
          disabled={refreshing}
          variant="secondary"
        >
          {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
        </ActionButton>
      </StatusTitle>

      <StatusGrid>
        <StatusCard>
          <StatusLabel>Bark AI TTS (High Quality)</StatusLabel>
          <StatusValue>
            <StatusIndicator status={barkInfo.status} />
            {barkInfo.text}
          </StatusValue>
          {barkStatus && (
            <div style={{ fontSize: '12px', color: '#95A5A6', marginTop: '8px' }}>
              Device: {barkStatus.device} | Voices: {barkStatus.voices_available || 12}
            </div>
          )}
        </StatusCard>

        <StatusCard>
          <StatusLabel>Browser TTS (Standard)</StatusLabel>
          <StatusValue>
            <StatusIndicator status="good" />
            Ready ({browserVoices.length} voices)
          </StatusValue>
          <div style={{ fontSize: '12px', color: '#95A5A6', marginTop: '8px' }}>
            Best: {browserVoices.find(v => v.name.includes('Samantha'))?.name || 
                   browserVoices.find(v => v.name.includes('Alex'))?.name || 
                   'Default'}
          </div>
        </StatusCard>
      </StatusGrid>

      <div style={{ marginBottom: '16px' }}>
        <StatusLabel>Test Voice Synthesis:</StatusLabel>
        <div>
          <ActionButton 
            onClick={() => testVoice('browser')} 
            disabled={testing}
            variant="success"
          >
            {testing && selectedProvider === 'browser' ? '🔊 Testing...' : '🔊 Test Browser Voice'}
          </ActionButton>
          
          <ActionButton 
            onClick={() => testVoice('bark')} 
            disabled={testing || !barkStatus?.models_loaded}
            variant={barkStatus?.models_loaded ? 'success' : 'secondary'}
          >
            {testing && selectedProvider === 'bark' ? '🎤 Testing...' : 
             barkStatus?.models_loaded ? '🎤 Test Bark AI Voice' : '⏳ Bark Loading...'}
          </ActionButton>
        </div>
      </div>

      {barkStatus && !barkStatus.models_loaded && (
        <div style={{
          background: 'rgba(241,196,15,0.1)',
          border: '1px solid #F1C40F',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          color: '#F1C40F'
        }}>
          <strong>🔄 Bark Models Loading</strong><br />
          The AI voice models are currently loading (this can take 5-10 minutes on first startup).
          You can use the browser voice in the meantime, and Bark will become available automatically.
        </div>
      )}

      <LogArea>
        <div style={{ color: '#3498DB', marginBottom: '8px', fontWeight: 'bold' }}>
          Activity Log:
        </div>
        {logs.map((log, index) => (
          <LogEntry key={index}>{log}</LogEntry>
        ))}
      </LogArea>
    </StatusContainer>
  );
};

export default VoiceStatus;