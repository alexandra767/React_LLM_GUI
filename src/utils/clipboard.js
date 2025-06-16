/**
 * Copy text to clipboard with fallback for older browsers
 * @param {string} text - The text to copy to clipboard
 * @returns {Promise<void>}
 */
export const copyToClipboard = (text) => {
  // If no text is provided, resolve immediately
  if (!text) {
    return Promise.reject(new Error('No text provided to copy'));
  }

  // If running in a browser environment with modern clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
      .catch(err => {
        console.warn('Modern clipboard API failed, falling back to legacy method', err);
        return legacyCopyToClipboard(text);
      });
  }
  
  // Use legacy method for older browsers or non-secure contexts
  return legacyCopyToClipboard(text);
};

/**
 * Legacy method for copying text to clipboard
 * @param {string} text - The text to copy
 * @returns {Promise<void>}
 */
const legacyCopyToClipboard = (text) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea');
      textarea.value = text;
      
      // Make the textarea invisible
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      textarea.style.left = '0';
      textarea.style.top = '0';
      textarea.style.width = '1px';
      textarea.style.height = '1px';
      
      // Add to document
      document.body.appendChild(textarea);
      
      // Select and copy
      textarea.focus();
      textarea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (!successful) {
          throw new Error('execCommand returned false');
        }
        resolve();
      } catch (err) {
        reject(new Error('Failed to copy text using execCommand'));
      } finally {
        // Clean up
        document.body.removeChild(textarea);
      }
    } catch (err) {
      reject(new Error(`Failed to copy text: ${err.message}`));
    }
  });
};

// Export as default
export default copyToClipboard;
