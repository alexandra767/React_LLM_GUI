/**
 * Test Google Calendar API directly to diagnose 403 errors
 */

export async function testGoogleCalendarAPI() {
  console.log('=== Testing Google Calendar API ===');
  
  try {
    // Get current account token
    const currentAccount = localStorage.getItem('google_current_account') || 'default';
    const accessToken = localStorage.getItem(`google_access_token_${currentAccount}`) || 
                       localStorage.getItem('google_access_token');
    
    if (!accessToken) {
      console.error('No access token found!');
      return;
    }
    
    console.log('Using access token for account:', currentAccount);
    
    // Test 1: Check token info (what scopes it has)
    console.log('\n1. Checking token info...');
    try {
      const tokenInfo = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      const tokenData = await tokenInfo.json();
      console.log('Token Info:', tokenData);
      
      if (tokenData.scope) {
        console.log('Token Scopes:', tokenData.scope.split(' '));
        const hasCalendarScope = tokenData.scope.includes('calendar');
        console.log('Has Calendar Scope:', hasCalendarScope ? 'YES' : 'NO');
      }
    } catch (error) {
      console.error('Failed to get token info:', error);
    }
    
    // Test 2: Try to list calendars
    console.log('\n2. Testing Calendar List API...');
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Calendar List Response Status:', response.status);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Success! Found', data.items?.length || 0, 'calendars');
        if (data.items && data.items.length > 0) {
          console.log('First calendar:', data.items[0].summary);
        }
      } else {
        console.error('Error Response:', data);
        
        if (data.error) {
          console.error('Error Details:');
          console.error('- Code:', data.error.code);
          console.error('- Message:', data.error.message);
          if (data.error.errors) {
            data.error.errors.forEach(err => {
              console.error('- Reason:', err.reason);
              console.error('- Domain:', err.domain);
              console.error('- Message:', err.message);
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to call Calendar API:', error);
    }
    
    // Test 3: Check if we need to enable the API
    console.log('\n3. Checking API enablement...');
    console.log('Make sure Google Calendar API is enabled at:');
    console.log('https://console.cloud.google.com/apis/library/calendar-json.googleapis.com');
    
    // Test 4: Try a simple API call with API key instead
    const apiKey = localStorage.getItem('google_api_key');
    if (apiKey) {
      console.log('\n4. Testing with API Key...');
      try {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${apiKey}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        console.log('API Key Response Status:', response.status);
        if (!response.ok) {
          const data = await response.json();
          console.log('API Key Error:', data);
        }
      } catch (error) {
        console.error('API Key test failed:', error);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  console.log('\n=== End Test ===');
}

// Make it available globally
window.testGoogleCalendarAPI = testGoogleCalendarAPI;