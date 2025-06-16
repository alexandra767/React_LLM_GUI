# Google Calendar Multi-Account Patch Instructions

This patch enables multiple Google Calendar accounts in Sephia without breaking existing functionality.

## Quick Setup (Minimal Changes)

### 1. Update ElectronIntegrationService.js

Replace line 11:
```javascript
this.googleAuth = new ElectronGoogleAuthDirect();
```

With:
```javascript
this.googleAuth = new (require('./ElectronGoogleAuthDirectPatched').default)();
```

### 2. Add Account Switcher to Settings (Optional)

In your Settings view where Google Calendar is configured, add:

```javascript
import GoogleAccountSwitcher from './GoogleAccountSwitcher';

// In the render method, add:
<GoogleAccountSwitcher 
  onAccountChange={() => {
    // Refresh calendar data if needed
  }}
/>
```

## How It Works

1. **GoogleCalendarAccountManager.js** - Manages multiple accounts by storing tokens with account-specific keys
2. **ElectronGoogleAuthDirectPatched.js** - Patched version of the auth service that uses the account manager
3. **GoogleAccountSwitcher.js** - UI component for switching between accounts

## Using Multiple Accounts

1. The first account you authenticate will be the "default" account
2. Click the "+" button to add additional Google accounts
3. Use the dropdown to switch between accounts
4. Each account maintains its own authentication tokens

## Storage Keys

Tokens are now stored with account-specific keys:
- `google_access_token_[accountId]`
- `google_refresh_token_[accountId]`
- `google_token_expires_at_[accountId]`

The current account is tracked in:
- `google_current_account`

## Backward Compatibility

- Existing single-account setups will continue to work
- The first account will use the ID "default"
- No data migration required

## Testing

1. Open Settings
2. Add a new Google Calendar account
3. Switch between accounts using the dropdown
4. Verify that calendar events are fetched from the correct account

## Troubleshooting

If you encounter issues:
1. Check localStorage for the account-specific keys
2. Verify the current account ID: `localStorage.getItem('google_current_account')`
3. Check the accounts list: `localStorage.getItem('google_calendar_accounts_list')`