/**
 * Migration script to fix existing Google Calendar tokens
 * Run this to migrate from old token storage to new account-based storage
 */

import accountManager from './GoogleCalendarAccountManager';

export function migrateExistingGoogleTokens() {
  console.log('[Migration] Starting Google Calendar token migration...');
  
  // Check if migration already done
  if (localStorage.getItem('google_tokens_migrated_v2')) {
    console.log('[Migration] Already migrated');
    return;
  }
  
  // Get existing tokens (old format)
  const oldAccessToken = localStorage.getItem('google_access_token');
  const oldRefreshToken = localStorage.getItem('google_refresh_token');
  const oldExpiresAt = localStorage.getItem('google_token_expires_at');
  
  if (!oldAccessToken && !oldRefreshToken) {
    console.log('[Migration] No existing tokens to migrate');
    localStorage.setItem('google_tokens_migrated_v2', 'true');
    return;
  }
  
  console.log('[Migration] Found existing tokens to migrate');
  
  // Create default account
  const defaultAccountId = 'default';
  
  // Store tokens with new account-specific keys
  if (oldAccessToken) {
    localStorage.setItem(`google_access_token_${defaultAccountId}`, oldAccessToken);
  }
  if (oldRefreshToken) {
    localStorage.setItem(`google_refresh_token_${defaultAccountId}`, oldRefreshToken);
  }
  if (oldExpiresAt) {
    localStorage.setItem(`google_token_expires_at_${defaultAccountId}`, oldExpiresAt);
  }
  
  // Set default as current account
  localStorage.setItem('google_current_account', defaultAccountId);
  
  // Add to accounts list
  const accountsList = [{
    id: defaultAccountId,
    label: 'Default Account',
    email: localStorage.getItem('google_account_email') || 'Default Account',
    addedAt: new Date().toISOString()
  }];
  
  localStorage.setItem('google_calendar_accounts_list', JSON.stringify(accountsList));
  
  // Mark migration as complete
  localStorage.setItem('google_tokens_migrated_v2', 'true');
  
  console.log('[Migration] Migration completed successfully');
}

// Auto-run migration when imported
migrateExistingGoogleTokens();