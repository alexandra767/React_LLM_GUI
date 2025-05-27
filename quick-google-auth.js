// Quick Google Auth Setup for Sephia
// This file will be injected into the running app

// Check if we're in Electron
if (typeof require !== 'undefined') {
  console.log('🧠⚡ Setting up Google Authentication...');
  
  // Check current auth status
  const hasClientId = !!localStorage.getItem('google_client_id');
  const hasRefreshToken = !!localStorage.getItem('google_refresh_token');
  
  if (!hasClientId) {
    console.warn('⚠️  No Google Client ID found!');
    console.log('\nTo set up Google authentication:');
    console.log('1. You need Google OAuth credentials');
    console.log('2. Visit: https://console.cloud.google.com/apis/credentials');
    console.log('3. Create OAuth 2.0 credentials');
    console.log('4. Add them in Settings → API Keys & Integrations');
    
    // Try to open settings
    if (window.location.hash !== '#/settings') {
      console.log('\n🔄 Redirecting to Settings...');
      window.location.hash = '#/settings';
    }
  } else if (!hasRefreshToken) {
    console.warn('⚠️  No refresh token found!');
    console.log('\n✅ You have credentials set up.');
    console.log('Now you need to get tokens from Google OAuth Playground.');
    console.log('\nOpening instructions...');
    
    // Show the guide
    const guideUrl = 'file://' + require('path').join(__dirname, 'GOOGLE_OAUTH_REFRESH_TOKEN_GUIDE.md');
    require('electron').shell.openExternal(guideUrl).catch(() => {
      console.log('Could not open guide. See GOOGLE_OAUTH_REFRESH_TOKEN_GUIDE.md');
    });
  } else {
    console.log('✅ Google authentication is already set up!');
    console.log('You can use @drive and @gmail commands.');
    
    // Test token validity
    const tokenExpiry = localStorage.getItem('google_token_expires_at_default');
    if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
      console.log('\n⚠️  Access token expired, but refresh token will auto-renew it.');
    }
  }
  
  // Provide helper function
  window.testGoogleAuth = async function() {
    console.log('Testing Google authentication...');
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('google_access_token')}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Google Drive access is working!');
      } else if (response.status === 401) {
        console.log('❌ Access token is invalid or expired');
        console.log('The app should auto-refresh using the refresh token.');
      } else {
        console.log('❌ Error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
    }
  };
  
  console.log('\n💡 Run testGoogleAuth() to test your connection');
}