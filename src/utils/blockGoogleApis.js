// Block Google APIs from loading in Electron
if (typeof window !== 'undefined' && window.process && window.process.type) {
  console.log('Blocking Google APIs in Electron...');
  
  // Override document.createElement to block Google API scripts and iframes
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && value && (value.includes('apis.google.com') || value.includes('accounts.google.com'))) {
          console.warn('Blocked Google API script:', value);
          return;
        }
        return originalSetAttribute.call(element, name, value);
      };
      
      // Also override the src property directly
      Object.defineProperty(element, 'src', {
        set: function(value) {
          if (value && (value.includes('apis.google.com') || value.includes('accounts.google.com'))) {
            console.warn('Blocked Google API script:', value);
            return;
          }
          element.setAttribute('src', value);
        },
        get: function() {
          return element.getAttribute('src');
        }
      });
    }
    
    // Also block iframe creation for Google accounts
    if (tagName.toLowerCase() === 'iframe') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && value && (value.includes('accounts.google.com') || value.includes('apis.google.com'))) {
          console.warn('Blocked Google iframe:', value);
          return;
        }
        return originalSetAttribute.call(element, name, value);
      };
      
      // Also override the src property directly
      Object.defineProperty(element, 'src', {
        set: function(value) {
          if (value && (value.includes('accounts.google.com') || value.includes('apis.google.com'))) {
            console.warn('Blocked Google iframe:', value);
            return;
          }
          element.setAttribute('src', value);
        },
        get: function() {
          return element.getAttribute('src');
        }
      });
    }
    
    return element;
  };
  
  // Block any existing gapi
  if (window.gapi) {
    delete window.gapi;
  }
  
  // Prevent gapi from being defined
  Object.defineProperty(window, 'gapi', {
    set: function() {
      console.warn('Blocked gapi from being set');
    },
    get: function() {
      return undefined;
    }
  });
  
  // Block google accounts iframe
  Object.defineProperty(window, 'google', {
    set: function() {
      console.warn('Blocked google object from being set');
    },
    get: function() {
      return undefined;
    }
  });
}