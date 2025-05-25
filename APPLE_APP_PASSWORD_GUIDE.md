# How to Generate an App-Specific Password for Apple Calendar

## Step-by-Step Guide

### 1. Go to Apple ID Settings
- Open your browser and go to: **https://appleid.apple.com**
- Sign in with your Apple ID and password
- You'll need to complete two-factor authentication

### 2. Navigate to App-Specific Passwords
- Once logged in, look for **"Sign-In and Security"** section
- Click on **"App-Specific Passwords"**
- You might need to authenticate again

### 3. Generate New Password
- Click the **"+"** button or **"Generate App-Specific Password"**
- Enter a label for this password (e.g., "Sephia Calendar" or "React LLM App")
- Click **"Create"**

### 4. Copy the Password
- Apple will show you a 16-character password in the format: `xxxx-xxxx-xxxx-xxxx`
- **IMPORTANT**: Copy this password immediately - you won't be able to see it again!
- The password will look something like: `abcd-efgh-ijkl-mnop`

### 5. Use in the App
- Go to Settings → API Keys & Integrations → Apple Calendar
- Enter your Apple ID: `andrewjtitus2001@icloud.com`
- Paste the app-specific password (you can include or remove the dashes)
- Click "Save Credentials"

## Important Notes

1. **Two-Factor Authentication Required**: You must have 2FA enabled on your Apple ID
2. **One-Time View**: The password is only shown once - if you lose it, you'll need to generate a new one
3. **Format**: The password can be entered with or without dashes (both work)
4. **Security**: This password only works for CalDAV/calendar access, not for signing into your Apple ID

## Troubleshooting

If you can't find the App-Specific Passwords section:
1. Make sure you have two-factor authentication enabled
2. Try the direct link: https://appleid.apple.com/account/manage
3. Look under "Security" or "Sign-In and Security"

## Testing Your Password

After setting up the password in the app:
1. Type `@calendar` in the chat
2. You should see your real calendar events
3. If you see "Authentication failed", double-check:
   - Your Apple ID is entered correctly
   - The app-specific password is correct (try regenerating if needed)
   - There are no extra spaces before or after the password