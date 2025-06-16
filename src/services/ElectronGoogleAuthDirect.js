// Direct token approach for Google OAuth in Electron
class ElectronGoogleAuthDirect {
  constructor() {
    this.clientId = localStorage.getItem('google_client_id');
    this.clientSecret = localStorage.getItem('google_client_secret');
    this.apiKey = localStorage.getItem('google_api_key');
    this.accessToken = localStorage.getItem('google_access_token');
    this.refreshToken = localStorage.getItem('google_refresh_token');
  }

  async authenticate() {
    // If we already have a token, try to use it
    if (this.accessToken) {
      console.log('[ElectronGoogleAuthDirect] Using existing access token');
      return true;
    }

    // If we have a refresh token, try to get a new access token
    if (this.refreshToken) {
      console.log('[ElectronGoogleAuthDirect] Using refresh token to get new access token');
      try {
        await this.refreshAccessToken();
        return true;
      } catch (error) {
        console.error('[ElectronGoogleAuthDirect] Failed to refresh token:', error);
      }
    }

    throw new Error('No Google authentication available. Access token and refresh token are missing.');
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('[ElectronGoogleAuthDirect] Refreshing access token...');
    console.log('[ElectronGoogleAuthDirect] Using credentials:', {
      client_id: this.clientId,
      client_secret: this.clientSecret ? 'SET' : 'NOT SET',
      refresh_token: this.refreshToken ? 'SET' : 'NOT SET'
    });

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret || '',
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token'
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
      console.error('[ElectronGoogleAuthDirect] Token refresh failed:', error);
      console.error('[ElectronGoogleAuthDirect] Request params:', params.toString());
      
      try {
        const errorData = JSON.parse(error);
        if (errorData.error === 'invalid_client') {
          throw new Error('Invalid client credentials. Please check your Client ID and Client Secret.');
        } else if (errorData.error === 'invalid_grant') {
          throw new Error('Invalid refresh token. You may need to re-authenticate.');
        }
        throw new Error(errorData.error_description || errorData.error);
      } catch (e) {
        throw new Error('Failed to refresh token: ' + error);
      }
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    localStorage.setItem('google_access_token', this.accessToken);
    
    console.log('[ElectronGoogleAuthDirect] Access token refreshed successfully');
    return this.accessToken;
  }

  async getValidAccessToken() {
    // If we have a refresh token but no access token, refresh it
    if (!this.accessToken && this.refreshToken) {
      return await this.refreshAccessToken();
    }
    
    return this.accessToken;
  }

  isAuthenticated() {
    return !!(this.accessToken || this.refreshToken);
  }

  getApiKey() {
    return this.apiKey;
  }
}

export default ElectronGoogleAuthDirect;