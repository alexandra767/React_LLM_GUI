# Getting a Google Refresh Token for Permanent Access

This guide will help you obtain a refresh token that automatically renews your access token, so you don't have to manually get new tokens every hour.

## Prerequisites

1. Make sure you have these credentials in your Settings → API Keys & Integrations:
   - Google Client ID
   - Google Client Secret (REQUIRED for refresh tokens)
   - Google API Key

## Step-by-Step Guide

### 1. Go to Google OAuth Playground

Visit: https://developers.google.com/oauthplayground/

### 2. Configure OAuth Playground

1. Click the **gear icon (⚙️)** in the top right corner
2. Check **"Use your own OAuth credentials"**
3. Enter your credentials:
   - **OAuth Client ID**: (paste your Client ID from Settings)
   - **OAuth Client Secret**: (paste your Client Secret from Settings)
4. Leave other settings as default
5. Click **"Close"**

### 3. Select Required Scopes

In the left panel, find and check these scopes:

**For Google Drive:**
- Expand "Google Drive API v3"
- Check: `https://www.googleapis.com/auth/drive.readonly`

**For Gmail:**
- Expand "Gmail API v1"
- Check: `https://www.googleapis.com/auth/gmail.readonly`

### 4. Authorize APIs

1. Click the blue **"Authorize APIs"** button
2. You'll be redirected to Google sign-in
3. Sign in with your Google account
4. Review permissions and click **"Allow"**
5. You'll be redirected back to OAuth Playground

### 5. Get Your Tokens

1. Click **"Exchange authorization code for tokens"**
2. You'll see two important tokens:
   - **Access token**: Valid for 1 hour
   - **Refresh token**: Never expires (this is what we need!)

### 6. Save Tokens in Your App

1. Open your Electron app
2. Open Developer Tools:
   - Mac: `Cmd + Option + I`
   - Windows/Linux: `Ctrl + Shift + I`
3. Go to the **Console** tab
4. Run these commands (replace with your actual tokens):

```javascript
// Save the refresh token (most important - never expires)
localStorage.setItem('google_refresh_token', 'YOUR_REFRESH_TOKEN_HERE');

// Save the access token (optional - will be auto-refreshed)
localStorage.setItem('google_access_token', 'YOUR_ACCESS_TOKEN_HERE');
```

5. Refresh your app (Cmd/Ctrl + R)

### 7. Verify It's Working

Try the `@drive` command in chat. The app should:
1. Use the access token if it's still valid
2. Automatically get a new access token using the refresh token if needed
3. Show your Google Drive files

## Important Notes

- **Refresh tokens don't expire** unless:
  - You revoke access in your Google account settings
  - You change your Google password
  - The OAuth app hasn't been used for 6 months
  - You exceed token limits (usually 50 refresh tokens per app)

- **Security**: Keep your refresh token secure. Anyone with this token can access your Google Drive and Gmail.

- **Troubleshooting**:
  - If refresh fails, check that your Client Secret is correct
  - Make sure you selected the correct scopes
  - Try revoking access at https://myaccount.google.com/permissions and starting over

## Alternative: Manual Token Refresh

If you prefer not to store the refresh token, you can manually get new access tokens:
1. Follow steps 1-5 above
2. Only save the access token (skip the refresh token)
3. Repeat this process every hour when the token expires

## Revoking Access

To revoke access later:
1. Go to https://myaccount.google.com/permissions
2. Find your app and click "Remove Access"
3. Clear the tokens from localStorage