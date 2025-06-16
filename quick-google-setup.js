// Quick Google Setup - Just the keys you need
console.log('🧠⚡ Quick Google Key Setup\n');

// Show what's currently missing
console.log('Missing keys:');
console.log('google_client_id:', localStorage.getItem('google_client_id') || '❌ MISSING');
console.log('google_client_secret:', localStorage.getItem('google_client_secret') || '❌ MISSING'); 
console.log('google_refresh_token:', localStorage.getItem('google_refresh_token') || '❌ MISSING');

console.log('\n📝 You need to add your Google keys.');
console.log('\nIf you have them, paste this with your values:\n');

// Provide the exact commands to paste
console.log(`// Add your Google OAuth credentials
localStorage.setItem('google_client_id', 'YOUR_CLIENT_ID');
localStorage.setItem('google_client_secret', 'YOUR_CLIENT_SECRET');
localStorage.setItem('google_refresh_token', 'YOUR_REFRESH_TOKEN');
localStorage.setItem('google_access_token', 'YOUR_ACCESS_TOKEN');

// Also set for multi-account
localStorage.setItem('google_refresh_token_default', 'YOUR_REFRESH_TOKEN');
localStorage.setItem('google_access_token_default', 'YOUR_ACCESS_TOKEN');`);

console.log('\n\nIf you DON\'T have these keys saved anywhere:');
console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
console.log('2. Create or select your OAuth 2.0 Client ID');
console.log('3. Copy the Client ID and Client Secret');
console.log('4. Then go to: https://developers.google.com/oauthplayground/');
console.log('5. Use your credentials to get tokens');