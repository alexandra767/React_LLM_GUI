# Google Drive Setup for Electron

Since Google OAuth has issues in Electron, here are your options:

## Option 1: Get an Access Token Manually (Recommended)

1. Go to: https://developers.google.com/oauthplayground/
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your credentials from Settings:
   - OAuth2 Client ID: (your client ID)
   - OAuth2 Client Secret: (your client secret)
5. In the left panel, find and select:
   - Google Drive API v3 → https://www.googleapis.com/auth/drive.readonly
   - Gmail API v1 → https://www.googleapis.com/auth/gmail.readonly
6. Click "Authorize APIs"
7. Sign in with your Google account
8. Click "Exchange authorization code for tokens"
9. Copy the "Access token" from the response

Then in your app:
1. Open Developer Tools (View → Toggle Developer Tools)
2. In the Console, run:
   ```javascript
   localStorage.setItem('google_access_token', 'YOUR_ACCESS_TOKEN_HERE');
   ```
3. Refresh the app
4. Try `@drive` again

## Option 2: Use the Web Version

1. Stop the Electron app
2. Run `npm start` 
3. Open http://localhost:3000 in your browser
4. Google OAuth will work normally there

## Option 3: Use Service Account (Advanced)

If you need permanent access without user interaction:
1. Create a Service Account in Google Cloud Console
2. Download the JSON key file
3. Share your Google Drive folders with the service account email

## Why This Happens

Electron apps can't use Google's standard OAuth flow because:
- Google blocks OAuth in embedded browsers (like Electron)
- The iframe initialization fails due to security policies
- Redirect URIs don't work properly in desktop apps

The access token from Option 1 will expire after 1 hour. For permanent access, you'd need to implement token refresh or use a service account.