import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { 
  Apps as AppsIcon,
  Google as GoogleIcon,
  Email as GmailIcon,
  CloudQueue as DriveIcon,
  CalendarMonth as CalendarIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Popover, List, ListItem, ListItemIcon, ListItemText, IconButton, Typography, Box } from '@mui/material';

const IntegrationButton = styled('button')({
  position: 'absolute',
  right: '100px', // Position between mic and send button
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'transparent',
  color: '#888888',
  border: '1px solid #444444',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: '#666666',
    color: '#AAAAAA'
  },
  '&:active': {
    transform: 'translateY(-50%) scale(0.95)'
  },
  '& svg': {
    width: '20px',
    height: '20px'
  }
});

const IntegrationsList = styled(List)({
  padding: '8px 0',
  minWidth: '280px',
  backgroundColor: '#1E1E1E',
  '& .MuiListItem-root': {
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
  },
  '& .MuiListItemIcon-root': {
    minWidth: '40px',
    color: '#AAAAAA'
  },
  '& .MuiListItemText-primary': {
    color: '#FFFFFF',
    fontSize: '14px'
  },
  '& .MuiListItemText-secondary': {
    color: '#888888',
    fontSize: '12px'
  }
});

const PopoverHeader = styled(Box)({
  padding: '16px 20px 8px',
  borderBottom: '1px solid #333333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
});

const IntegrationsPopup = ({ onIntegrationSelect, disabled }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [integrationService, setIntegrationService] = useState(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  
  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && window.process && window.process.type;
  
  // Load integration service dynamically
  useEffect(() => {
    const loadService = async () => {
      try {
        setServiceLoading(true);
        // Direct import based on environment
        if (isElectron) {
          console.log('[IntegrationsButton] Loading ElectronIntegrationService directly');
          const { default: ElectronIntegrationService } = await import('../../services/ElectronIntegrationService');
          const service = new ElectronIntegrationService();
          setIntegrationService(service);
        } else {
          console.log('[IntegrationsButton] Loading IntegrationService for web');
          const { default: IntegrationService } = await import('../../services/IntegrationService');
          const service = new IntegrationService();
          setIntegrationService(service);
        }
      } catch (error) {
        console.error('Failed to load integration service:', error);
      } finally {
        setServiceLoading(false);
      }
    };
    loadService();
  }, [isElectron]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Define all integrations
  const allIntegrations = [
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Search and access your emails',
      icon: <GmailIcon />,
      electronOnly: false,
      action: async () => {
        if (serviceLoading || !integrationService) {
          alert('Integration service is still loading. Please try again in a moment.');
          return;
        }
        
        try {
          setLoading(true);
          const service = integrationService;
          
          if (!service.isGoogleAuthorized) {
            await service.signInGoogle();
          }
          const query = prompt('What would you like to search for in Gmail?');
          if (query) {
            const messages = await service.searchGmail(query);
            const formatted = service.formatGmailMessages(messages);
            onIntegrationSelect(`Gmail search results for "${query}":\n\n${formatted}`);
          }
        } catch (error) {
          alert(`Gmail Error: ${error.message}`);
        } finally {
          setLoading(false);
          handleClose();
        }
      }
    },
    {
      id: 'drive',
      name: 'Google Drive',
      description: 'Access your files and documents',
      icon: <DriveIcon />,
      electronOnly: false,
      action: async () => {
        if (serviceLoading || !integrationService) {
          alert('Integration service is still loading. Please try again in a moment.');
          return;
        }
        
        try {
          setLoading(true);
          const service = integrationService;
          
          if (!service.isGoogleAuthorized) {
            await service.signInGoogle();
          }
          const files = await service.listGoogleDriveFiles();
          const formatted = service.formatDriveFiles(files);
          onIntegrationSelect(`Your recent Google Drive files:\n\n${formatted}`);
        } catch (error) {
          alert(`Google Drive Error: ${error.message}`);
        } finally {
          setLoading(false);
          handleClose();
        }
      }
    },
    {
      id: 'calendar',
      name: 'Apple Calendar',
      description: 'View your calendar events',
      icon: <CalendarIcon />,
      action: async () => {
        if (serviceLoading || !integrationService) {
          alert('Integration service is still loading. Please try again in a moment.');
          return;
        }
        
        try {
          setLoading(true);
          const service = integrationService;
          
          if (!service.isAppleAuthorized) {
            const username = prompt('Enter your iCloud username (email):');
            const password = prompt('Enter your app-specific password:');
            if (username && password) {
              await service.connectAppleCalendar(username, password);
            } else {
              throw new Error('Credentials required');
            }
          }
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days
          const events = await service.getAppleCalendarEvents(startDate, endDate);
          const formatted = service.formatCalendarEvents(events);
          onIntegrationSelect(`Your upcoming calendar events:\n\n${formatted}`);
        } catch (error) {
          alert(`Calendar Error: ${error.message}`);
        } finally {
          setLoading(false);
          handleClose();
        }
      }
    },
    {
      id: 'search',
      name: 'Google Search',
      description: 'Search the web',
      icon: <SearchIcon />,
      action: async () => {
        if (serviceLoading || !integrationService) {
          alert('Integration service is still loading. Please try again in a moment.');
          return;
        }
        
        try {
          setLoading(true);
          const service = integrationService;
          
          const query = prompt('What would you like to search for?');
          if (query) {
            const results = await service.webSearch(query);
            const formatted = service.formatWebSearchResults(results);
            onIntegrationSelect(`Web search results for "${query}":\n\n${formatted}`);
          }
        } catch (error) {
          alert(`Search Error: ${error.message}`);
        } finally {
          setLoading(false);
          handleClose();
        }
      }
    }
  ];
  
  // Don't filter integrations anymore - show all in Electron
  const integrations = allIntegrations;

  return (
    <>
      <IntegrationButton
        onClick={handleClick}
        disabled={disabled || loading || serviceLoading}
        aria-label="Integrations"
        title={serviceLoading ? "Loading integrations..." : "Integrations"}
      >
        <AppsIcon />
      </IntegrationButton>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            backgroundColor: '#1E1E1E',
            border: '1px solid #333333',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <PopoverHeader>
          <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
            Integrations
          </Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: '#888888' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </PopoverHeader>
        
        <IntegrationsList>
          {serviceLoading ? (
            <ListItem>
              <ListItemText
                primary="Loading integrations..."
                sx={{ textAlign: 'center', color: '#888888' }}
              />
            </ListItem>
          ) : (
            integrations.map((integration) => (
              <ListItem 
                key={integration.id}
                onClick={integration.action}
                disabled={loading || serviceLoading}
              >
                <ListItemIcon>
                  {integration.icon}
                </ListItemIcon>
                <ListItemText
                  primary={integration.name}
                  secondary={integration.description}
                />
              </ListItem>
            ))
          )}
        </IntegrationsList>
      </Popover>
    </>
  );
};

export default IntegrationsPopup;