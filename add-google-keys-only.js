// Add ONLY Google authentication keys without touching other data
console.log('🧠⚡ Adding Google Authentication Keys\n');

// Check what's missing
function checkMissingKeys() {
  const required = {
    'google_client_id': localStorage.getItem('google_client_id'),
    'google_client_secret': localStorage.getItem('google_client_secret'),
    'google_refresh_token': localStorage.getItem('google_refresh_token'),
    'google_access_token': localStorage.getItem('google_access_token')
  };
  
  console.log('Current status:');
  Object.entries(required).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✅ EXISTS' : '❌ MISSING'}`);
  });
  
  return required;
}

// Quick setup function
window.addGoogleKeys = function(clientId, clientSecret, refreshToken, accessToken) {
  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Client ID, Client Secret, and Refresh Token are required!');
    console.log('\nUsage:');
    console.log('addGoogleKeys(CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, ACCESS_TOKEN)');
    return;
  }
  
  // Add the keys
  localStorage.setItem('google_client_id', clientId);
  localStorage.setItem('google_client_secret', clientSecret);
  localStorage.setItem('google_refresh_token', refreshToken);
  if (accessToken) {
    localStorage.setItem('google_access_token', accessToken);
  }
  
  // Also set up for multi-account system
  localStorage.setItem('google_refresh_token_default', refreshToken);
  if (accessToken) {
    localStorage.setItem('google_access_token_default', accessToken);
  }
  
  // Set token expiry (1 hour from now if access token provided)
  if (accessToken) {
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    localStorage.setItem('google_token_expires_at_default', expiresAt);
  }
  
  console.log('\n✅ Google keys added successfully!');
  checkMissingKeys();
  console.log('\nTry using @drive now!');
};

// If you have existing credentials somewhere else
window.findGoogleCredentials = function() {
  console.log('\n🔍 Searching for Google credentials in other locations...\n');
  
  // Check session storage
  const sessionKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.toLowerCase().includes('google')) {
      sessionKeys.push({key, value: sessionStorage.getItem(key)});
    }
  }
  
  if (sessionKeys.length > 0) {
    console.log('Found in sessionStorage:');
    sessionKeys.forEach(({key, value}) => {
      console.log(`  ${key}: ${value.substring(0, 30)}...`);
    });
  }
  
  // Check cookies
  const cookies = document.cookie.split(';');
  const googleCookies = cookies.filter(c => c.toLowerCase().includes('google'));
  if (googleCookies.length > 0) {
    console.log('\nFound in cookies:');
    googleCookies.forEach(c => console.log(`  ${c.trim()}`));
  }
  
  // Check IndexedDB (if used)
  if ('indexedDB' in window) {
    indexedDB.databases().then(dbs => {
      if (dbs.length > 0) {
        console.log('\nIndexedDB databases found:', dbs.map(db => db.name).join(', '));
      }
    });
  }
};

// Show current status
checkMissingKeys();

console.log('\n📝 INSTRUCTIONS:\n');
console.log('1. If you have your Google credentials, run:');
console.log('   addGoogleKeys("YOUR_CLIENT_ID", "YOUR_CLIENT_SECRET", "YOUR_REFRESH_TOKEN", "YOUR_ACCESS_TOKEN")');
console.log('\n2. If you need to find existing credentials:');
console.log('   findGoogleCredentials()');
console.log('\n3. To get NEW credentials:');
console.log('   - Google Cloud Console: https://console.cloud.google.com/apis/credentials');
console.log('   - OAuth Playground: https://developers.google.com/oauthplayground/');

// Check if we can help locate the credentials
console.log('\n💡 Quick tip: Your Google credentials might be:');
console.log('   - In your password manager');
console.log('   - In a text file on your computer');
console.log('   - In your Google Cloud Console');
console.log('   - In an email to yourself');

// Provide template for easy copying
console.log('\n📋 Copy this template and fill in your values:\n');
console.log(`addGoogleKeys(
  "YOUR_CLIENT_ID_HERE",
  "YOUR_CLIENT_SECRET_HERE", 
  "YOUR_REFRESH_TOKEN_HERE",
  "YOUR_ACCESS_TOKEN_HERE"
)`);