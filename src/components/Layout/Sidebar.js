import React, { useState, useRef } from 'react';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { useApp } from '../../context/AppContext';
import BrainIcon from '../Chat/BrainIcon';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Box,
  Typography,
  Divider as MuiDivider,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon,
  Chat as ChatIcon,
  FolderOpen as ProjectsIcon,
  Settings as SettingsIcon,
  BookmarkBorder as StarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccountCircle as AccountIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Photo as PhotoIcon,
  SmartToy as OllamaIcon
} from '@mui/icons-material';

const SidebarContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => ({
  width: collapsed ? '64px' : '220px',
  height: '100vh',
  backgroundColor: theme.colors?.secondaryBg || theme.palette.background.paper,
  borderRight: `1px solid ${theme.colors?.border || theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  transition: 'width 0.3s ease',
  overflowX: 'hidden',
  position: 'relative',
}));

const SidebarSection = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const SidebarButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: active 
    ? (theme.colors?.primaryBg || theme.palette.action.selected) 
    : 'transparent',
  color: active 
    ? (theme.colors?.primaryText || theme.palette.text.primary)
    : (theme.colors?.tertiaryText || theme.palette.text.secondary),
  border: 'none',
  borderRadius: theme.shape.borderRadius,
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  fontSize: theme.typography.body2.fontSize,
  fontWeight: theme.typography.fontWeightRegular,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background-color 0.2s ease',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '&:hover': {
    backgroundColor: active 
      ? (theme.colors?.primaryBg || theme.palette.action.selected)
      : (theme.colors?.border ? `${theme.colors.border}30` : theme.palette.action.hover),
  },
  '& svg': {
    flexShrink: 0,
  },
}));

const ChatActions = styled('div')({
  position: 'absolute',
  right: '8px',
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  opacity: 0,
  transition: 'opacity 0.2s ease',
});

const ActionButton = styled('button')(({ theme }) => ({
  background: 'none',
  border: 'none',
  color: theme.palette.text.secondary,
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
  },
}));

const SectionTitle = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  color: theme.palette.text.secondary,
  fontSize: theme.typography.caption.fontSize,
  fontWeight: theme.typography.fontWeightMedium,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const Divider = styled(MuiDivider)({
  margin: '8px 0',
});

const ProfileSection = styled('div', {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  gap: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  marginTop: 'auto',
  position: 'relative',
  minHeight: '72px',
}));

const ProfileImage = styled('div')(({ theme }) => ({
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: theme.palette.action.selected,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  '& svg': {
    color: theme.palette.text.secondary,
    fontSize: '24px',
  },
}));

const ProfileInfo = styled('div', {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => ({
  display: collapsed ? 'none' : 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  flex: 1,
}));

const ProfileName = styled('span')(({ theme }) => ({
  fontWeight: theme.typography.fontWeightMedium,
  color: theme.palette.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ConnectionStatus = styled('span')(({ theme, status }) => ({
  fontSize: '0.75rem',
  color: 
    status === 'Connected' ? theme.palette.success.main :
    status === 'Connecting' ? theme.palette.warning.main :
    theme.palette.error.main,
}));

const ProfileActions = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: '10px',
  right: '10px',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  display: 'flex',
  gap: '4px',
  backgroundColor: theme.palette.background.paper,
  padding: '4px',
  borderRadius: '4px',
  boxShadow: theme.shadows[2],
  '&:hover': {
    opacity: 1,
  },
}));

const ProfileActionButton = styled('button')(({ theme }) => ({
  background: 'none',
  border: 'none',
  color: theme.palette.text.secondary,
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
  },
}));

const FileInput = styled('input')({
  display: 'none',
});

const ToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  right: '-12px',
  transform: 'translateY(-50%)',
  width: '24px',
  height: '48px',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderLeft: 'none',
  borderRadius: '0 12px 12px 0',
  cursor: 'pointer',
  color: theme.palette.text.secondary,
  transition: 'all 0.2s ease',
  zIndex: 10,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
  },
}));

const LogoSection = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  gap: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const LogoText = styled('h1', {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => ({
  fontSize: theme.typography.h6.fontSize,
  fontWeight: theme.typography.fontWeightLight,
  color: theme.palette.text.primary,
  margin: 0,
  marginLeft: theme.spacing(1),
  whiteSpace: 'nowrap',
  opacity: collapsed ? 0 : 1,
  transition: 'opacity 0.2s ease',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const SidebarWrapper = styled('div')({
  position: 'relative',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
});

const Sidebar = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const { theme } = useTheme();
  const { 
    appState, 
    toggleSidebar, 
    setActiveSection,
    createNewChat,
    chats,
    deleteChat,
    profile,
    updateProfile 
  } = useApp();
  
  const { sidebarCollapsed, activeSection, connectionStatus } = appState;
  
  const fileInputRef = React.useRef(null);
  
  const handleNewChat = () => {
    createNewChat();
  };
  
  const handleProfileClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target.result;
        updateProfile({ picture: imageDataUrl });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEditProfile = () => {
    setNewName(profile.name || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = () => {
    if (newName.trim()) {
      updateProfile({ name: newName.trim() });
      setIsEditDialogOpen(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
  };
  
  const handleRemoveProfilePicture = () => {
    updateProfile({ picture: null });
  };
  
  // Get recent chats for the sidebar
  const recentChats = chats.slice(0, 3);
  
  // Get starred chats (just mimicking this with the first chat if available)
  const starredChats = chats.length > 0 ? [chats[0]] : [];
  
  return (
    <>
      <Dialog open={isEditDialogOpen} onClose={handleCancelEdit}>
        <DialogTitle>Edit Profile Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveProfile()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveProfile} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <SidebarWrapper>
        <SidebarContainer theme={theme} collapsed={sidebarCollapsed}>
          <LogoSection theme={theme}>
            <BrainIcon size={36} color="#FF643D" />
            <LogoText theme={theme} collapsed={sidebarCollapsed}>Sephia</LogoText>
          </LogoSection>
          
          <SidebarSection theme={theme}>
            <SidebarButton 
              theme={theme} 
              onClick={handleNewChat}
            >
              <AddIcon />
              {!sidebarCollapsed && 'New Chat'}
            </SidebarButton>
            
            <Divider theme={theme} />
            
            <SidebarButton 
              theme={theme} 
              active={activeSection === 'chat'} 
              onClick={() => setActiveSection('chat')}
            >
              <ChatIcon />
              {!sidebarCollapsed && 'Chats'}
            </SidebarButton>
            
            <SidebarButton 
              theme={theme} 
              active={activeSection === 'projects'} 
              onClick={() => setActiveSection('projects')}
            >
              <ProjectsIcon />
              {!sidebarCollapsed && 'Projects'}
            </SidebarButton>
            
            <SidebarButton 
              theme={theme} 
              active={activeSection === 'ollama'} 
              onClick={() => setActiveSection('ollama')}
            >
              <OllamaIcon />
              {!sidebarCollapsed && 'Chat'}
            </SidebarButton>
            
            <SidebarButton 
              theme={theme} 
              active={activeSection === 'settings'} 
              onClick={() => setActiveSection('settings')}
            >
              <SettingsIcon />
              {!sidebarCollapsed && 'Settings'}
            </SidebarButton>
          </SidebarSection>
          
          {!sidebarCollapsed && (
            <>
              <SectionTitle theme={theme}>
                Starred
              </SectionTitle>
              <SidebarSection theme={theme}>
                {starredChats.length > 0 ? (
                  starredChats.map(chat => (
                    <div 
                      key={chat.id} 
                      style={{
                        position: 'relative',
                        width: '100%',
                        '&:hover .chat-actions': {
                          opacity: 1
                        }
                      }}
                    >
                      <SidebarButton 
                        theme={theme}
                        onClick={() => {
                          setActiveSection('chat');
                          // In real implementation, would set current chat here
                        }}
                        style={{ width: '100%' }}
                      >
                        <StarIcon />
                        <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                          {chat.title}
                        </span>
                      </SidebarButton>
                      <ChatActions className="chat-actions">
                        <ActionButton 
                          theme={theme} 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this chat?')) {
                              deleteChat(chat.id);
                            }
                          }}
                          title="Delete chat"
                        >
                          <DeleteIcon fontSize="small" />
                        </ActionButton>
                      </ChatActions>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '0 16px', color: theme.colors.tertiaryText, fontSize: '13px' }}>
                    No starred items
                  </div>
                )}
              </SidebarSection>
              
              <SectionTitle theme={theme}>
                Recent
              </SectionTitle>
              <SidebarSection theme={theme}>
                {recentChats.length > 0 ? (
                  recentChats.map(chat => (
                    <div 
                      key={chat.id}
                      style={{
                        position: 'relative',
                        width: '100%',
                        '&:hover .chat-actions': {
                          opacity: 1
                        }
                      }}
                    >
                      <SidebarButton 
                        theme={theme}
                        onClick={() => {
                          setActiveSection('chat');
                          // In real implementation, would set current chat here
                        }}
                        style={{ width: '100%' }}
                      >
                        <ChatIcon />
                        <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                          {chat.title}
                        </span>
                      </SidebarButton>
                      <ChatActions className="chat-actions">
                        <ActionButton 
                          theme={theme} 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this chat?')) {
                              deleteChat(chat.id);
                            }
                          }}
                          title="Delete chat"
                        >
                          <DeleteIcon fontSize="small" />
                        </ActionButton>
                      </ChatActions>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '0 16px', color: theme.colors.tertiaryText, fontSize: '13px' }}>
                    No recent chats
                  </div>
                )}
              </SidebarSection>
            </>
          )}
          
          <ProfileSection theme={theme} collapsed={sidebarCollapsed}>
            <ProfileImage theme={theme} onClick={handleProfileClick}>
              {profile.picture ? (
                <img src={profile.picture} alt="Profile" />
              ) : (
                <AccountIcon fontSize="large" />
              )}
            </ProfileImage>
            
            <ProfileInfo collapsed={sidebarCollapsed} theme={theme}>
              <ProfileName theme={theme}>{profile.name}</ProfileName>
              <ConnectionStatus theme={theme} status={connectionStatus}>
                {connectionStatus}
              </ConnectionStatus>
            </ProfileInfo>
            
            {!sidebarCollapsed && (
              <ProfileActions className="profile-actions">
                <ProfileActionButton theme={theme} onClick={handleEditProfile} title="Edit Profile">
                  <EditIcon fontSize="small" />
                </ProfileActionButton>
                {profile.picture && (
                  <ProfileActionButton theme={theme} onClick={handleRemoveProfilePicture} title="Remove Photo">
                    <DeleteIcon fontSize="small" />
                  </ProfileActionButton>
                )}
                <ProfileActionButton theme={theme} onClick={handleProfileClick} title="Upload Photo">
                  <PhotoIcon fontSize="small" />
                </ProfileActionButton>
              </ProfileActions>
            )}
            
            <FileInput 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </ProfileSection>
        </SidebarContainer>
        
        <ToggleButton theme={theme} onClick={toggleSidebar}>
          {sidebarCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </ToggleButton>
      </SidebarWrapper>
    </>
  );
};

export default Sidebar;