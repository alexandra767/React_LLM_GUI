// Check and preserve existing Google authentication
console.log('🧠⚡ Checking your existing Google authentication...\n');

// Function to check all Google-related localStorage items
function checkExistingAuth() {
  const authItems = {};
  const googleKeys = [];
  
  // Find all Google-related keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('google') || key.includes('Google'))) {
      googleKeys.push(key);
      authItems[key] = localStorage.getItem(key);
    }
  }
  
  console.log(`Found ${googleKeys.length} Google-related items in localStorage:\n`);
  
  // Check specific important items
  const important = {
    'google_client_id': authItems['google_client_id'],
    'google_client_secret': authItems['google_client_secret'],
    'google_api_key': authItems['google_api_key'],
    'google_refresh_token': authItems['google_refresh_token'],
    'google_access_token': authItems['google_access_token']
  };
  
  // Display status
  Object.entries(important).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`❌ ${key}: Not found`);
    }
  });
  
  // Check for multi-account tokens
  const multiAccountKeys = googleKeys.filter(k => k.includes('_default') || k.includes('account'));
  if (multiAccountKeys.length > 0) {
    console.log(`\n✅ Multi-account setup found (${multiAccountKeys.length} items)`);
  }
  
  // Check token expiry
  const expiryKey = googleKeys.find(k => k.includes('expires_at'));
  if (expiryKey) {
    const expiry = new Date(authItems[expiryKey]);
    const now = new Date();
    if (expiry > now) {
      console.log(`✅ Token expires at: ${expiry.toLocaleString()}`);
    } else {
      console.log(`⚠️  Token expired at: ${expiry.toLocaleString()}`);
      console.log('   (Will auto-refresh using refresh token)');
    }
  }
  
  return authItems;
}

// Function to backup all auth data
window.backupGoogleAuth = function() {
  const backup = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('google') || key.includes('Google'))) {
      backup[key] = localStorage.getItem(key);
    }
  }
  
  const backupStr = JSON.stringify(backup, null, 2);
  console.log('\n📋 Backup of all Google auth data:');
  console.log(backupStr);
  
  // Copy to clipboard
  copy(backupStr);
  console.log('\n✅ Backup copied to clipboard!');
  console.log('Save this somewhere safe.');
  
  return backup;
};

// Function to restore auth data
window.restoreGoogleAuth = function(backup) {
  if (typeof backup === 'string') {
    backup = JSON.parse(backup);
  }
  
  Object.entries(backup).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
  
  console.log('✅ Google auth restored from backup!');
  checkExistingAuth();
};

// Function to fix common issues
window.fixGoogleAuth = function() {
  console.log('\n🔧 Attempting to fix Google auth...\n');
  
  const hasRefreshToken = localStorage.getItem('google_refresh_token');
  const hasMultiAccount = localStorage.getItem('google_refresh_token_default');
  
  if (hasRefreshToken && !hasMultiAccount) {
    // Migrate to multi-account system
    console.log('Migrating to multi-account system...');
    localStorage.setItem('google_refresh_token_default', hasRefreshToken);
    localStorage.setItem('google_access_token_default', localStorage.getItem('google_access_token') || '');
    
    const accountsList = [{
      id: 'default',
      email: 'default@gmail.com',
      isActive: true
    }];
    localStorage.setItem('google_calendar_accounts_list', JSON.stringify(accountsList));
    console.log('✅ Migrated to multi-account system');
  }
  
  // Clear expired tokens to force refresh
  const expiryKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('expires_at')) {
      const expiry = new Date(localStorage.getItem(key));
      if (expiry < new Date()) {
        console.log(`Clearing expired token: ${key}`);
        localStorage.removeItem(key.replace('expires_at', 'access_token'));
      }
    }
  }
  
  console.log('\n✅ Auth fixes applied');
  console.log('Try using @drive command now');
};

// Run the check
const authData = checkExistingAuth();

// Provide instructions based on what's missing
console.log('\n💡 What to do next:\n');

if (!authData['google_client_id'] || !authData['google_client_secret']) {
  console.log('❌ You need to add OAuth credentials');
  console.log('   Go to Settings → API Keys & Integrations');
  console.log('   Or run: localStorage.setItem("google_client_id", "YOUR_CLIENT_ID")');
} else if (!authData['google_refresh_token']) {
  console.log('❌ You need a refresh token');
  console.log('   Your credentials are set up, but you need to authorize');
  console.log('   Follow the OAuth Playground steps in the guide');
} else {
  console.log('✅ Everything looks good!');
  console.log('   Run fixGoogleAuth() if you have issues');
  console.log('   Run backupGoogleAuth() to save your auth data');
}

console.log('\n📌 Available commands:');
console.log('   checkExistingAuth() - Check current status');
console.log('   backupGoogleAuth() - Backup all auth data');
console.log('   restoreGoogleAuth(backup) - Restore from backup');
console.log('   fixGoogleAuth() - Fix common issues');