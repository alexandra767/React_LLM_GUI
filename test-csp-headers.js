// Test script to check CSP headers and image loading
const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const testWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Remove CSP headers
  testWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    console.log('[CSP Test] Original headers:', Object.keys(details.responseHeaders || {}));
    const responseHeaders = {...details.responseHeaders};
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];
    console.log('[CSP Test] Modified headers:', Object.keys(responseHeaders));
    callback({ responseHeaders });
  });

  // Load a test page with an image from localhost:8188
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>CSP Test</title>
    </head>
    <body>
      <h1>CSP Image Loading Test</h1>
      <p>Testing image from localhost:8188</p>
      <img src="http://localhost:8188/view?filename=test.png&subfolder=&type=output" 
           onload="console.log('Image loaded successfully!')" 
           onerror="console.log('Image failed to load:', event)"
           style="max-width: 500px; border: 2px solid green;">
      <script>
        // Log any CSP violations
        document.addEventListener('securitypolicyviolation', (e) => {
          console.error('CSP Violation:', {
            blockedURI: e.blockedURI,
            violatedDirective: e.violatedDirective,
            originalPolicy: e.originalPolicy
          });
        });
        
        // Check if CSP meta tag exists
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        console.log('CSP meta tag:', cspMeta ? cspMeta.content : 'None found');
        
        // Try to fetch from localhost:8188
        fetch('http://localhost:8188/')
          .then(r => console.log('Fetch successful:', r.status))
          .catch(e => console.log('Fetch failed:', e.message));
      </script>
    </body>
    </html>
  `;

  testWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(testHtml)}`);
  
  testWindow.webContents.openDevTools();
});

app.on('window-all-closed', () => {
  app.quit();
});