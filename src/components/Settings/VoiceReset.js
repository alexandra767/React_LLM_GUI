import React from 'react';
import styled from '@emotion/styled';

const ResetButton = styled('button')({
  backgroundColor: '#F44336',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '4px',
  padding: '8px 16px',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: '#D32F2F'
  },
  '&:disabled': {
    backgroundColor: '#666666',
    cursor: 'not-allowed',
    opacity: 0.7
  }
});

const VoiceReset = ({ onReset, disabled = false }) => {
  const handleCompleteReset = async () => {
    console.log('[VoiceReset] 🔥 COMPLETE VOICE SYSTEM RESET...');
    
    try {
      // 1. Cancel all speech
      window.speechSynthesis.cancel();
      
      // 2. Clear localStorage voice settings
      localStorage.removeItem('sephia_voice_settings');
      
      // 3. Reset browser speech synthesis
      const voices = window.speechSynthesis.getVoices();
      console.log('[VoiceReset] Available voices after reset:', voices.length);
      
      // 4. Force page reload to completely reset voice system
      if (window.confirm('This will reset all voice settings and reload the page. Continue?')) {
        window.location.reload();
      }
      
    } catch (error) {
      console.error('[VoiceReset] Reset failed:', error);
      alert('Voice reset failed: ' + error.message);
    }
  };

  return (
    <ResetButton 
      onClick={handleCompleteReset}
      disabled={disabled}
      title="Complete voice system reset - clears all settings and reloads page"
    >
      🔥 RESET VOICE SYSTEM
    </ResetButton>
  );
};

export default VoiceReset;