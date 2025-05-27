#!/bin/bash

echo "🧠⚡ Opening Google Cloud Console to create new credentials..."
echo ""
echo "I'll open the necessary pages in your browser."
echo "Follow these steps:"
echo ""
echo "1. Create a new Google Cloud Project"
echo "2. Enable APIs (Drive, Gmail, Calendar)"
echo "3. Create OAuth 2.0 credentials"
echo "4. Get your refresh token"
echo ""
echo "Press Enter to start..."
read

# Open Google Cloud Console
echo "Opening Google Cloud Console..."
open "https://console.cloud.google.com/projectcreate"

echo ""
echo "✅ Create a new project called 'Sephia AI Assistant'"
echo "Press Enter when done..."
read

# Open API Library
echo "Opening API Library..."
open "https://console.cloud.google.com/apis/library"

echo ""
echo "✅ Search and enable these APIs:"
echo "   - Google Drive API"
echo "   - Gmail API"
echo "   - Google Calendar API"
echo "Press Enter when all are enabled..."
read

# Open Credentials page
echo "Opening Credentials page..."
open "https://console.cloud.google.com/apis/credentials"

echo ""
echo "✅ Click '+ CREATE CREDENTIALS' → 'OAuth client ID'"
echo "   - Configure consent screen if needed (External, add your email)"
echo "   - Application type: Web application"
echo "   - Name: Sephia Web Client"
echo "   - Add these Authorized redirect URIs:"
echo "     • http://localhost"
echo "     • http://localhost:3000"
echo "     • https://developers.google.com/oauthplayground"
echo ""
echo "Press Enter when you have your Client ID and Client Secret..."
read

# Create a file to store credentials
cat > /tmp/sephia-google-creds.txt << 'EOF'
===========================================
SEPHIA GOOGLE CREDENTIALS
===========================================

Copy your credentials here:

Google Client ID: 
Google Client Secret: 
Google API Key (optional): 

EOF

echo "Opening a text file for you to save your credentials..."
open -e /tmp/sephia-google-creds.txt

echo ""
echo "✅ Save your credentials in the text file that opened"
echo "Press Enter to continue to OAuth Playground..."
read

# Open OAuth Playground
echo "Opening OAuth Playground to get refresh token..."
open "https://developers.google.com/oauthplayground/"

echo ""
echo "✅ In OAuth Playground:"
echo "   1. Click the gear icon ⚙️ (top right)"
echo "   2. Check 'Use your own OAuth credentials'"
echo "   3. Enter your Client ID and Client Secret"
echo "   4. Select these scopes:"
echo "      - Google Drive API v3 → drive.readonly"
echo "      - Gmail API v1 → gmail.readonly"
echo "      - Google Calendar API v3 → calendar.readonly"
echo "   5. Click 'Authorize APIs'"
echo "   6. Sign in and allow access"
echo "   7. Click 'Exchange authorization code for tokens'"
echo ""
echo "Press Enter when you have your tokens..."
read

echo ""
echo "✅ Add your tokens to the credentials file"
echo ""
echo "Now let's add these to Sephia..."
echo "Press Enter to continue..."
read

# Launch Sephia if not running
if ! pgrep -f "electron.*electron-prod.js" > /dev/null; then
    echo "Starting Sephia..."
    /Applications/Sephia.app/Contents/MacOS/Sephia &
    sleep 5
fi

echo ""
echo "✅ Sephia is running!"
echo ""
echo "Now:"
echo "1. Press Cmd+Option+I to open Developer Tools"
echo "2. Go to Console tab"
echo "3. I'll show you the commands to run"
echo ""
echo "Press Enter when Developer Tools is open..."
read

# Show the commands
cat << 'EOF'
===========================================
PASTE THESE COMMANDS IN THE CONSOLE:
===========================================

// First, check current status
localStorage.getItem('google_client_id')

// Set your credentials (replace with your actual values)
localStorage.setItem('google_client_id', 'YOUR_CLIENT_ID_HERE');
localStorage.setItem('google_client_secret', 'YOUR_CLIENT_SECRET_HERE');
localStorage.setItem('google_api_key', 'YOUR_API_KEY_HERE');

// Set your tokens
localStorage.setItem('google_refresh_token', 'YOUR_REFRESH_TOKEN_HERE');
localStorage.setItem('google_access_token', 'YOUR_ACCESS_TOKEN_HERE');

// Set up multi-account support
localStorage.setItem('google_refresh_token_default', 'YOUR_REFRESH_TOKEN_HERE');
localStorage.setItem('google_access_token_default', 'YOUR_ACCESS_TOKEN_HERE');

// Verify
console.log('Client ID:', localStorage.getItem('google_client_id') ? '✅' : '❌');
console.log('Refresh Token:', localStorage.getItem('google_refresh_token') ? '✅' : '❌');

EOF

echo ""
echo "✅ Copy the commands above and paste them in the Console"
echo "   Replace the placeholder values with your actual credentials"
echo ""
echo "After that, try using @drive in the chat!"
echo ""
echo "Your credentials file is saved at: /tmp/sephia-google-creds.txt"