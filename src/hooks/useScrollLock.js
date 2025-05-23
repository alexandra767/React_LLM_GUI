import { useEffect, useRef } from 'react';

// Custom hook to prevent scroll-triggered re-renders during streaming
export const useScrollLock = (containerRef) => {
  const scrollPositionRef = useRef({ top: 0, height: 0 });
  const rafIdRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let isUpdating = false;
    
    const handleScroll = (e) => {
      // If streaming is active, prevent default scroll behavior that might trigger re-renders
      if (window.__isStreaming && !isUpdating) {
        console.log('[ScrollLock] Intercepting scroll during streaming');
        
        // Cancel any pending animation frame
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
        
        // Store current position
        scrollPositionRef.current = {
          top: container.scrollTop,
          height: container.scrollHeight
        };
        
        // Use RAF to handle scroll without triggering React updates
        rafIdRef.current = requestAnimationFrame(() => {
          isUpdating = true;
          
          // Apply scroll position directly
          if (container.scrollHeight !== scrollPositionRef.current.height) {
            // Content has grown, adjust scroll to maintain position
            const shouldFollowBottom = 
              (scrollPositionRef.current.height - scrollPositionRef.current.top - container.clientHeight) < 100;
            
            if (shouldFollowBottom) {
              container.scrollTop = container.scrollHeight - container.clientHeight;
            }
          }
          
          isUpdating = false;
          rafIdRef.current = null;
        });
      }
    };
    
    // Add passive scroll listener
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also monitor for content changes during streaming
    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        if (window.__isStreaming && entries.length > 0) {
          const entry = entries[0];
          const wasAtBottom = 
            (scrollPositionRef.current.height - scrollPositionRef.current.top - container.clientHeight) < 100;
          
          if (wasAtBottom) {
            // Keep scrolled to bottom during streaming
            requestAnimationFrame(() => {
              container.scrollTop = container.scrollHeight - container.clientHeight;
            });
          }
        }
      });
      
      resizeObserver.observe(container);
    }
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [containerRef]);
  
  return {
    lockScroll: () => {
      console.log('[ScrollLock] Locking scroll');
      if (containerRef.current) {
        containerRef.current.style.overflowY = 'hidden';
      }
    },
    unlockScroll: () => {
      console.log('[ScrollLock] Unlocking scroll');
      if (containerRef.current) {
        containerRef.current.style.overflowY = 'auto';
      }
    }
  };
};