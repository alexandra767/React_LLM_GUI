import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Select, 
  MenuItem, 
  Button, 
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import accountManager from '../../services/GoogleCalendarAccountManager';
import ElectronGoogleAuth from '../../services/ElectronGoogleAuth';
import ElectronGoogleAuthDirectPatched from '../../services/ElectronGoogleAuthDirectPatched';

const GoogleAccountSwitcher = ({ onAccountChange }) => {
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const allAccounts = accountManager.getAllAccounts();
    setAccounts(allAccounts);
    setCurrentAccountId(accountManager.getCurrentAccountId());
  };

  const handleAccountSwitch = (event) => {
    const newAccountId = event.target.value;
    accountManager.switchAccount(newAccountId);
    setCurrentAccountId(newAccountId);
    
    if (onAccountChange) {
      onAccountChange(newAccountId);
    }
  };

  const handleAddAccount = async () => {
    setIsAddingAccount(true);
    try {
      // Create new account ID
      const newAccountId = accountManager.createNewAccountId();
      
      // Use device flow to authenticate
      const deviceAuth = new ElectronGoogleAuth();
      const authResult = await deviceAuth.authenticate();
      
      if (authResult && authResult.access_token) {
        // Get user info
        let email = newAccountId;
        try {
          const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: {
              'Authorization': `Bearer ${authResult.access_token}`
            }
          });
          
          if (response.ok) {
            const userInfo = await response.json();
            email = userInfo.email || email;
          }
        } catch (error) {
          console.error('Failed to get user info:', error);
        }
        
        // Save tokens for new account
        const authPatched = new ElectronGoogleAuthDirectPatched();
        authPatched.saveTokensForNewAccount({
          ...authResult,
          email
        }, newAccountId);
        
        // Reload accounts
        loadAccounts();
        setCurrentAccountId(newAccountId);
        
        if (onAccountChange) {
          onAccountChange(newAccountId);
        }
      }
    } catch (error) {
      console.error('Failed to add account:', error);
      alert(`Failed to add account: ${error.message}`);
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleRemoveAccount = (accountId) => {
    if (accounts.length === 1) {
      alert('Cannot remove the last account');
      return;
    }
    
    if (confirm(`Remove account ${accounts.find(a => a.id === accountId)?.email}?`)) {
      accountManager.removeAccount(accountId);
      loadAccounts();
    }
  };

  if (accounts.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          No Google Calendar accounts connected
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddAccount}
          disabled={isAddingAccount}
          size="small"
        >
          {isAddingAccount ? 'Adding Account...' : 'Add Google Account'}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2}>
        <Select
          value={currentAccountId}
          onChange={handleAccountSwitch}
          size="small"
          sx={{ minWidth: 200 }}
        >
          {accounts.map(account => (
            <MenuItem key={account.id} value={account.id}>
              <Box display="flex" alignItems="center" gap={1}>
                <AccountIcon fontSize="small" />
                <span>{account.email || account.label}</span>
              </Box>
            </MenuItem>
          ))}
        </Select>
        
        <IconButton
          onClick={handleAddAccount}
          disabled={isAddingAccount}
          size="small"
          title="Add another account"
        >
          <AddIcon />
        </IconButton>
        
        <Button
          size="small"
          onClick={() => setManageDialogOpen(true)}
        >
          Manage
        </Button>
      </Box>

      <Dialog
        open={manageDialogOpen}
        onClose={() => setManageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Google Calendar Accounts</DialogTitle>
        <DialogContent>
          <List>
            {accounts.map(account => (
              <ListItem key={account.id}>
                <ListItemText
                  primary={account.email || account.label}
                  secondary={
                    account.id === currentAccountId ? 'Currently active' : 
                    account.addedAt ? `Added ${new Date(account.addedAt).toLocaleDateString()}` : ''
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveAccount(account.id)}
                    disabled={accounts.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoogleAccountSwitcher;