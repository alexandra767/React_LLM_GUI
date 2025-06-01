import React, { Component } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import MainLayout from './components/Layout/MainLayout';
import StreamingTest from './components/StreamingTest';
import MemoryDebugger from './components/MemoryDebugger';
import './App.css';
import { testDirectStreaming } from './utils/testDirectStreaming';
import { exportAllData } from './utils/exportData';
import { diagnoseGoogleAuth } from './utils/diagnoseGoogleAuth';
import { testGoogleCalendarAPI } from './utils/testGoogleCalendarAPI';

// Make test function available globally
window.testDirectStreaming = testDirectStreaming;
window.exportSephiaData = exportAllData;
window.diagnoseGoogleAuth = diagnoseGoogleAuth;
window.testGoogleCalendarAPI = testGoogleCalendarAPI;

// Add memory debugger to global scope for easy access
window.showMemoryDebugger = () => {
  const debugDiv = document.getElementById('memory-debugger');
  if (debugDiv) {
    debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
  }
};

// Add keyboard shortcut for memory debugger (Ctrl+Shift+M)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'M') {
    e.preventDefault();
    window.showMemoryDebugger();
  }
});

// Error boundary component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          color: '#ff4444',
          backgroundColor: '#1E1E1E',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#FFFFFF' }}>{this.state.error?.message || 'An unknown error occurred'}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#FF643D',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <ErrorBoundary>
            <MainLayout />
            {/* <StreamingTest /> */}
            <div id="memory-debugger" style={{ display: 'none', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, overflow: 'auto' }}>
              <div style={{ backgroundColor: 'white', margin: '20px', borderRadius: '10px', maxHeight: '90vh', overflow: 'auto' }}>
                <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
                  <button onClick={() => window.showMemoryDebugger()} style={{ float: 'right', background: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px' }}>Close</button>
                  <h2>Memory Debugger</h2>
                </div>
                <MemoryDebugger />
              </div>
            </div>
          </ErrorBoundary>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;