/**
 * Google Calendar Account Manager
 * Simple solution to handle multiple Google Calendar accounts
 * without breaking existing UI
 */

class GoogleCalendarAccountManager {
  constructor() {
    this.currentAccountId = localStorage.getItem('google_current_account') || 'default';
    
    // Auto-detect if we have existing tokens but no accounts list
    if (!localStorage.getItem('google_calendar_accounts_list')) {
      const hasOldTokens = localStorage.getItem('google_access_token') || 
                          localStorage.getItem('google_refresh_token');
      
      if (hasOldTokens) {
        // Create default account entry
        const defaultAccount = {
          id: 'default',
          label: 'Default Account',
          email: localStorage.getItem('google_account_email') || 'Default Account',
          addedAt: new Date().toISOString()
        };
        
        localStorage.setItem('google_calendar_accounts_list', JSON.stringify([defaultAccount]));
        console.log('[GoogleCalendarAccountManager] Created default account entry for existing tokens');
      }
    }
  }

  // Get account-specific storage key
  getAccountKey(baseKey) {
    return `${baseKey}_${this.currentAccountId}`;
  }

  // Switch to a different account
  switchAccount(accountId) {
    this.currentAccountId = accountId;
    localStorage.setItem('google_current_account', accountId);
  }

  // Get current account ID
  getCurrentAccountId() {
    return this.currentAccountId;
  }

  // Get access token for current account
  getAccessToken() {
    // Try account-specific first
    let token = localStorage.getItem(this.getAccountKey('google_access_token'));
    
    // Fall back to old format if using default account
    if (!token && this.currentAccountId === 'default') {
      token = localStorage.getItem('google_access_token');
    }
    
    return token;
  }

  // Set access token for current account
  setAccessToken(token) {
    localStorage.setItem(this.getAccountKey('google_access_token'), token);
  }

  // Get refresh token for current account
  getRefreshToken() {
    // Try account-specific first
    let token = localStorage.getItem(this.getAccountKey('google_refresh_token'));
    
    // Fall back to old format if using default account
    if (!token && this.currentAccountId === 'default') {
      token = localStorage.getItem('google_refresh_token');
    }
    
    return token;
  }

  // Set refresh token for current account
  setRefreshToken(token) {
    localStorage.setItem(this.getAccountKey('google_refresh_token'), token);
  }

  // Get token expiry for current account
  getTokenExpiry() {
    let expiry = localStorage.getItem(this.getAccountKey('google_token_expires_at'));
    
    // Fall back to old format if using default account
    if (!expiry && this.currentAccountId === 'default') {
      expiry = localStorage.getItem('google_token_expires_at') || 
               localStorage.getItem('google_token_expiry'); // Also check manual refresh format
    }
    
    return expiry ? parseInt(expiry, 10) : null;
  }

  // Set token expiry for current account
  setTokenExpiry(expiresAt) {
    localStorage.setItem(this.getAccountKey('google_token_expires_at'), expiresAt.toString());
  }

  // Check if current account has valid token
  hasValidToken() {
    const token = this.getAccessToken();
    const expiry = this.getTokenExpiry();
    
    if (!token) return false;
    if (!expiry) return true; // No expiry info, assume valid
    
    return Date.now() < expiry;
  }

  // Get list of all accounts
  getAllAccounts() {
    const accounts = [];
    const accountsData = localStorage.getItem('google_calendar_accounts_list');
    
    if (accountsData) {
      try {
        return JSON.parse(accountsData);
      } catch (e) {
        console.error('Failed to parse accounts list:', e);
      }
    }
    
    // Check for default account
    if (localStorage.getItem('google_access_token_default')) {
      accounts.push({
        id: 'default',
        label: 'Default Account',
        email: localStorage.getItem('google_account_email_default') || 'Unknown'
      });
    }
    
    return accounts;
  }

  // Add account to list
  addAccountToList(accountId, email) {
    const accounts = this.getAllAccounts();
    const existing = accounts.find(a => a.id === accountId);
    
    if (!existing) {
      accounts.push({
        id: accountId,
        label: email || accountId,
        email: email || 'Unknown',
        addedAt: new Date().toISOString()
      });
      
      localStorage.setItem('google_calendar_accounts_list', JSON.stringify(accounts));
      localStorage.setItem(this.getAccountKey('google_account_email'), email);
    }
  }

  // Remove account
  removeAccount(accountId) {
    // Remove tokens
    localStorage.removeItem(`google_access_token_${accountId}`);
    localStorage.removeItem(`google_refresh_token_${accountId}`);
    localStorage.removeItem(`google_token_expires_at_${accountId}`);
    localStorage.removeItem(`google_account_email_${accountId}`);
    
    // Update accounts list
    const accounts = this.getAllAccounts().filter(a => a.id !== accountId);
    localStorage.setItem('google_calendar_accounts_list', JSON.stringify(accounts));
    
    // Switch to another account if this was current
    if (this.currentAccountId === accountId && accounts.length > 0) {
      this.switchAccount(accounts[0].id);
    }
  }

  // Create new account ID
  createNewAccountId() {
    return `account_${Date.now()}`;
  }
}

export default new GoogleCalendarAccountManager();