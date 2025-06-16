// Patched version of ElectronGoogleAuthDirect that uses GoogleCalendarAccountManager
import accountManager from './GoogleCalendarAccountManager';

class ElectronGoogleAuthDirectPatched {
  constructor() {
    this.clientId = localStorage.getItem('google_client_id');
    this.clientSecret = localStorage.getItem('google_client_secret');
    this.apiKey = localStorage.getItem('google_api_key');
  }

  // Get access token for current account
  get accessToken() {
    return accountManager.getAccessToken();
  }

  // Get refresh token for current account
  get refreshToken() {
    return accountManager.getRefreshToken();
  }

  async authenticate() {
    // If we already have a token, try to use it
    if (this.accessToken) {
      console.log('[ElectronGoogleAuthDirect] Using existing access token for account:', accountManager.getCurrentAccountId());
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

  async refreshAccessToken(forceRefresh = false) {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('[ElectronGoogleAuthDirect] Refreshing access token for account:', accountManager.getCurrentAccountId());

    // Clear current access token if force refresh
    if (forceRefresh) {
      accountManager.setAccessToken('');
      accountManager.setTokenExpiry(0);
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret || '',
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token'
    });

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      const data = await response.json();
      console.log('[ElectronGoogleAuthDirect] Token response:', {
        ...data,
        access_token: data.access_token ? 'RECEIVED' : 'NOT RECEIVED',
        refresh_token: data.refresh_token ? 'RECEIVED' : 'NOT RECEIVED'
      });

      if (data.error) {
        console.error('[ElectronGoogleAuthDirect] Token refresh error:', data);
        if (data.error === 'invalid_client') {
          throw new Error('Invalid client credentials. Please check your Google OAuth client ID and secret.');
        } else if (data.error === 'invalid_grant') {
          // Clear invalid tokens
          accountManager.setAccessToken('');
          accountManager.setRefreshToken('');
          accountManager.setTokenExpiry(0);
          throw new Error('Invalid refresh token. Please re-authenticate with Google.');
        }
        throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
      }

      if (data.access_token) {
        // Store for current account
        accountManager.setAccessToken(data.access_token);
        
        // Calculate and store expiry time
        const expiresIn = data.expires_in || 3600;
        const expiresAt = Date.now() + (expiresIn * 1000);
        accountManager.setTokenExpiry(expiresAt);
        
        // ALSO update legacy localStorage keys for backward compatibility
        if (accountManager.getCurrentAccountId() === 'default') {
          localStorage.setItem('google_access_token', data.access_token);
          localStorage.setItem('google_token_expiry', expiresAt.toString());
          localStorage.setItem('google_token_expires_at', expiresAt.toString());
        }
        
        console.log('[ElectronGoogleAuthDirect] Access token refreshed successfully');
        return data.access_token;
      } else {
        throw new Error('No access token in response');
      }
    } catch (error) {
      console.error('[ElectronGoogleAuthDirect] Failed to refresh access token:', error);
      throw error;
    }
  }

  async getValidAccessToken() {
    console.log('[ElectronGoogleAuthDirect] Getting valid access token for account:', accountManager.getCurrentAccountId());
    
    // Debug token state
    const currentToken = this.accessToken;
    const currentRefresh = this.refreshToken;
    const tokenExpiry = accountManager.getTokenExpiry();
    
    console.log('[ElectronGoogleAuthDirect] Token state debug:', {
      hasAccessToken: !!currentToken,
      hasRefreshToken: !!currentRefresh,
      tokenExpiry: tokenExpiry ? new Date(tokenExpiry).toLocaleString() : 'No expiry',
      isExpired: tokenExpiry ? Date.now() > tokenExpiry : 'Unknown'
    });
    
    // Check if we have a token at all
    if (!currentToken && !currentRefresh) {
      throw new Error('No Google authentication available. Please authenticate first.');
    }
    
    // If we have a refresh token but no access token, refresh immediately
    if (!currentToken && currentRefresh) {
      console.log('[ElectronGoogleAuthDirect] No access token, refreshing...');
      await this.refreshAccessToken();
      return this.accessToken;
    }
    
    // Check if token is still valid (with 5 minute buffer)
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (!tokenExpiry || now >= (tokenExpiry - fiveMinutes)) {
      console.log('[ElectronGoogleAuthDirect] Token expired or expiring soon, refreshing...');
      await this.refreshAccessToken();
      return this.accessToken;
    }
    
    console.log('[ElectronGoogleAuthDirect] Current token is still valid');
    return this.accessToken;
  }

  isAuthenticated() {
    return !!this.accessToken || !!this.refreshToken;
  }

  // Save tokens for a new account
  saveTokensForNewAccount(tokens, accountId) {
    const currentAccount = accountManager.getCurrentAccountId();
    
    // Switch to new account temporarily
    accountManager.switchAccount(accountId);
    
    // Save tokens
    if (tokens.access_token) {
      accountManager.setAccessToken(tokens.access_token);
    }
    if (tokens.refresh_token) {
      accountManager.setRefreshToken(tokens.refresh_token);
    }
    if (tokens.expires_in) {
      const expiresAt = Date.now() + (tokens.expires_in * 1000);
      accountManager.setTokenExpiry(expiresAt);
    }
    
    // Add to accounts list
    accountManager.addAccountToList(accountId, tokens.email || accountId);
    
    // Stay on the new account
  }

  // Get all accounts
  getAllAccounts() {
    return accountManager.getAllAccounts();
  }

  // Switch account
  switchAccount(accountId) {
    accountManager.switchAccount(accountId);
  }

  // Get current account
  getCurrentAccountId() {
    return accountManager.getCurrentAccountId();
  }

  // Get API key (not account-specific)
  getApiKey() {
    return this.apiKey;
  }
}

export default ElectronGoogleAuthDirectPatched;