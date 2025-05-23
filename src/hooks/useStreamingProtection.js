import { useEffect, useRef } from 'react';

// Custom hook to protect components from unmounting during streaming
export const useStreamingProtection = (componentName) => {
  const mountTimeRef = useRef(Date.now());
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;
    
    // Log render information
    const renderInfo = {
      component: componentName,
      renderCount: renderCountRef.current,
      timeSinceMount: Date.now() - mountTimeRef.current,
      isStreaming: window.__isStreaming,
      streamingMessageId: window.__streamingMessageId
    };
    
    console.log(`[StreamingProtection] ${componentName} render:`, renderInfo);
    
    // Warn if component is re-rendering too frequently during streaming
    if (window.__isStreaming && renderCountRef.current > 5) {
      console.warn(`[StreamingProtection] ${componentName} is re-rendering excessively during streaming!`, {
        renderCount: renderCountRef.current,
        streamingContent: window.__streamingContent?.length || 0
      });
    }
  });

  useEffect(() => {
    // Component mount
    console.log(`[StreamingProtection] ${componentName} MOUNTED`, {
      isStreaming: window.__isStreaming,
      timestamp: Date.now()
    });

    return () => {
      // Component unmount
      console.error(`[StreamingProtection] ${componentName} UNMOUNTING!`, {
        isStreaming: window.__isStreaming,
        streamingMessageId: window.__streamingMessageId,
        streamingContent: window.__streamingContent?.length || 0,
        renderCount: renderCountRef.current,
        lifetime: Date.now() - mountTimeRef.current
      });
      
      // Stack trace to find what's causing the unmount
      if (window.__isStreaming) {
        console.trace(`[StreamingProtection] ${componentName} unmounting during streaming - STACK TRACE`);
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCountRef.current,
    isProtected: window.__isStreaming
  };
};