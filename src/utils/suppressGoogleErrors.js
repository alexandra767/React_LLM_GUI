// Suppress Google OAuth errors in Electron
if (typeof window !== 'undefined' && window.process && window.process.type) {
  // Override console.error to filter out Google OAuth errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Check if this is a Google OAuth error
    const errorString = args.join(' ');
    if (errorString.includes('idpiframe_initialization_failed') || 
        errorString.includes('gapi') ||
        errorString.includes('accounts.google.com')) {
      console.warn('[Suppressed Google OAuth Error]:', errorString);
      return;
    }
    // Otherwise, call the original console.error
    return originalConsoleError.apply(console, args);
  };

  // Also catch unhandled promise rejections related to Google
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && 
        (event.reason.message.includes('idpiframe_initialization_failed') ||
         event.reason.message.includes('gapi'))) {
      console.warn('[Suppressed Google OAuth Promise Rejection]:', event.reason);
      event.preventDefault();
    }
  });
  
  // Catch errors
  window.addEventListener('error', function(event) {
    if (event.message && 
        (event.message.includes('idpiframe_initialization_failed') ||
         event.message.includes('gapi'))) {
      console.warn('[Suppressed Google OAuth Error]:', event.message);
      event.preventDefault();
    }
  });
}