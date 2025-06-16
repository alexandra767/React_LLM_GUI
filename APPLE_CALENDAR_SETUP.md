# Apple Calendar Integration Setup Guide

This guide will help you set up Apple Calendar integration in the Sephia app.

## Prerequisites

- An Apple ID (iCloud account)
- Two-factor authentication enabled on your Apple ID
- An app-specific password for Sephia

## Step 1: Generate an App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. In the **Security** section, find **App-Specific Passwords**
4. Click **Generate Password** (you may need to click the + icon)
5. Enter a label like "Sephia Calendar" 
6. Copy the generated password (format: xxxx-xxxx-xxxx-xxxx)
7. **Important**: Save this password securely - you won't be able to see it again!

## Step 2: Configure in Sephia

1. Open Sephia and go to **Settings** (gear icon in sidebar)
2. Scroll down to the **Integrations** section
3. Find **Apple Calendar (iCloud)**
4. Enter your credentials:
   - **Apple ID**: Your full email address (e.g., yourname@icloud.com)
   - **App-specific password**: The password you generated in Step 1
5. Click **Connect**
6. You should see "Connected to Apple Calendar!" if successful

## Step 3: Using Apple Calendar in Chat

Once connected, you can use the `@calendar` command in any chat:

### Basic Usage
```
@calendar
```
Shows events for the next 7 days (default)

### Specify Days Ahead
```
@calendar 14
```
Shows events for the next 14 days

### Examples
- `@calendar` - Shows this week's events
- `@calendar 1` - Shows today's events only
- `@calendar 30` - Shows events for the next month

## Troubleshooting

### "CORS error" or "Network error"
Apple Calendar uses CalDAV protocol which has CORS restrictions in web browsers. You have a few options:

1. **Use the Electron app** - The desktop version bypasses CORS restrictions
2. **Demo mode** - The app will show demo events when it can't connect
3. **Future enhancement** - We're working on a proxy server solution

### "Authentication failed"
- Make sure you're using an app-specific password, not your regular Apple ID password
- Verify your Apple ID email is correct
- Try generating a new app-specific password

### "No events found"
- Make sure you have events in your default calendar
- Check that the events are within the date range you specified
- Try a larger date range (e.g., `@calendar 30`)

## Privacy & Security

- Your Apple credentials are stored locally in your browser/app
- The app-specific password is never sent to any external servers
- You can revoke the app-specific password anytime at appleid.apple.com
- Calendar data is fetched directly from Apple's servers

## Demo Mode

When the app can't connect to Apple Calendar (e.g., due to CORS in web browser), it will show demo events with a note explaining the limitation. This helps you understand how the feature works even without a full connection.

## Future Improvements

We're working on:
- Full CalDAV support in the web version via proxy
- Support for multiple calendars
- Calendar event creation
- Reminders integration