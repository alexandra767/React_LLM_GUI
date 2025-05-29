import React from 'react';
import styled from '@emotion/styled';
import { useApp } from '../../context/AppContext';
import { WifiOff, Wifi, Cloud, CloudOff } from '@mui/icons-material';

const IndicatorContainer = styled('div')(({ visible }) => ({
  position: 'fixed',
  top: '16px',
  right: '16px',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.3s ease',
  transform: visible ? 'translateX(0)' : 'translateX(120%)',
  opacity: visible ? 1 : 0,
  pointerEvents: visible ? 'auto' : 'none',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
}));

const OfflineIndicator = styled(IndicatorContainer)(({ theme }) => ({
  backgroundColor: 'rgba(239, 68, 68, 0.9)',
  color: '#FFFFFF',
  border: '1px solid rgba(239, 68, 68, 0.3)',
}));

const OnlineIndicator = styled(IndicatorContainer)(({ theme }) => ({
  backgroundColor: 'rgba(34, 197, 94, 0.9)',
  color: '#FFFFFF',
  border: '1px solid rgba(34, 197, 94, 0.3)',
}));

const LocalModeIndicator = styled(IndicatorContainer)(({ theme }) => ({
  backgroundColor: 'rgba(59, 130, 246, 0.9)',
  color: '#FFFFFF',
  border: '1px solid rgba(59, 130, 246, 0.3)',
}));

const ModelInfo = styled('div')({
  fontSize: '12px',
  opacity: 0.9,
  marginTop: '2px'
});

const NetworkStatusIndicator = () => {
  const { networkStatus, currentModel } = useApp();
  const [showIndicator, setShowIndicator] = React.useState(false);
  const [lastStatus, setLastStatus] = React.useState(null);

  React.useEffect(() => {
    // Show indicator when status changes or when offline
    const statusChanged = lastStatus && (
      lastStatus.isOnline !== networkStatus.isOnline ||
      JSON.stringify(lastStatus.cloudApis) !== JSON.stringify(networkStatus.cloudApis)
    );

    if (!networkStatus.isOnline || statusChanged) {
      setShowIndicator(true);
      
      // Auto-hide after 5 seconds if online
      if (networkStatus.isOnline) {
        const timer = setTimeout(() => {
          setShowIndicator(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else if (networkStatus.isOnline && !statusChanged) {
      // Hide indicator when online and no recent changes
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 2000);
      return () => clearTimeout(timer);
    }

    setLastStatus(networkStatus);
  }, [networkStatus, lastStatus]);

  const getModelDisplayName = (model) => {
    if (model.includes('claude')) {
      if (model.includes('haiku')) return 'Claude Haiku';
      if (model.includes('sonnet')) return 'Claude Sonnet';
      return 'Claude';
    }
    if (model.includes('deepseek')) {
      if (model.includes('32b')) return 'DeepSeek 32B';
      if (model.includes('14b')) return 'DeepSeek 14B';
      if (model.includes('8b')) return 'DeepSeek 8B';
      return 'DeepSeek';
    }
    return model;
  };

  const isLocalModel = currentModel && !currentModel.includes('claude') && !currentModel.includes('gpt');

  if (!networkStatus.isOnline) {
    return (
      <OfflineIndicator visible={showIndicator}>
        <WifiOff fontSize="small" />
        <div>
          <div>Offline Mode</div>
          <ModelInfo>Using {getModelDisplayName(currentModel)}</ModelInfo>
        </div>
      </OfflineIndicator>
    );
  }

  if (isLocalModel) {
    return (
      <LocalModeIndicator visible={showIndicator}>
        <Wifi fontSize="small" />
        <div>
          <div>Local AI</div>
          <ModelInfo>{getModelDisplayName(currentModel)} • Private</ModelInfo>
        </div>
      </LocalModeIndicator>
    );
  }

  if (networkStatus.cloudApis.claude || networkStatus.cloudApis.openai) {
    return (
      <OnlineIndicator visible={showIndicator}>
        <Cloud fontSize="small" />
        <div>
          <div>Cloud AI Connected</div>
          <ModelInfo>{getModelDisplayName(currentModel)} • Online</ModelInfo>
        </div>
      </OnlineIndicator>
    );
  }

  return null;
};

export default NetworkStatusIndicator;