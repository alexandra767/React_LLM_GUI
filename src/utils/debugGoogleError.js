// Debug Google OAuth errors
if (typeof window !== 'undefined') {
  // Capture the error stack trace
  const originalError = window.Error;
  window.Error = function(...args) {
    const error = new originalError(...args);
    if (error.message && error.message.includes('idpiframe_initialization_failed')) {
      console.log('=== GOOGLE ERROR STACK TRACE ===');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
      console.log('================================');
    }
    return error;
  };

  // Monitor all script additions
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'SCRIPT' && node.src && 
            (node.src.includes('google') || node.src.includes('gapi'))) {
          console.log('=== SCRIPT ADDED ===');
          console.log('Script src:', node.src);
          console.log('Stack trace:', new Error().stack);
          console.log('===================');
        }
        if (node.tagName === 'IFRAME' && node.src && 
            (node.src.includes('google') || node.src.includes('accounts'))) {
          console.log('=== IFRAME ADDED ===');
          console.log('Iframe src:', node.src);
          console.log('Stack trace:', new Error().stack);
          console.log('===================');
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}