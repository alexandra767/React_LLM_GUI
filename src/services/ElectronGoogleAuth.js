// Google OAuth implementation for Electron using device flow
class ElectronGoogleAuth {
  constructor() {
    this.clientId = localStorage.getItem('google_client_id');
    this.clientSecret = localStorage.getItem('google_client_secret');
    this.accessToken = localStorage.getItem('google_access_token');
    this.refreshToken = localStorage.getItem('google_refresh_token');
  }

  // Use Google's OAuth 2.0 device flow which works better for Electron
  async authenticate() {
    if (!this.clientId) {
      throw new Error('Google Client ID not configured. Please add it in Settings.');
    }

    // Step 1: Request device code
    console.log('[ElectronGoogleAuth] Requesting device code with client ID:', this.clientId);
    
    const deviceCodeResponse = await fetch('https://oauth2.googleapis.com/device/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly'
      })
    });

    if (!deviceCodeResponse.ok) {
      const errorText = await deviceCodeResponse.text();
      console.error('[ElectronGoogleAuth] Device code request failed:', deviceCodeResponse.status, errorText);
      
      // Parse error for better message
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error === 'invalid_client') {
          throw new Error('Invalid Client ID. Please check your Google Client ID in Settings.');
        }
        throw new Error(errorData.error_description || errorData.error || 'Failed to get device code');
      } catch (e) {
        throw new Error(`Failed to get device code: ${deviceCodeResponse.status} ${errorText}`);
      }
    }

    const deviceData = await deviceCodeResponse.json();
    
    // Open the verification URL in the user's browser
    if (window.require) {
      const { shell } = window.require('electron');
      shell.openExternal(deviceData.verification_url);
    }

    // Show the user code
    alert(`Please go to ${deviceData.verification_url} and enter this code:\n\n${deviceData.user_code}\n\nClick OK after you've authorized the app.`);

    // Step 2: Poll for the access token
    const tokenResponse = await this.pollForToken(deviceData.device_code, deviceData.interval || 5);
    
    if (tokenResponse.access_token) {
      this.accessToken = tokenResponse.access_token;
      this.refreshToken = tokenResponse.refresh_token;
      
      localStorage.setItem('google_access_token', this.accessToken);
      if (this.refreshToken) {
        localStorage.setItem('google_refresh_token', this.refreshToken);
      }
      
      return true;
    }
    
    throw new Error('Authorization failed');
  }

  async pollForToken(deviceCode, interval) {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret || '',
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        })
      });

      const data = await response.json();

      if (data.access_token) {
        return data;
      }

      if (data.error === 'authorization_pending') {
        // User hasn't authorized yet, wait and try again
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
        attempts++;
      } else if (data.error) {
        throw new Error(data.error_description || data.error);
      }
    }

    throw new Error('Authorization timeout');
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

export default ElectronGoogleAuth;