import React, { useState, useEffect } from 'react';
import startupService from '../services/StartupService';

const ServiceNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let nextId = 1;

    const addNotification = (message, type = 'info', duration = 4000) => {
      const notification = {
        id: nextId++,
        message,
        type,
        timestamp: Date.now()
      };

      setNotifications(prev => [...prev, notification]);

      // Auto remove after duration
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, duration);
    };

    // Listen for startup events
    startupService.onStartup((event, data) => {
      switch (event) {
        case 'service_ready':
          if (data.service === 'bark') {
            addNotification(`🎤 ${data.name} ready! AI voices now available.`, 'success', 5000);
          } else if (data.service === 'comfyui') {
            addNotification(`🎨 ${data.name} ready! Image generation available.`, 'success', 5000);
          } else if (data.service === 'ollama') {
            addNotification(`🤖 ${data.name} ready! LLM chat available.`, 'success', 5000);
          }
          break;
        case 'startup_complete':
          addNotification('🚀 All AI services ready! Sephia is fully operational.', 'success', 6000);
          break;
        case 'service_error':
          addNotification(`❌ ${data.name} failed to start. Check settings.`, 'error', 8000);
          break;
      }
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '350px'
    }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{
            background: notification.type === 'error' ? 'rgba(244, 67, 54, 0.95)' :
                       notification.type === 'success' ? 'rgba(76, 175, 80, 0.95)' :
                       'rgba(33, 150, 243, 0.95)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: '8px'
            }}
          >
            ×
          </button>
        </div>
      ))}
      
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ServiceNotification;