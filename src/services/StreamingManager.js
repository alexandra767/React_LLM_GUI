import streamingIsolator from './StreamingIsolator';

// Global streaming state manager outside of React
class StreamingManager {
  constructor() {
    this.isStreaming = false;
    this.streamingContent = '';
    this.streamingMessageId = null;
    this.streamingBuffer = null;
    this.deferredUpdates = [];
    this.listeners = new Set();
  }

  startStreaming(messageId, projectId) {
    console.log('[StreamingManager] Starting streaming', { messageId, projectId });
    this.isStreaming = true;
    this.streamingMessageId = messageId;
    this.streamingContent = '';
    
    // Set global flags
    window.__isStreaming = true;
    window.__streamingMessageId = messageId;
    window.__streamingContent = '';
    
    // Skip isolated streaming for now - it's causing more problems than it solves
    // The React state updates will handle the display
    console.log('[StreamingManager] Using React state updates for streaming display');
    
    // Notify listeners
    this.notifyListeners('start');
  }

  updateContent(content) {
    this.streamingContent = content;
    window.__streamingContent = content;
    
    // Use isolated streaming if available
    if (streamingIsolator.isActive) {
      streamingIsolator.updateContent(content);
    } else {
      // Fallback to direct DOM update
      this.updateStreamingDOM(content);
    }
  }

  completeStreaming() {
    console.log('[StreamingManager] Marking streaming as complete');
    
    // Mark streaming as complete in the isolator
    if (streamingIsolator.isActive) {
      streamingIsolator.completeStreaming();
    }
  }

  updateStreamingDOM(content) {
    // Don't manipulate DOM directly - let React handle it
    // This prevents DOM manipulation errors
    console.log('[StreamingManager] DOM update skipped - using React state instead');
  }

  formatContent(content) {
    // Basic formatting - preserve content as-is but add line breaks
    return content
      .replace(/\n/g, '<br>')
      .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
  }

  stopStreaming() {
    console.log('[StreamingManager] Stopping streaming');
    this.isStreaming = false;
    
    // Stop isolated streaming
    streamingIsolator.stopIsolatedStreaming();
    
    // Clear global flags
    window.__isStreaming = false;
    
    // Process deferred updates
    this.processDeferredUpdates();
    
    // Notify listeners
    this.notifyListeners('stop');
    
    // Clear state after a delay
    setTimeout(() => {
      this.streamingMessageId = null;
      this.streamingContent = '';
      window.__streamingMessageId = null;
      window.__streamingContent = '';
    }, 1000);
  }

  deferUpdate(update) {
    if (this.isStreaming) {
      console.log('[StreamingManager] Deferring update during streaming');
      this.deferredUpdates.push(update);
    } else {
      update();
    }
  }

  processDeferredUpdates() {
    console.log('[StreamingManager] Processing deferred updates:', this.deferredUpdates.length);
    const updates = [...this.deferredUpdates];
    this.deferredUpdates = [];
    
    // Process updates after a delay to ensure streaming is fully complete
    setTimeout(() => {
      updates.forEach(update => {
        try {
          update();
        } catch (error) {
          console.error('[StreamingManager] Error processing deferred update:', error);
        }
      });
    }, 100);
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event, this);
      } catch (error) {
        console.error('[StreamingManager] Error notifying listener:', error);
      }
    });
  }

  // Get current state
  getState() {
    return {
      isStreaming: this.isStreaming,
      streamingContent: this.streamingContent,
      streamingMessageId: this.streamingMessageId
    };
  }
}

// Create singleton instance
const streamingManager = new StreamingManager();

// Note: React override removed to prevent issues
// Updates are now handled through DOM manipulation and deferred updates

export default streamingManager;