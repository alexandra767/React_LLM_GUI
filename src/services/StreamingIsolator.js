// Complete isolation of streaming content from React
class StreamingIsolator {
  constructor() {
    this.streamingContainer = null;
    this.originalContent = null;
    this.messageElement = null;
    this.isActive = false;
    this.mutationObserver = null;
    this.preventUpdates = false;
  }

  startIsolatedStreaming(messageId) {
    console.log('[StreamingIsolator] Starting isolated streaming for:', messageId);
    
    // Find the message element
    this.messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!this.messageElement) {
      console.error('[StreamingIsolator] Message element not found');
      return false;
    }

    // Find the content element
    const contentElement = this.messageElement.querySelector('.message-content');
    if (!contentElement) {
      console.error('[StreamingIsolator] Content element not found');
      return false;
    }

    // Create an isolated container
    this.streamingContainer = document.createElement('div');
    this.streamingContainer.className = 'isolated-streaming-content';
    this.streamingContainer.style.cssText = contentElement.style.cssText;
    
    // Store original content
    this.originalContent = contentElement.innerHTML;
    
    // Replace content with isolated container
    contentElement.innerHTML = '';
    contentElement.appendChild(this.streamingContainer);
    
    // Start monitoring for unwanted DOM changes
    this.startMutationMonitoring();
    
    // Set flags
    this.isActive = true;
    this.preventUpdates = true;
    
    // Freeze React updates
    this.freezeReactUpdates();
    
    return true;
  }

  updateContent(content) {
    if (!this.isActive || !this.streamingContainer) {
      console.warn('[StreamingIsolator] Not active or container missing');
      return;
    }

    // Update only the isolated container
    requestAnimationFrame(() => {
      if (this.streamingContainer) {
        this.streamingContainer.innerHTML = this.formatContent(content);
        
        // Maintain scroll position
        const scrollContainer = this.messageElement?.closest('[class*="MessagesContainer"]');
        if (scrollContainer) {
          const wasAtBottom = (scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight) < 100;
          if (wasAtBottom) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }
    });
  }

  completeStreaming() {
    console.log('[StreamingIsolator] Completing streaming');
    
    // Remove any blinking cursor indicators immediately
    if (this.messageElement) {
      const blinkingCursor = this.messageElement.querySelector('span[style*="animation: blink"]');
      if (blinkingCursor) {
        blinkingCursor.remove();
      }
    }
  }

  stopIsolatedStreaming() {
    console.log('[StreamingIsolator] Stopping isolated streaming');
    
    // Remove any blinking cursor indicators
    if (this.messageElement) {
      const blinkingCursor = this.messageElement.querySelector('span[style*="animation: blink"]');
      if (blinkingCursor) {
        blinkingCursor.remove();
      }
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    // Restore React updates
    this.unfreezeReactUpdates();
    
    this.isActive = false;
    this.preventUpdates = false;
    this.streamingContainer = null;
    this.messageElement = null;
  }

  startMutationMonitoring() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      if (!this.preventUpdates) return;

      mutations.forEach((mutation) => {
        // Check if mutation affects our streaming content
        if (mutation.target === this.streamingContainer || 
            this.streamingContainer?.contains(mutation.target)) {
          // Allow our own updates
          return;
        }

        // Check if mutation is trying to modify our message
        if (this.messageElement?.contains(mutation.target)) {
          console.warn('[StreamingIsolator] Blocking external mutation during streaming');
          
          // Revert the mutation
          if (mutation.type === 'childList') {
            mutation.removedNodes.forEach(node => {
              mutation.target.insertBefore(node, mutation.nextSibling);
            });
            mutation.addedNodes.forEach(node => {
              mutation.target.removeChild(node);
            });
          } else if (mutation.type === 'attributes') {
            mutation.target.setAttribute(mutation.attributeName, mutation.oldValue);
          }
        }
      });
    });

    // Monitor the entire document for changes
    this.mutationObserver.observe(document.body, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });
  }

  freezeReactUpdates() {
    // Override React's render methods temporarily
    if (window.React && window.React.Component) {
      this._originalSetState = window.React.Component.prototype.setState;
      this._originalForceUpdate = window.React.Component.prototype.forceUpdate;
      
      window.React.Component.prototype.setState = function(...args) {
        if (window.__isStreaming) {
          console.warn('[StreamingIsolator] Blocking setState during streaming');
          return;
        }
        return this._originalSetState?.apply(this, args);
      };
      
      window.React.Component.prototype.forceUpdate = function(...args) {
        if (window.__isStreaming) {
          console.warn('[StreamingIsolator] Blocking forceUpdate during streaming');
          return;
        }
        return this._originalForceUpdate?.apply(this, args);
      };
    }
  }

  unfreezeReactUpdates() {
    // Restore React's render methods
    if (window.React && window.React.Component) {
      if (this._originalSetState) {
        window.React.Component.prototype.setState = this._originalSetState;
      }
      if (this._originalForceUpdate) {
        window.React.Component.prototype.forceUpdate = this._originalForceUpdate;
      }
    }
  }

  formatContent(content) {
    // Parse thinking tags
    const thinkRegex = /<think>([\s\S]*?)<\/think>/;
    const match = content.match(thinkRegex);
    
    let formattedContent = content;
    
    if (match) {
      const thinking = match[1];
      const answer = content.replace(thinkRegex, '').trim();
      
      // Format thinking section
      const thinkingHtml = `
        <div class="thinking-section" style="
          background-color: rgba(138, 180, 248, 0.08);
          border: 1px solid rgba(138, 180, 248, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
          font-style: italic;
          color: rgba(200, 200, 200, 0.9);
        ">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="color: rgba(138, 180, 248, 0.8); margin-right: 8px;">🧠</span>
            <span style="font-size: 0.85em; color: rgba(138, 180, 248, 1);">Thinking Process</span>
          </div>
          <div style="white-space: pre-wrap;">${this.escapeHtml(thinking)}</div>
        </div>
      `;
      
      formattedContent = thinkingHtml + (answer ? `<div>${this.escapeHtml(answer)}</div>` : '');
    } else {
      formattedContent = `<div style="white-space: pre-wrap;">${this.escapeHtml(content)}</div>`;
    }
    
    return formattedContent;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create singleton instance
const streamingIsolator = new StreamingIsolator();

// Export
export default streamingIsolator;