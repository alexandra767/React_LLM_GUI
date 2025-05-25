// Alternative Google OAuth using OAuth Playground approach
class ElectronGoogleAuthPlayground {
  constructor() {
    this.clientId = localStorage.getItem('google_client_id');
    this.clientSecret = localStorage.getItem('google_client_secret');
    this.accessToken = localStorage.getItem('google_access_token');
    this.refreshToken = localStorage.getItem('google_refresh_token');
  }

  async authenticate() {
    if (!this.clientId) {
      throw new Error('Google Client ID not configured. Please add it in Settings.');
    }

    // Create OAuth URL for standard flow
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    
    console.log('[ElectronGoogleAuthPlayground] Opening auth URL:', authUrl);

    // Open in browser
    if (window.require) {
      const { shell } = window.require('electron');
      shell.openExternal(authUrl);
    }

    // Show instructions using alert (since prompt doesn't work)
    alert(`Google Authorization Required:

1. A browser window has opened
2. Sign in to Google and authorize the app
3. You'll see an authorization code
4. Copy the code and paste it in the next dialog

Click OK to continue after you have the code.`);

    // Use a simple input dialog instead of prompt
    const code = await this.getAuthCode();
    
    if (!code) {
      throw new Error('Authorization cancelled');
    }

    // Exchange code for tokens
    const tokenResponse = await this.exchangeCodeForTokens(code);
    
    if (tokenResponse.access_token) {
      this.accessToken = tokenResponse.access_token;
      this.refreshToken = tokenResponse.refresh_token;
      
      localStorage.setItem('google_access_token', this.accessToken);
      if (this.refreshToken) {
        localStorage.setItem('google_refresh_token', this.refreshToken);
      }
      
      return true;
    }
    
    throw new Error('Failed to get access token');
  }

  async getAuthCode() {
    // Create a temporary input element
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Paste authorization code here';
    input.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 10px;
      font-size: 16px;
      border: 2px solid #4285f4;
      border-radius: 4px;
      width: 400px;
      z-index: 10000;
      background: white;
      color: black;
    `;
    
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 9999;
    `;
    
    const label = document.createElement('div');
    label.textContent = 'Paste Google authorization code:';
    label.style.cssText = `
      position: fixed;
      top: calc(50% - 40px);
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 18px;
      z-index: 10000;
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(label);
    document.body.appendChild(input);
    input.focus();
    
    return new Promise((resolve) => {
      const handleKeydown = (e) => {
        if (e.key === 'Enter') {
          const code = input.value.trim();
          document.body.removeChild(backdrop);
          document.body.removeChild(label);
          document.body.removeChild(input);
          input.removeEventListener('keydown', handleKeydown);
          resolve(code);
        } else if (e.key === 'Escape') {
          document.body.removeChild(backdrop);
          document.body.removeChild(label);
          document.body.removeChild(input);
          input.removeEventListener('keydown', handleKeydown);
          resolve(null);
        }
      };
      
      input.addEventListener('keydown', handleKeydown);
    });
  }

  async exchangeCodeForTokens(code) {
    const params = new URLSearchParams({
      code: code,
      client_id: this.clientId,
      client_secret: this.clientSecret || '',
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
      grant_type: 'authorization_code'
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[ElectronGoogleAuthPlayground] Token exchange failed:', error);
      throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret || '',
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    localStorage.setItem('google_access_token', this.accessToken);
    
    return this.accessToken;
  }

  async getValidAccessToken() {
    if (!this.accessToken) {
      await this.authenticate();
    }
    
    // TODO: Check if token is expired and refresh if needed
    return this.accessToken;
  }

  isAuthenticated() {
    return !!this.accessToken;
  }
}

export default ElectronGoogleAuthPlayground;