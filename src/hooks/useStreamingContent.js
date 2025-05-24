import { useState, useEffect } from 'react';

export const useStreamingContent = (messageId) => {
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    // Check if this message is the streaming one
    const checkStreaming = () => {
      const isThisMessageStreaming = window.__streamingMessageId === messageId && window.__isStreaming;
      
      if (isThisMessageStreaming) {
        const currentContent = window.__streamingContent || '';
        // Always update if content is different
        if (currentContent !== content) {
          console.log('[useStreamingContent] Updating content for message:', {
            messageId,
            newLength: currentContent.length,
            oldLength: content.length,
            preview: currentContent.substring(0, 50),
            actualContent: currentContent.substring(0, 100)
          });
          setContent(currentContent);
        }
        if (!isActive) {
          console.log('[useStreamingContent] Message is now streaming:', messageId);
          setIsActive(true);
        }
      } else {
        if (isActive) {
          console.log('[useStreamingContent] Message no longer streaming:', messageId);
          setIsActive(false);
          // Keep the last content when streaming stops
          const finalContent = window.__streamingContent || '';
          if (finalContent && finalContent !== content) {
            console.log('[useStreamingContent] Setting final content:', finalContent.length);
            setContent(finalContent);
          }
        }
      }
    };
    
    // Initial check
    checkStreaming();
    
    // Set up interval to check for updates
    const interval = setInterval(checkStreaming, 16); // Check every 16ms (60fps) for smooth updates
    
    // Also listen for custom events
    const handleStreamUpdate = (event) => {
      if (event.detail?.messageId === messageId) {
        console.log('[useStreamingContent] Custom event received for message:', messageId);
        checkStreaming();
      }
    };
    
    window.addEventListener('streamingUpdate', handleStreamUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('streamingUpdate', handleStreamUpdate);
    };
  }, [messageId, content, isActive]); // Include content and isActive in dependencies
  
  return { streamingContent: content, isStreamingMessage: isActive };
};