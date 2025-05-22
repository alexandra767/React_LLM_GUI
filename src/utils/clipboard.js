/**
 * Copy text to clipboard with fallback for older browsers
 * @param {string} text - The text to copy to clipboard
 * @returns {Promise<void>}
 */
export const copyToClipboard = (text) => {
  // If running in a browser environment
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers or non-browser environments
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea');
      textarea.value = text;
      
      // Make the textarea invisible
      textarea.style.position = 'fixed';
      textarea.style.opacity = 0;
      textarea.style.left = '-9999px';
      textarea.style.top = '10px';
      
      // Add to document
      document.body.appendChild(textarea);
      
      // Select and copy
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textarea);
      
      if (successful) {
        resolve();
      } else {
        throw new Error('Failed to copy text');
      }
    } catch (err) {
      reject(err);
    }
  });
};

// Export as default
export default copyToClipboard;
