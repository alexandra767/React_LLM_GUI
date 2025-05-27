/**
 * Multi-Account Google Calendar Service
 * Manages multiple Google Calendar accounts with separate authentication
 */

class MultiAccountGoogleCalendarService {
  constructor() {
    this.accounts = this.loadAccounts();
  }

  // Load saved accounts from localStorage
  loadAccounts() {
    try {
      const saved = localStorage.getItem('google_calendar_accounts');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load Google Calendar accounts:', error);
      return {};
    }
  }

  // Save accounts to localStorage
  saveAccounts() {
    try {
      localStorage.setItem('google_calendar_accounts', JSON.stringify(this.accounts));
    } catch (error) {
      console.error('Failed to save Google Calendar accounts:', error);
    }
  }

  // Get account-specific storage key
  getStorageKey(accountId, key) {
    return `google_${accountId}_${key}`;
  }

  // Add a new Google account
  async addAccount(accountId, credentials) {
    if (!accountId) {
      throw new Error('Account ID is required');
    }

    // Store credentials for this specific account
    const account = {
      id: accountId,
      email: credentials.email || accountId,
      addedAt: new Date().toISOString()
    };

    // Store tokens with account-specific keys
    if (credentials.access_token) {
      localStorage.setItem(this.getStorageKey(accountId, 'access_token'), credentials.access_token);
    }
    if (credentials.refresh_token) {
      localStorage.setItem(this.getStorageKey(accountId, 'refresh_token'), credentials.refresh_token);
    }
    if (credentials.expires_at) {
      localStorage.setItem(this.getStorageKey(accountId, 'expires_at'), credentials.expires_at.toString());
    }

    // Save account info
    this.accounts[accountId] = account;
    this.saveAccounts();

    return account;
  }

  // Get all connected accounts
  getAccounts() {
    return Object.values(this.accounts);
  }

  // Get specific account
  getAccount(accountId) {
    return this.accounts[accountId];
  }

  // Remove an account
  removeAccount(accountId) {
    // Remove all stored data for this account
    localStorage.removeItem(this.getStorageKey(accountId, 'access_token'));
    localStorage.removeItem(this.getStorageKey(accountId, 'refresh_token'));
    localStorage.removeItem(this.getStorageKey(accountId, 'expires_at'));
    
    // Remove from accounts list
    delete this.accounts[accountId];
    this.saveAccounts();
  }

  // Get access token for specific account
  getAccessToken(accountId) {
    return localStorage.getItem(this.getStorageKey(accountId, 'access_token'));
  }

  // Get refresh token for specific account
  getRefreshToken(accountId) {
    return localStorage.getItem(this.getStorageKey(accountId, 'refresh_token'));
  }

  // Check if access token is expired for specific account
  isTokenExpired(accountId) {
    const expiresAt = localStorage.getItem(this.getStorageKey(accountId, 'expires_at'));
    if (!expiresAt) return true;
    
    const expiryTime = parseInt(expiresAt, 10);
    const now = Date.now();
    return now >= expiryTime;
  }

  // Update access token for specific account
  updateAccessToken(accountId, accessToken, expiresIn) {
    localStorage.setItem(this.getStorageKey(accountId, 'access_token'), accessToken);
    const expiresAt = Date.now() + (expiresIn * 1000);
    localStorage.setItem(this.getStorageKey(accountId, 'expires_at'), expiresAt.toString());
  }

  // Get events from a specific account
  async getAccountEvents(accountId, startDate, endDate) {
    const accessToken = this.getAccessToken(accountId);
    if (!accessToken) {
      throw new Error(`No access token found for account: ${accountId}`);
    }

    // Check if token needs refresh
    if (this.isTokenExpired(accountId)) {
      // Token refresh should be handled by the auth service
      throw new Error(`Access token expired for account: ${accountId}`);
    }

    // Import the existing calendar service to fetch events
    const googleCalendarService = await import('./GoogleCalendarService');
    return googleCalendarService.default.getEvents(accessToken, startDate, endDate);
  }

  // Get events from all accounts
  async getAllAccountsEvents(startDate, endDate) {
    const allEvents = [];
    const errors = [];

    for (const accountId of Object.keys(this.accounts)) {
      try {
        const events = await this.getAccountEvents(accountId, startDate, endDate);
        // Tag events with account info
        const taggedEvents = events.map(event => ({
          ...event,
          accountId,
          accountEmail: this.accounts[accountId].email
        }));
        allEvents.push(...taggedEvents);
      } catch (error) {
        console.error(`Failed to fetch events for account ${accountId}:`, error);
        errors.push({ accountId, error: error.message });
      }
    }

    return { events: allEvents, errors };
  }

  // Migrate from single account to multi-account (one-time migration)
  migrateFromSingleAccount() {
    const existingToken = localStorage.getItem('google_access_token');
    const existingRefresh = localStorage.getItem('google_refresh_token');
    
    if (existingToken || existingRefresh) {
      // Create a default account from existing credentials
      const defaultAccountId = 'default';
      this.addAccount(defaultAccountId, {
        access_token: existingToken,
        refresh_token: existingRefresh,
        expires_at: localStorage.getItem('google_token_expires_at'),
        email: 'Default Account'
      });

      // Mark migration as complete
      localStorage.setItem('google_calendar_migrated', 'true');
      
      console.log('Migrated existing Google Calendar to multi-account system');
    }
  }
}

export default new MultiAccountGoogleCalendarService();