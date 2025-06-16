import React, { useState, useEffect } from 'react';
import startupService from '../services/StartupService';

const StartupStatus = ({ onComplete }) => {
  const [services, setServices] = useState([]);
  const [overallStatus, setOverallStatus] = useState('starting');
  const [showDetails, setShowDetails] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Initialize startup service
    startupService.initialize();

    // Listen for startup events
    startupService.onStartup((event, data) => {
      const timestamp = new Date().toLocaleTimeString();
      
      switch (event) {
        case 'startup_begin':
          setLogs(prev => [...prev, `${timestamp} - Starting Sephia AI services...`]);
          break;
        case 'service_starting':
          setLogs(prev => [...prev, `${timestamp} - Starting ${data.name}...`]);
          break;
        case 'service_progress':
          setLogs(prev => [...prev, `${timestamp} - ${data.name}: ${Math.round(data.progress)}% loaded`]);
          break;
        case 'service_ready':
          setLogs(prev => [...prev, `${timestamp} - ✅ ${data.name} ready (${data.elapsed}s)`]);
          break;
        case 'service_error':
          setLogs(prev => [...prev, `${timestamp} - ❌ ${data.name} failed: ${data.error}`]);
          break;
        case 'service_timeout':
          setLogs(prev => [...prev, `${timestamp} - ⏰ ${data.name} startup timeout`]);
          break;
        case 'startup_complete':
          setLogs(prev => [...prev, `${timestamp} - 🚀 Sephia is ready!`]);
          setTimeout(() => onComplete && onComplete(), 2000);
          break;
      }
    });

    // Listen for status changes
    startupService.onStatusChange((service, status, overall) => {
      setServices(startupService.getAllStatuses());
      setOverallStatus(overall);
    });

    // Initial status
    setServices(startupService.getAllStatuses());

    return () => {
      // Cleanup if needed
    };
  }, [onComplete]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
      case 'ready':
        return '✅';
      case 'starting':
      case 'loading':
        return '🔄';
      case 'stopped':
        return '⭕';
      case 'error':
      case 'timeout':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
      case 'ready':
        return '#4CAF50';
      case 'starting':
      case 'loading':
        return '#FF9800';
      case 'stopped':
        return '#9E9E9E';
      case 'error':
      case 'timeout':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getOverallProgress = () => {
    const readyCount = services.filter(s => s.status === 'running' || s.status === 'ready').length;
    return Math.round((readyCount / Math.max(services.length, 1)) * 100);
  };

  const handleRestartService = async (service) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - Restarting ${service}...`]);
    await startupService.restartService(service);
  };

  if (overallStatus === 'ready') {
    return null; // Hide when everything is ready
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      minWidth: '300px',
      maxWidth: '400px',
      zIndex: 9999,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: '600' 
          }}>
            🧠⚡ Starting Sephia
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
        
        {/* Progress bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          height: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#4CAF50',
            height: '100%',
            width: `${getOverallProgress()}%`,
            transition: 'width 0.3s ease',
            borderRadius: '8px'
          }} />
        </div>
        <div style={{ 
          fontSize: '12px', 
          opacity: 0.8, 
          marginTop: '4px',
          textAlign: 'center'
        }}>
          {getOverallProgress()}% Complete
        </div>
      </div>

      {/* Services Status */}
      <div style={{ marginBottom: showDetails ? '15px' : '0' }}>
        {services.map(service => (
          <div key={service.service} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            marginBottom: '6px',
            border: `1px solid ${getStatusColor(service.status)}20`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>
                {getStatusIcon(service.status)}
              </span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>
                  {service.name}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.7,
                  color: getStatusColor(service.status)
                }}>
                  :{service.port} • {service.status}
                </div>
              </div>
            </div>
            
            {(service.status === 'error' || service.status === 'timeout') && (
              <button
                onClick={() => handleRestartService(service.service)}
                style={{
                  background: '#FF9800',
                  border: 'none',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Restart
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Logs */}
      {showDetails && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          padding: '10px',
          maxHeight: '200px',
          overflowY: 'auto',
          fontSize: '11px',
          fontFamily: 'Monaco, Consolas, monospace'
        }}>
          {logs.slice(-10).map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '2px',
              opacity: index === logs.length - 1 ? 1 : 0.7
            }}>
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ 
        marginTop: '12px', 
        display: 'flex', 
        gap: '8px',
        fontSize: '12px'
      }}>
        <button
          onClick={() => startupService.startAllServices()}
          style={{
            background: '#4CAF50',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          Retry All
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StartupStatus;