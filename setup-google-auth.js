// Script to help set up Google authentication in Sephia
// Run this in the Electron app's DevTools console

console.log('🧠⚡ Sephia Google Authentication Setup');
console.log('=====================================\n');

// Check current authentication status
function checkCurrentAuth() {
  console.log('📋 Current Authentication Status:\n');
  
  const credentials = {
    clientId: localStorage.getItem('google_client_id'),
    clientSecret: localStorage.getItem('google_client_secret'),
    apiKey: localStorage.getItem('google_api_key'),
    accessToken: localStorage.getItem('google_access_token'),
    refreshToken: localStorage.getItem('google_refresh_token')
  };
  
  // Check multi-account tokens
  const accountsList = localStorage.getItem('google_calendar_accounts_list');
  const accounts = accountsList ? JSON.parse(accountsList) : [];
  
  console.log('Client ID:', credentials.clientId ? '✅ Set' : '❌ Missing');
  console.log('Client Secret:', credentials.clientSecret ? '✅ Set' : '❌ Missing');
  console.log('API Key:', credentials.apiKey ? '✅ Set' : '❌ Missing');
  console.log('Access Token:', credentials.accessToken ? '✅ Set' : '❌ Missing');
  console.log('Refresh Token:', credentials.refreshToken ? '✅ Set' : '❌ Missing');
  console.log('Multi-account support:', accounts.length > 0 ? `✅ ${accounts.length} accounts` : '❌ No accounts');
  
  return credentials;
}

// Set up Google OAuth credentials
function setupCredentials(clientId, clientSecret, apiKey) {
  if (!clientId || !clientSecret) {
    console.error('❌ Client ID and Client Secret are required!');
    console.log('\nTo get these credentials:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create a new project or select existing');
    console.log('3. Enable Google Drive API and Gmail API');
    console.log('4. Create OAuth 2.0 credentials');
    console.log('5. Add http://localhost as authorized redirect URI');
    return false;
  }
  
  localStorage.setItem('google_client_id', clientId);
  localStorage.setItem('google_client_secret', clientSecret);
  if (apiKey) localStorage.setItem('google_api_key', apiKey);
  
  console.log('✅ Credentials saved!');
  return true;
}

// Set up tokens obtained from OAuth Playground
function setupTokens(accessToken, refreshToken) {
  if (!refreshToken) {
    console.error('❌ Refresh token is required for permanent access!');
    return false;
  }
  
  localStorage.setItem('google_access_token', accessToken);
  localStorage.setItem('google_refresh_token', refreshToken);
  
  // Also set up for multi-account system
  const accountId = 'default';
  localStorage.setItem(`google_access_token_${accountId}`, accessToken);
  localStorage.setItem(`google_refresh_token_${accountId}`, refreshToken);
  
  // Set token expiry (1 hour from now)
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
  localStorage.setItem(`google_token_expires_at_${accountId}`, expiresAt);
  
  console.log('✅ Tokens saved!');
  console.log('✅ Multi-account system configured!');
  return true;
}

// Interactive setup
window.setupGoogleAuth = function() {
  console.log('\n🚀 Interactive Google Auth Setup\n');
  console.log('Follow these steps:\n');
  
  const current = checkCurrentAuth();
  
  if (!current.clientId || !current.clientSecret) {
    console.log('\n📝 Step 1: Set up OAuth Credentials');
    console.log('Run this command with your credentials:');
    console.log(`setupCredentials('YOUR_CLIENT_ID', 'YOUR_CLIENT_SECRET', 'YOUR_API_KEY')`);
    return;
  }
  
  if (!current.refreshToken) {
    console.log('\n📝 Step 2: Get Refresh Token');
    console.log('1. Go to: https://developers.google.com/oauthplayground/');
    console.log('2. Click gear icon and enter your credentials:');
    console.log(`   Client ID: ${current.clientId}`);
    console.log(`   Client Secret: ${current.clientSecret ? '[SET]' : '[MISSING]'}`);
    console.log('3. Select scopes:');
    console.log('   - https://www.googleapis.com/auth/drive.readonly');
    console.log('   - https://www.googleapis.com/auth/gmail.readonly');
    console.log('   - https://www.googleapis.com/auth/calendar.readonly');
    console.log('4. Authorize and get tokens');
    console.log('5. Run this command with your tokens:');
    console.log(`setupTokens('ACCESS_TOKEN', 'REFRESH_TOKEN')`);
    return;
  }
  
  console.log('\n✅ Google authentication is fully configured!');
  console.log('Try using @drive or @gmail commands in chat.');
};

// Export functions to window for console access
window.setupCredentials = setupCredentials;
window.setupTokens = setupTokens;
window.checkGoogleAuth = checkCurrentAuth;

// Run initial check
checkCurrentAuth();
console.log('\n💡 Run setupGoogleAuth() to start the setup process');
console.log('💡 Run checkGoogleAuth() to check current status');