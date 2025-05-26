/**
 * Diagnostic utility for Google authentication issues
 */

export function diagnoseGoogleAuth() {
  console.log('=== Google Auth Diagnostic ===');
  
  // Check client credentials
  const clientId = localStorage.getItem('google_client_id');
  const clientSecret = localStorage.getItem('google_client_secret');
  const apiKey = localStorage.getItem('google_api_key');
  
  console.log('Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET');
  console.log('Client Secret:', clientSecret ? 'SET' : 'NOT SET');
  console.log('API Key:', apiKey ? 'SET' : 'NOT SET');
  
  // Check current account
  const currentAccount = localStorage.getItem('google_current_account') || 'default';
  console.log('\nCurrent Account:', currentAccount);
  
  // Check tokens for current account
  const accessToken = localStorage.getItem(`google_access_token_${currentAccount}`);
  const refreshToken = localStorage.getItem(`google_refresh_token_${currentAccount}`);
  const tokenExpiry = localStorage.getItem(`google_token_expires_at_${currentAccount}`);
  
  // Also check old format
  const oldAccessToken = localStorage.getItem('google_access_token');
  const oldRefreshToken = localStorage.getItem('google_refresh_token');
  const oldTokenExpiry = localStorage.getItem('google_token_expires_at');
  
  console.log('\nTokens for current account:');
  console.log('Access Token:', accessToken ? 'SET' : 'NOT SET');
  console.log('Refresh Token:', refreshToken ? 'SET' : 'NOT SET');
  console.log('Token Expiry:', tokenExpiry ? new Date(parseInt(tokenExpiry)).toLocaleString() : 'NOT SET');
  
  if (!accessToken && oldAccessToken) {
    console.log('\nOld format tokens found:');
    console.log('Old Access Token:', oldAccessToken ? 'SET' : 'NOT SET');
    console.log('Old Refresh Token:', oldRefreshToken ? 'SET' : 'NOT SET');
    console.log('Old Token Expiry:', oldTokenExpiry ? new Date(parseInt(oldTokenExpiry)).toLocaleString() : 'NOT SET');
  }
  
  // Check if token is expired
  if (tokenExpiry || oldTokenExpiry) {
    const expiry = parseInt(tokenExpiry || oldTokenExpiry);
    const now = Date.now();
    const isExpired = now >= expiry;
    console.log('\nToken Status:', isExpired ? 'EXPIRED' : 'VALID');
    if (isExpired) {
      console.log('Token expired:', Math.round((now - expiry) / 1000 / 60), 'minutes ago');
    } else {
      console.log('Token expires in:', Math.round((expiry - now) / 1000 / 60), 'minutes');
    }
  }
  
  // Check accounts list
  const accountsList = localStorage.getItem('google_calendar_accounts_list');
  if (accountsList) {
    try {
      const accounts = JSON.parse(accountsList);
      console.log('\nRegistered Accounts:', accounts.length);
      accounts.forEach(acc => {
        console.log(`- ${acc.id}: ${acc.email || acc.label}`);
      });
    } catch (e) {
      console.log('\nError parsing accounts list');
    }
  }
  
  console.log('\n=== End Diagnostic ===');
}

// Make it available globally for console use
window.diagnoseGoogleAuth = diagnoseGoogleAuth;