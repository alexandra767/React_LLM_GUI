/**
 * Multi-Account Google OAuth Service for Electron
 * Handles authentication for multiple Google accounts
 */

import ElectronGoogleAuth from './ElectronGoogleAuth';
import ElectronGoogleAuthDirect from './ElectronGoogleAuthDirect';
import multiAccountGoogleCalendarService from './MultiAccountGoogleCalendarService';

class ElectronGoogleAuthMultiAccount {
  constructor() {
    this.authInstances = new Map();
    
    // Check for migration from single account
    if (!localStorage.getItem('google_calendar_migrated')) {
      multiAccountGoogleCalendarService.migrateFromSingleAccount();
    }
  }

  // Get or create auth instance for specific account
  getAuthInstance(accountId) {
    if (!this.authInstances.has(accountId)) {
      // Create a new auth instance that uses account-specific storage
      const authInstance = new ElectronGoogleAuthDirect();
      
      // Override the storage methods to use account-specific keys
      authInstance.getStorageKey = (key) => {
        return multiAccountGoogleCalendarService.getStorageKey(accountId, key);
      };
      
      // Override token getters/setters
      authInstance.getAccessToken = () => {
        return localStorage.getItem(authInstance.getStorageKey('access_token'));
      };
      
      authInstance.getRefreshToken = () => {
        return localStorage.getItem(authInstance.getStorageKey('refresh_token'));
      };
      
      authInstance.isAuthenticated = () => {
        const token = authInstance.getAccessToken();
        return !!token;
      };
      
      this.authInstances.set(accountId, authInstance);
    }
    
    return this.authInstances.get(accountId);
  }

  // Start authentication flow for a new account
  async authenticateNewAccount(accountLabel) {
    try {
      // Generate a unique account ID
      const accountId = `account_${Date.now()}`;
      
      // Use the device flow authenticator
      const deviceAuth = new ElectronGoogleAuth();
      
      // Start the device flow
      const authResult = await deviceAuth.authenticate();
      
      if (authResult && authResult.access_token) {
        // Get user info to determine email
        let email = accountLabel || accountId;
        try {
          const userInfo = await this.getUserInfo(authResult.access_token);
          email = userInfo.email || email;
        } catch (error) {
          console.error('Failed to get user info:', error);
        }
        
        // Save the account with its credentials
        await multiAccountGoogleCalendarService.addAccount(accountId, {
          ...authResult,
          email,
          expires_at: Date.now() + (authResult.expires_in * 1000)
        });
        
        return {
          success: true,
          accountId,
          email
        };
      }
      
      throw new Error('Authentication failed - no access token received');
    } catch (error) {
      console.error('Failed to authenticate new account:', error);
      throw error;
    }
  }

  // Get user info from access token
  async getUserInfo(accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    return response.json();
  }

  // Get valid access token for specific account
  async getValidAccessToken(accountId) {
    const authInstance = this.getAuthInstance(accountId);
    
    // Check if token needs refresh
    if (multiAccountGoogleCalendarService.isTokenExpired(accountId)) {
      const refreshToken = multiAccountGoogleCalendarService.getRefreshToken(accountId);
      if (!refreshToken) {
        throw new Error('No refresh token available for account');
      }
      
      // Refresh the token
      const clientId = localStorage.getItem('google_client_id');
      const clientSecret = localStorage.getItem('google_client_secret');
      
      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not configured');
      }
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(`Token refresh failed: ${tokenData.error}`);
      }
      
      // Update the access token
      multiAccountGoogleCalendarService.updateAccessToken(
        accountId,
        tokenData.access_token,
        tokenData.expires_in
      );
      
      return tokenData.access_token;
    }
    
    return multiAccountGoogleCalendarService.getAccessToken(accountId);
  }

  // Disconnect a specific account
  disconnectAccount(accountId) {
    // Remove from auth instances
    this.authInstances.delete(accountId);
    
    // Remove from storage
    multiAccountGoogleCalendarService.removeAccount(accountId);
  }

  // Get all authenticated accounts
  getAuthenticatedAccounts() {
    return multiAccountGoogleCalendarService.getAccounts();
  }

  // Check if any accounts are authenticated
  hasAuthenticatedAccounts() {
    return Object.keys(multiAccountGoogleCalendarService.accounts).length > 0;
  }
}

export default new ElectronGoogleAuthMultiAccount();