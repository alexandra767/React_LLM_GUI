import React, { useState, useRef } from 'react';
import { styled } from '@mui/material/styles';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import BrainIcon from '../Chat/BrainIcon';
import BrainLightningIcon from '../Chat/BrainLightningIcon';
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
})(({ collapsed }) => ({
  width: collapsed ? '64px' : '220px',
  height: '100vh',
  backgroundColor: '#1E1E1E',
  borderRight: '1px solid #333333',
  display: 'flex',
  flexDirection: 'column',
  transition: 'width 0.3s ease',
  overflowX: 'hidden',
  position: 'relative',
}));

const SidebarSection = styled('div')({
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

const SidebarButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: active ? '#252525' : 'transparent',
  color: active ? '#FFFFFF' : '#AAAAAA',
  border: 'none',
  borderRadius: '4px',
  padding: '8px 16px',
  fontSize: '0.875rem',
  fontWeight: 400,
  cursor: 'pointer',
  transition: 'background-color 0.2s, color 0.2s',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '&:hover': {
    backgroundColor: '#252525',
    color: '#FFFFFF',
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

const ActionButton = styled('button')(({ theme }) => {
  const palette = theme?.palette || {};
  const text = palette?.text || {};
  const action = palette?.action || {};
  
  // Default values for colors
  const defaultTextSecondary = '#AAAAAA';
  const defaultTextPrimary = '#FFFFFF';
  const defaultHoverBg = 'rgba(255, 255, 255, 0.1)';
  
  return {
    background: 'none',
    border: 'none',
    color: text?.secondary || defaultTextSecondary,
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: action?.hover || defaultHoverBg,
      color: text?.primary || defaultTextPrimary,
    },
  };
});

const SectionTitle = styled('div')(({ theme }) => {
  // Use direct spacing values instead of function
  const textColor = theme?.palette?.text?.secondary || '#888888';
  const fontSize = '0.75rem';
  const fontWeight = 500;
  
  return {
    padding: '8px 16px',
    color: textColor,
    fontSize: fontSize,
    fontWeight: fontWeight,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0,
  };
});

const Divider = styled(MuiDivider)({
  margin: '8px 0',
});

const ProfileSection = styled('div', {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => {
  const colors = theme?.colors || {};
  return {
    marginTop: 'auto',
    padding: '16px',
    borderTop: `1px solid ${colors.border || '#333333'}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: colors.primaryBg || '#1E1E1E',
    '&:hover $profileActions': {
      opacity: 1,
    },
  };
});

const ProfileImage = styled('div')(({ theme, large }) => {
  const colors = theme?.colors || {};
  // Default values
  const defaultSecondaryBg = '#252525';
  const defaultPrimaryText = '#FFFFFF';
  
  return {
    width: large ? '80px' : '40px',
    height: large ? '80px' : '40px',
    borderRadius: '50%',
    backgroundColor: colors?.secondaryBg || defaultSecondaryBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    color: colors?.primaryText || defaultPrimaryText,
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    border: '2px solid transparent',
    '&:hover': {
      transform: 'scale(1.05)',
      borderColor: '#FF643D',
    },
    '& img': {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    '& svg': {
      fontSize: large ? '48px' : '24px',
    },
  };
});

const ProfileInfo = styled('div', {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => {
  const colors = theme?.colors || {};
  // Default value
  const defaultPrimaryText = '#FFFFFF';
  
  return {
    display: collapsed ? 'none' : 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    flex: 1,
    color: colors?.primaryText || defaultPrimaryText,
  };
});

const ProfileName = styled('div')(({ theme }) => {
  const colors = theme?.colors || {};
  return {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: 500,
    fontSize: '14px',
    color: colors.primaryText || '#FFFFFF',
  };
});

const ConnectionStatus = styled('div')(({ theme, status }) => {
  // Safely get colors with defaults
  const colors = {
    success: theme?.colors?.success || '#4caf50',
    warning: theme?.colors?.warning || '#ff9800',
    error: theme?.colors?.error || '#f44336',
  };
  
  // Determine status color
  const statusColors = {
    connected: colors.success,
    connecting: colors.warning,
    disconnected: colors.error,
  };
  
  const statusColor = statusColors[status?.toLowerCase()] || colors.error;
  
  return {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: statusColor,
    '&::before': {
      content: '""',
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: statusColor,
      marginRight: '8px',
    },
  };
});

const ProfileActions = styled('div')(({ theme }) => {
  const colors = theme?.colors || {};
  const shadows = theme?.shadows || [];
  
  return {
    position: 'absolute',
    top: '10px',
    right: '10px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    display: 'flex',
    gap: '4px',
    backgroundColor: colors.secondaryBg || '#252525',
    padding: '4px',
    borderRadius: '4px',
    boxShadow: shadows[2] || '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
    '&:hover': {
      opacity: 1,
    },
  };
});

const ProfileActionButton = styled('button')(({ theme }) => {
  const colors = theme?.colors || {};
  
  return {
    background: 'none',
    border: 'none',
    color: colors.tertiaryText || '#AAAAAA',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: colors.secondaryBg || 'rgba(255, 255, 255, 0.1)',
      color: colors.primaryText || '#FFFFFF',
    },
  };
});

const FileInput = styled('input')({
  display: 'none',
});

const ToggleButton = styled(IconButton)(({ theme }) => {
  const colors = theme?.colors || {};
  
  return {
    position: 'absolute',
    top: '50%',
    right: '-12px',
    transform: 'translateY(-50%)',
    width: '24px',
    height: '48px',
    backgroundColor: colors.secondaryBg || '#252525',
    border: `1px solid ${colors.border || '#333333'}`,
    borderLeft: 'none',
    borderRadius: '0 12px 12px 0',
    cursor: 'pointer',
    color: colors.tertiaryText || '#AAAAAA',
    transition: 'all 0.2s ease',
    zIndex: 10,
    '&:hover': {
      backgroundColor: colors.secondaryBg || 'rgba(255, 255, 255, 0.1)',
      color: colors.primaryText || '#FFFFFF',
    },
  };
});

const LogoSection = styled('div')(({ theme }) => {
  const colors = theme?.colors || {};
  
  return {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    gap: '8px',
    borderBottom: `1px solid ${colors.border || '#333333'}`,
  };
});

const LogoText = styled('h1', {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => {
  const colors = theme?.colors || {};
  
  return {
    fontSize: '1.25rem',
    fontWeight: 300,
    color: colors.primaryText || '#FFFFFF',
    margin: 0,
    opacity: collapsed ? 0 : 1,
    transition: 'opacity 0.2s ease',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
});

const SidebarWrapper = styled('div')({
  position: 'relative',
  backgroundColor: '#1E1E1E',
  color: '#FFFFFF',
});

const Sidebar = () => {
  const theme = useTheme();
  const [hoveredChatId, setHoveredChatId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const { 
    appState, 
    setAppState, 
    currentChat, 
    chats = [], 
    createNewChat, 
    deleteChat, 
    updateChat, 
    setCurrentChatId,
    projects = [],
    createNewProject,
    deleteProject,
    updateProject,
    setCurrentProjectId,
    currentProjectId,
    profile = { name: 'User', picture: null },
    updateProfile,
    connectionStatus = 'connected',
    sidebarCollapsed = false,
    toggleSidebar = () => {},
    activeSection,
    setActiveSection = () => {},
    handleChatSelect,
    toggleStarChat,
  } = useApp();
  
  // Wrapper for handleChatSelect that includes the theme context
  // Handle chat selection with theme
  const handleChatSelectWithTheme = (chat) => {
    handleChatSelect(chat);
  };
  
  // Handle new chat creation with theme
  const handleNewChatWithTheme = async () => {
    try {
      if (createNewChat) {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newChat = createNewChat('New Chat', currentTheme);
        handleChatSelect(newChat); // Use handleChatSelect directly since we don't need to pass theme
        setActiveSection('chat');
      } else {
        console.error('createNewChat is not defined');
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };
  
  // Safely access theme colors with defaults
  const colors = {
    ...(theme?.colors || {}),
    primaryBg: theme?.colors?.primaryBg || '#1E1E1E',
    secondaryBg: theme?.colors?.secondaryBg || '#252525',
    primaryText: theme?.palette?.text?.primary || '#FFFFFF',
    secondaryText: theme?.colors?.secondaryText || '#F0F0F0',
    tertiaryText: theme?.colors?.tertiaryText || '#AAAAAA',
    border: theme?.colors?.border || '#333333',
    error: theme?.colors?.error || '#f44336',
    success: theme?.colors?.success || '#4CAF50',
    warning: theme?.colors?.warning || '#FFC107'
  };
  
  // Get spacing function from theme or use a default
  const spacing = theme?.spacing || ((value) => `${value * 8}px`);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email || '');
  const [tempProfilePicture, setTempProfilePicture] = useState(profile.picture);
  const fileInputRef = useRef(null);
  
  const handleNewChat = handleNewChatWithTheme;
  
  const handleSaveProfile = () => {
    if (updateProfile) {
      updateProfile({
        name: editName,
        email: editEmail,
        picture: tempProfilePicture
      });
    }
    setIsEditDialogOpen(false);
  };

  const handleCancelEdit = () => {
    setEditName(profile.name);
    setEditEmail(profile.email || '');
    setTempProfilePicture(profile.picture);
    setIsEditDialogOpen(false);
  };

  const handleProfileClick = () => {
    if (isEditDialogOpen) {
      fileInputRef.current?.click();
    } else {
      handleEditProfile();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditDialogOpen) {
          setTempProfilePicture(reader.result);
        } else {
          if (updateProfile) {
            updateProfile({ picture: reader.result });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfile = () => {
    setEditName(profile.name);
    setEditEmail(profile.email || '');
    setTempProfilePicture(profile.picture);
    setIsEditDialogOpen(true);
  };

  const handleRemoveProfilePicture = () => {
    if (window.confirm('Remove profile picture?')) {
      if (updateProfile) {
        updateProfile({ picture: null });
      }
    }
  };



  const handleToggleStar = (chatId, e) => {
    e.stopPropagation();
    if (toggleStarChat) {
      toggleStarChat(chatId);
    } else {
      console.error('toggleStarChat is not defined');
    }
  };

  // Get recent chats (most recent first)
  const recentChats = [...chats]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .filter(chat => !chat.isStarred);

  // Get starred chats (most recent first)
  const starredChats = [...chats]
    .filter(chat => chat.isStarred)
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    
  // Handle chat item hover
  const handleChatItemMouseEnter = (chatId) => {
    setHoveredChatId(chatId);
  };
  
  const handleChatItemMouseLeave = () => {
    setHoveredChatId(null);
  };

  return (
    <>
      <Dialog 
        open={isEditDialogOpen} 
        onClose={handleCancelEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, pt: 2 }}>
            <ProfileImage 
              theme={theme} 
              large
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              {tempProfilePicture ? (
                <img src={tempProfilePicture} alt="Profile" />
              ) : (
                <AccountIcon style={{ fontSize: '48px' }} />
              )}
            </ProfileImage>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                onClick={() => fileInputRef.current?.click()}
                startIcon={<PhotoIcon />}
              >
                Upload Photo
              </Button>
              {tempProfilePicture && (
                <Button 
                  size="small" 
                  onClick={() => setTempProfilePicture(null)}
                  color="error"
                  startIcon={<DeleteIcon />}
                >
                  Remove
                </Button>
              )}
            </Box>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              variant="outlined"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
          </Box>
          <FileInput 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button onClick={handleSaveProfile} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <SidebarWrapper>
        <SidebarContainer theme={theme} collapsed={sidebarCollapsed}>
          <LogoSection theme={theme}>
            <BrainLightningIcon size={36} />
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
                      onMouseEnter={() => handleChatItemMouseEnter(chat.id)}
                      onMouseLeave={handleChatItemMouseLeave}
                      style={{
                        position: 'relative',
                        width: '100%',
                        marginBottom: '4px',
                        borderRadius: '6px',
                        backgroundColor: currentChat?.id === chat.id 
                          ? (colors.secondaryBg || 'rgba(255, 255, 255, 0.1)') 
                          : 'transparent',
                        transition: 'background-color 0.2s ease, transform 0.1s ease',
                        '&:hover': {
                          backgroundColor: colors.secondaryBg || 'rgba(255, 255, 255, 0.05)',
                          transform: 'translateX(2px)'
                        }
                      }}
                    >
                      <SidebarButton 
                        theme={theme}
                        onClick={() => handleChatSelectWithTheme(chat)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          padding: '8px 12px',
                          backgroundColor: 'transparent',
                          '&:hover': {
                            backgroundColor: 'transparent'
                          }
                        }}
                      >
                        <StarIcon style={{ 
                          color: chat.isStarred ? '#FFD700' : 'transparent',
                          marginRight: '8px',
                          flexShrink: 0
                        }} />
                        <span style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {chat.title}
                        </span>
                      </SidebarButton>
                      <div style={{ 
                        position: 'absolute', 
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        gap: '4px',
                        backgroundColor: colors.primaryBg || '#1E1E1E',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                      }}>
                        <ActionButton 
                          theme={theme}
                          onClick={(e) => handleToggleStar(chat.id, e)}
                          title={chat.isStarred ? 'Unstar chat' : 'Star chat'}
                          style={{ 
                            color: chat.isStarred ? '#FFD700' : (colors.tertiaryText || '#AAAAAA'),
                            padding: '4px',
                            minWidth: '24px',
                            '&:hover': {
                              color: '#FFD700',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          <StarIcon 
                            fontSize="small" 
                            sx={{ 
                              fill: chat.isStarred ? '#FFD700' : 'transparent',
                              stroke: chat.isStarred ? '#FFD700' : (colors.tertiaryText || '#AAAAAA'),
                              strokeWidth: 1.5
                            }} 
                          />
                        </ActionButton>
                        <ActionButton 
                          theme={theme} 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this chat?')) {
                              deleteChat(chat.id);
                            }
                          }}
                          title="Delete chat"
                          style={{ 
                            padding: '4px',
                            minWidth: '24px',
                            '&:hover': {
                              color: colors.error || '#ff4444',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </ActionButton>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '0 16px', color: colors.tertiaryText || '#AAAAAA', fontSize: '13px' }}>
                    No starred items
                  </div>
                )}
              </SidebarSection>
              
              <SectionTitle theme={theme}>
                Recent Chats
              </SectionTitle>
              <SidebarSection theme={theme}>
                {recentChats.length > 0 ? (
                  recentChats.map(chat => (
                    <div 
                      key={chat.id}
                      onMouseEnter={() => handleChatItemMouseEnter(chat.id)}
                      onMouseLeave={handleChatItemMouseLeave}
                      style={{
                        position: 'relative',
                        width: '100%',
                        marginBottom: '4px',
                        borderRadius: '6px',
                        backgroundColor: currentChat?.id === chat.id 
                          ? (colors.secondaryBg || 'rgba(255, 255, 255, 0.1)') 
                          : 'transparent',
                        transition: 'background-color 0.2s ease, transform 0.1s ease',
                        '&:hover': {
                          backgroundColor: colors.secondaryBg || 'rgba(255, 255, 255, 0.05)',
                          transform: 'translateX(2px)'
                        }
                      }}
                    >
                      <SidebarButton 
                        theme={theme}
                        onClick={() => handleChatSelectWithTheme(chat)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          padding: '8px 12px',
                          backgroundColor: 'transparent',
                          '&:hover': {
                            backgroundColor: 'transparent'
                          }
                        }}
                      >
                        <ChatIcon style={{ 
                          marginRight: '8px',
                          flexShrink: 0,
                          color: colors.primaryText || '#FFFFFF'
                        }} />
                        <span style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {chat.title}
                        </span>
                      </SidebarButton>
                      <div style={{ 
                        position: 'absolute', 
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        gap: '4px',
                        backgroundColor: colors.primaryBg || '#1E1E1E',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                      }}>
                        <ActionButton 
                          theme={theme}
                          onClick={(e) => handleToggleStar(chat.id, e)}
                          title="Star chat"
                          style={{ 
                            color: colors.tertiaryText || '#AAAAAA',
                            padding: '4px',
                            minWidth: '24px',
                            '&:hover': {
                              color: '#FFD700',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          <StarIcon 
                            fontSize="small"
                            sx={{ 
                              fill: 'transparent',
                              stroke: colors.tertiaryText || '#AAAAAA',
                              strokeWidth: 1.5
                            }} 
                          />
                        </ActionButton>
                        <ActionButton 
                          theme={theme}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this chat?')) {
                              deleteChat(chat.id);
                            }
                          }}
                          title="Delete chat"
                          style={{ 
                            padding: '4px',
                            minWidth: '24px',
                            '&:hover': {
                              color: colors.error || '#ff4444',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </ActionButton>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '0 16px', color: colors.tertiaryText || '#AAAAAA', fontSize: '13px' }}>
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
              {profile.email && !sidebarCollapsed && (
                <div style={{ 
                  fontSize: '12px', 
                  color: colors.tertiaryText || '#AAAAAA',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {profile.email}
                </div>
              )}
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
          </ProfileSection>
          
          <FileInput 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
          />
          
          <ToggleButton theme={theme} onClick={toggleSidebar}>
            {sidebarCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </ToggleButton>
        </SidebarContainer>
      </SidebarWrapper>
    </>
  );
};

export default Sidebar;