# 🗂️ Google Drive Setup Guide for Aria

This guide will help you set up Google Drive integration so Aria can upload, download, and manage your files.

## 🎯 What You'll Get

After setup, you'll be able to use these commands:
- `@drive search term` - List and search your Google Drive files
- `@drive-upload text content` - Upload text content as a file
- `@drive-download filename` - Download and view file contents
- `@drive-delete filename` - Delete files (with confirmation)

## 📋 Prerequisites

1. **Google Account**: You need a Google account with Google Drive access
2. **Google Cloud Project**: You'll need to create a Google Cloud project (free)

## 🚀 Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "Aria AI Assistant")
4. Click "Create"

### Step 2: Enable Google Drive API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it and click "Enable"
4. Also enable "Gmail API" for email integration

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External (unless you have a Google Workspace)
   - App name: "Aria AI Assistant"
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add these scopes:
     - `.../auth/drive.file`
     - `.../auth/drive.readonly`
     - `.../auth/drive.metadata.readonly`
     - `.../auth/gmail.readonly`
4. Choose "Desktop application" as the application type
5. Name it "Aria Desktop Client"
6. Click "Create"

### Step 4: Get Your Credentials

After creating the OAuth client, you'll see:
- **Client ID**: Something like `123456789-abc...googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc123...`

**Download the JSON file** for backup, but you only need the Client ID and Secret.

### Step 5: Configure Aria

1. Open Aria (your React app)
2. Go to **Settings** → **API Keys & Integrations**
3. Add your Google credentials:
   - **Google Client ID**: Paste your Client ID
   - **Google Client Secret**: Paste your Client Secret (optional but recommended)
4. Click "Save"

### Step 6: Test the Integration

1. In Aria, try the command: `@drive`
2. You'll be prompted to authorize Aria to access your Google Drive
3. Follow the authorization flow in your browser
4. Once authorized, try these commands:
   - `@drive` - List your recent files
   - `@drive-upload Hello from Aria! This is a test file.` - Upload text
   - `@drive test` - Search for files containing "test"

## 🔧 Advanced Configuration

### Scopes Explained

Aria requests these Google Drive permissions:

- **`drive.file`**: Create, read, update, and delete files that Aria creates
- **`drive.readonly`**: Read all your files (for search and download)
- **`drive.metadata.readonly`**: Read file information like names and dates

### Security Notes

- Your credentials are stored locally in your browser
- Aria only accesses files you explicitly interact with
- You can revoke access anytime at [Google Account Permissions](https://myaccount.google.com/permissions)

### Troubleshooting

**"Client ID not configured"**
- Make sure you've added your Google Client ID in Settings

**"Authorization failed"**
- Check that you've enabled the Google Drive API
- Verify your OAuth consent screen is configured
- Make sure you clicked "Authorize" in the browser

**"Permission denied"**
- Your OAuth app might be in testing mode
- Add your email as a test user in the OAuth consent screen
- Or publish your app (for personal use, testing mode is fine)

## 📚 Usage Examples

### Upload Text Files
```
@drive-upload 
Meeting Notes - Project Alpha
- Discussed budget allocation
- Timeline moved to Q2
- Action items assigned
```

### Search and Download
```
@drive meeting notes
@drive-download meeting notes
```

### File Management
```
@drive presentation
@drive-delete old-draft.txt
```

## 🔄 Multi-Account Support

Aria supports multiple Google accounts:
1. Set up the first account as described above
2. Use `@drive` commands - you'll be prompted to add additional accounts
3. Each account maintains separate authentication

## 🆘 Need Help?

If you encounter issues:

1. **Check the browser console** for detailed error messages
2. **Verify API enablement** in Google Cloud Console
3. **Check OAuth scope** configuration
4. **Try re-authentication** by clearing tokens in Settings

For technical issues, check the Aria logs in the browser developer tools.

---

✨ **Once set up, Aria will be able to seamlessly manage your Google Drive files with natural language commands!**