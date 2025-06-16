import { useState, useEffect } from 'react';

export const useStreamingContent = (messageId) => {
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    let lastContent = '';
    
    // Check if this message is the streaming one
    const checkStreaming = () => {
      const isThisMessageStreaming = window.__streamingMessageId === messageId && window.__isStreaming;
      
      if (isThisMessageStreaming) {
        const currentContent = window.__streamingContent || '';
        // Only update if content actually changed
        if (currentContent !== lastContent) {
          lastContent = currentContent;
          console.log('[useStreamingContent] Updating content for message:', {
            messageId,
            newLength: currentContent.length,
            preview: currentContent.substring(0, 50)
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
          // CRITICAL FIX: Only use final content if it's for THIS message
          // Don't use global streaming content that might be from other messages
          const finalContent = window.__streamingMessageId === messageId ? (window.__streamingContent || '') : '';
          if (finalContent && finalContent !== lastContent) {
            console.log('[useStreamingContent] Setting final content for this message:', finalContent.length);
            lastContent = finalContent;
            setContent(finalContent);
          } else {
            console.log('[useStreamingContent] Clearing streaming content - not for this message');
            // Clear streaming content if it's not for this message
            setContent('');
          }
        }
      }
    };
    
    // Initial check
    checkStreaming();
    
    // Use a throttled interval instead of requestAnimationFrame to reduce CPU usage
    const interval = setInterval(checkStreaming, 50); // Check every 50ms for balance between responsiveness and performance
    
    // Also listen for custom events
    const handleStreamUpdate = (event) => {
      if (event.detail?.messageId === messageId || event.detail?.messageId === 'all') {
        console.log('[useStreamingContent] Custom event received for message:', messageId);
        checkStreaming();
      }
    };
    
    window.addEventListener('streamingUpdate', handleStreamUpdate);
    window.addEventListener('streamingComplete', handleStreamUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('streamingUpdate', handleStreamUpdate);
      window.removeEventListener('streamingComplete', handleStreamUpdate);
    };
  }, [messageId]); // Remove content and isActive from dependencies to prevent re-renders
  
  return { streamingContent: content, isStreamingMessage: isActive };
};